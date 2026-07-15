import { ApiError } from "@/lib/api-error";
import {
  createFollowUpRun,
  createVerdictAgent,
  isCursorConfigured,
  pollRunUntilComplete,
} from "@/lib/cursor/client";
import * as db from "@/lib/store/db";
import type { Appeal, Case, Party, PartySide, Verdict, VerdictTone } from "@/types";
import { effectiveWinnerSide, partyLabel } from "@/types";
import {
  computeWeightedScore,
  estimateShameScore,
  parseAppealAnalysis,
  parseVerdictAnalysis,
  resolveWinnerSide,
  type VerdictAnalysis,
} from "./analysis";
import {
  buildAppealPrompt,
  buildAppealRepairPrompt,
  buildRepairPrompt,
  buildVerdictPrompt,
} from "./prompt";

const MAX_ANALYSIS_ATTEMPTS = 3;

// Successful appeals inject fresh heat into the board: drama is viral.
const APPEAL_UPHELD_SEED_BONUS = 8;
const APPEAL_OVERTURNED_SEED_BONUS = 20;

export interface GenerateVerdictOptions {
  tone?: VerdictTone;
  requesterSessionId?: string;
}

/**
 * Fire-and-forget entry point for the REST layer: all guards run first
 * (so the route can answer 403/404/409/503 immediately), then the deliberation
 * loop continues in-process. Move the loop to a queue/worker before deploying
 * to serverless, where background work dies with the request.
 */
export async function startVerdictGeneration(
  caseId: string,
  options: GenerateVerdictOptions = {}
): Promise<void> {
  await acquireDeliberation(caseId, options);
  void runDeliberationLoop(caseId, options).catch(() => {
    // Failure is already recorded on the case by runDeliberationLoop.
  });
}

export async function generateVerdict(
  caseId: string,
  options: GenerateVerdictOptions = {}
): Promise<Verdict> {
  await acquireDeliberation(caseId, options);
  return runDeliberationLoop(caseId, options);
}

async function acquireDeliberation(
  caseId: string,
  options: GenerateVerdictOptions
): Promise<void> {
  if (!isCursorConfigured()) {
    throw new ApiError("CURSOR_API_KEY is not configured on the server", 503);
  }

  const lock = await db.acquireDeliberationLock(
    caseId,
    options.requesterSessionId
  );
  if (!lock.ok) {
    throw new ApiError(lock.error, lock.status);
  }
}

/**
 * The workflow loop:
 *   1. Send the case to the judge (Cursor agent running the configured model),
 *      with the court's standing precedents attached.
 *   2. Poll the run until it reaches a terminal state.
 *   3. Parse + validate the ruling (strict JSON schema, winner must follow the
 *      weighted logic scores).
 *   4. On invalid output, send a repair follow-up to the same agent and loop.
 *   5. On success: persist the Verdict (scores + shame included), seed the
 *      viral rank from the shame assessment, close the Case.
 */
async function runDeliberationLoop(
  caseId: string,
  options: GenerateVerdictOptions
): Promise<Verdict> {
  const report = (progress: number, phase: string) =>
    db.setDeliberationProgress(caseId, progress, phase).catch(() => undefined);

  try {
    await report(12, "READING THE DOCKET...");
    const caseRecord = await db.getCase(caseId);
    if (!caseRecord) {
      throw new ApiError("Case not found", 404);
    }

    const parties = await db.getParties(caseId);
    const sideA = parties.find((p) => p.side === "A");
    const sideB = parties.find((p) => p.side === "B");
    if (!sideA || !sideB) {
      throw new ApiError("Case is missing one of its parties", 422);
    }

    const tone: VerdictTone = options.tone ?? "savage";

    await report(22, "PULLING PRECEDENTS...");
    // Precedents are read before deliberation so the judge cites only rulings
    // that already existed when this case was heard.
    const precedents = await db.listPrecedents(caseId, 3);

    await report(32, "BRIEFING THE JUDGE...");
    const prompt = buildVerdictPrompt(
      caseRecord,
      sideA,
      sideB,
      tone,
      precedents
    );
    const { agent, run } = await createVerdictAgent(prompt, caseRecord.title);

    let activeRunId = run.id;
    let lastFailure = "";

    for (let attempt = 1; attempt <= MAX_ANALYSIS_ATTEMPTS; attempt++) {
      const pollFloor = attempt === 1 ? 40 : 70 + (attempt - 2) * 6;
      const pollCeil = attempt === 1 ? 72 : 88;

      await report(
        pollFloor,
        attempt === 1
          ? "JUDGE IS THINKING..."
          : `REPAIR PASS ${attempt - 1}/${MAX_ANALYSIS_ATTEMPTS - 1}...`
      );

      const completed = await pollRunUntilComplete(agent.id, activeRunId, {
        onPoll: async ({ attempt: pollAttempt, maxAttempts, status }) => {
          const t = pollAttempt / Math.max(1, maxAttempts - 1);
          // Ease toward the ceiling while the Cursor run is still live.
          const progress = pollFloor + (pollCeil - pollFloor) * Math.min(1, t);
          const phase =
            status === "CREATING"
              ? "SPINNING UP THE BENCH..."
              : attempt === 1
                ? "WEIGHING ARGUMENTS..."
                : `REWRITING THE RULING (${attempt - 1})...`;
          await report(progress, phase);
        },
      });

      if (completed.status !== "FINISHED" || !completed.result) {
        throw new ApiError(
          `Deliberation ended abnormally (${completed.status})`,
          502
        );
      }

      await report(attempt === 1 ? 78 : 90, "PARSING THE RULING...");
      const parsed = parseVerdictAnalysis(completed.result);

      if (parsed.ok) {
        await report(92, "SEALING THE VERDICT...");
        const winnerSide = resolveWinnerSide(parsed.analysis);
        const shameScore =
          parsed.analysis.shame_score ?? estimateShameScore(parsed.analysis);

        const verdict = await db.insertVerdict({
          case_id: caseId,
          winner_side: winnerSide,
          short_verdict: parsed.analysis.short_verdict,
          full_reasoning: parsed.analysis.full_reasoning,
          roast_line: parsed.analysis.roast_line,
          scores: parsed.analysis.scores,
          shame_score: shameScore,
          share_image_url: buildShareImagePath(
            caseRecord,
            sideA,
            sideB,
            winnerSide,
            parsed.analysis
          ),
        });
        await db.setViralSeed(caseId, shameScore);
        await db.clearDeliberationError(caseId);
        await report(100, "VERDICT SEALED");
        return verdict;
      }

      lastFailure = parsed.error;
      if (attempt < MAX_ANALYSIS_ATTEMPTS) {
        await report(74 + attempt * 4, "JUDGE REJECTED DRAFT — REPAIRING...");
        const followUp = await createFollowUpRun(
          agent.id,
          buildRepairPrompt(parsed.error)
        );
        activeRunId = followUp.id;
      }
    }

    throw new ApiError(
      `The judge returned an unusable ruling after ${MAX_ANALYSIS_ATTEMPTS} attempts: ${lastFailure}`,
      502
    );
  } catch (error) {
    const wrapped =
      error instanceof ApiError
        ? error
        : new ApiError(
            error instanceof Error
              ? error.message
              : "Unknown deliberation failure",
            502
          );
    await db.recordDeliberationError(caseId, wrapped.message);
    throw wrapped;
  } finally {
    await db.unlockDeliberation(caseId);
  }
}

// ---- Appeal flow ----

export interface GenerateAppealOptions {
  plea: string;
  requesterSessionId?: string;
}

/** Fire-and-forget twin of startVerdictGeneration for the appellate instance. */
export async function startAppealGeneration(
  caseId: string,
  options: GenerateAppealOptions
): Promise<void> {
  await acquireAppeal(caseId, options);
  void runAppealLoop(caseId, options).catch(() => {
    // Failure is already recorded on the case by runAppealLoop.
  });
}

async function acquireAppeal(
  caseId: string,
  options: GenerateAppealOptions
): Promise<void> {
  if (!isCursorConfigured()) {
    throw new ApiError("CURSOR_API_KEY is not configured on the server", 503);
  }

  const lock = await db.acquireAppealLock(caseId, options.requesterSessionId);
  if (!lock.ok) {
    throw new ApiError(lock.error, lock.status);
  }
}

async function runAppealLoop(
  caseId: string,
  options: GenerateAppealOptions
): Promise<Appeal> {
  const report = (progress: number, phase: string) =>
    db.setAppealProgress(caseId, progress, phase).catch(() => undefined);

  try {
    await report(12, "OPENING THE APPELLATE DOCKET...");
    const caseRecord = await db.getCase(caseId);
    const verdict = await db.getVerdict(caseId);
    if (!caseRecord || !verdict) {
      throw new ApiError("Case not found", 404);
    }

    const parties = await db.getParties(caseId);
    const sideA = parties.find((p) => p.side === "A");
    const sideB = parties.find((p) => p.side === "B");
    if (!sideA || !sideB) {
      throw new ApiError("Case is missing one of its parties", 422);
    }

    const appellantSide: PartySide = verdict.winner_side === "A" ? "B" : "A";

    await report(28, "BRIEFING THE APPELLATE BENCH...");
    // A fresh agent gets the full trial record; no dependency on the original
    // deliberation agent still existing on Cursor's side.
    const prompt = buildAppealPrompt(
      caseRecord,
      sideA,
      sideB,
      verdict,
      appellantSide,
      options.plea,
      "savage"
    );
    const { agent, run } = await createVerdictAgent(
      prompt,
      `Appeal: ${caseRecord.title.slice(0, 70)}`
    );

    let activeRunId = run.id;
    let lastFailure = "";

    for (let attempt = 1; attempt <= MAX_ANALYSIS_ATTEMPTS; attempt++) {
      const pollFloor = attempt === 1 ? 40 : 70 + (attempt - 2) * 6;
      const pollCeil = attempt === 1 ? 72 : 88;

      await report(
        pollFloor,
        attempt === 1
          ? "APPELLATE COURT DELIBERATING..."
          : `APPEAL REPAIR ${attempt - 1}/${MAX_ANALYSIS_ATTEMPTS - 1}...`
      );

      const completed = await pollRunUntilComplete(agent.id, activeRunId, {
        onPoll: async ({ attempt: pollAttempt, maxAttempts, status }) => {
          const t = pollAttempt / Math.max(1, maxAttempts - 1);
          const progress = pollFloor + (pollCeil - pollFloor) * Math.min(1, t);
          const phase =
            status === "CREATING"
              ? "CONVENING THE PANEL..."
              : "HEARING THE APPEAL...";
          await report(progress, phase);
        },
      });

      if (completed.status !== "FINISHED" || !completed.result) {
        throw new ApiError(
          `Appeal hearing ended abnormally (${completed.status})`,
          502
        );
      }

      await report(attempt === 1 ? 78 : 90, "READING THE APPELLATE RULING...");
      const parsed = parseAppealAnalysis(completed.result);

      if (parsed.ok) {
        await report(92, "ENTERING THE APPEAL...");
        const appeal = await db.insertAppeal({
          case_id: caseId,
          outcome: parsed.analysis.outcome,
          plea: options.plea,
          ruling: parsed.analysis.ruling,
          roast_line: parsed.analysis.roast_line,
          share_image_url: buildAppealShareImagePath(
            caseRecord,
            sideA,
            sideB,
            verdict,
            parsed.analysis.outcome,
            parsed.analysis.roast_line
          ),
        });
        await db.addViralSeedBonus(
          caseId,
          appeal.outcome === "overturned"
            ? APPEAL_OVERTURNED_SEED_BONUS
            : APPEAL_UPHELD_SEED_BONUS
        );
        await db.clearAppealError(caseId);
        await report(100, "APPEAL CLOSED");
        return appeal;
      }

      lastFailure = parsed.error;
      if (attempt < MAX_ANALYSIS_ATTEMPTS) {
        await report(74 + attempt * 4, "APPEAL DRAFT REJECTED — REPAIRING...");
        const followUp = await createFollowUpRun(
          agent.id,
          buildAppealRepairPrompt(parsed.error)
        );
        activeRunId = followUp.id;
      }
    }

    throw new ApiError(
      `The appellate court returned an unusable ruling after ${MAX_ANALYSIS_ATTEMPTS} attempts: ${lastFailure}`,
      502
    );
  } catch (error) {
    const wrapped =
      error instanceof ApiError
        ? error
        : new ApiError(
            error instanceof Error ? error.message : "Unknown appeal failure",
            502
          );
    await db.recordAppealError(caseId, wrapped.message);
    throw wrapped;
  } finally {
    await db.unlockAppeal(caseId);
  }
}

// ---- Share image URLs ----

function buildShareImagePath(
  caseRecord: Case,
  sideA: Party,
  sideB: Party,
  winnerSide: PartySide,
  analysis: VerdictAnalysis
): string {
  const params = new URLSearchParams({
    title: caseRecord.title.slice(0, 90),
    winner: winnerSide,
    verdict: analysis.short_verdict.slice(0, 140),
    roast: analysis.roast_line.slice(0, 160),
    case: String(caseRecord.docket_no),
    na: partyLabel("A", sideA.display_name).slice(0, 24),
    nb: partyLabel("B", sideB.display_name).slice(0, 24),
    wa: String(computeWeightedScore(analysis.scores.A)),
    wb: String(computeWeightedScore(analysis.scores.B)),
  });
  return `/api/og?${params.toString()}`;
}

function buildAppealShareImagePath(
  caseRecord: Case,
  sideA: Party,
  sideB: Party,
  verdict: Verdict,
  outcome: Appeal["outcome"],
  roastLine: string
): string {
  const finalWinner = effectiveWinnerSide(verdict, { outcome });
  const params = new URLSearchParams({
    title: caseRecord.title.slice(0, 90),
    winner: finalWinner,
    verdict:
      outcome === "overturned"
        ? "VERDICT OVERTURNED ON APPEAL"
        : "VERDICT UPHELD ON APPEAL",
    roast: roastLine.slice(0, 160),
    case: String(caseRecord.docket_no),
    na: partyLabel("A", sideA.display_name).slice(0, 24),
    nb: partyLabel("B", sideB.display_name).slice(0, 24),
    stamp: outcome,
  });
  if (verdict.scores) {
    params.set("wa", String(computeWeightedScore(verdict.scores.A)));
    params.set("wb", String(computeWeightedScore(verdict.scores.B)));
  }
  return `/api/og?${params.toString()}`;
}
