"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { internalAction } from "./_generated/server";
import {
  createFollowUpRun,
  createVerdictAgent,
  isCursorConfigured,
  pollRunUntilComplete,
} from "./lib/cursorClient";
import {
  computeWeightedScore,
  estimateShameScore,
  parseAppealAnalysis,
  parseVerdictAnalysis,
  resolveWinnerSide,
} from "./lib/verdictAnalysis";
import {
  buildAppealPrompt,
  buildAppealRepairPrompt,
  buildAppealShareImagePath,
  buildRepairPrompt,
  buildShareImagePath,
  buildVerdictPrompt,
} from "./lib/verdictPrompt";

const MAX_ANALYSIS_ATTEMPTS = 3;
const APPEAL_UPHELD_SEED_BONUS = 8;
const APPEAL_OVERTURNED_SEED_BONUS = 20;

const toneValidator = v.union(
  v.literal("savage"),
  v.literal("sharp"),
  v.literal("balanced")
);

/**
 * Durable deliberation worker. Scheduled from enqueueDeliberation so the
 * Next.js serverless request can return 202 without killing the loop.
 */
export const runDeliberation = internalAction({
  args: {
    caseId: v.string(),
    tone: toneValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = async (progress: number, phase: string) => {
      try {
        await ctx.runMutation(api.cases.setDeliberationProgress, {
          caseId: args.caseId,
          progress,
          phase,
        });
      } catch {
        // Progress is best-effort.
      }
    };

    try {
      if (!isCursorConfigured()) {
        throw new Error("CURSOR_API_KEY is not configured on Convex");
      }

      await report(12, "READING THE DOCKET...");
      const caseRecord = await ctx.runQuery(api.cases.get, {
        caseId: args.caseId,
      });
      if (!caseRecord) {
        throw new Error("Case not found");
      }

      const parties = await ctx.runQuery(api.cases.getParties, {
        caseId: args.caseId,
      });
      const sideA = parties.find((p) => p.side === "A");
      const sideB = parties.find((p) => p.side === "B");
      if (!sideA || !sideB) {
        throw new Error("Case is missing one of its parties");
      }

      await report(22, "PULLING PRECEDENTS...");
      const precedents = await ctx.runQuery(api.cases.listPrecedents, {
        excludeCaseId: args.caseId,
        limit: 3,
      });

      await report(32, "BRIEFING THE JUDGE...");
      const prompt = buildVerdictPrompt(
        caseRecord,
        sideA,
        sideB,
        args.tone,
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
            const progress =
              pollFloor + (pollCeil - pollFloor) * Math.min(1, t);
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
          throw new Error(
            `Deliberation ended abnormally (${completed.status})`
          );
        }

        await report(attempt === 1 ? 78 : 90, "PARSING THE RULING...");
        const parsed = parseVerdictAnalysis(completed.result);

        if (parsed.ok) {
          await report(92, "SEALING THE VERDICT...");
          const winnerSide = resolveWinnerSide(parsed.analysis);
          const shameScore =
            parsed.analysis.shame_score ??
            estimateShameScore(parsed.analysis);

          await ctx.runMutation(api.cases.insertVerdict, {
            caseId: args.caseId,
            winner_side: winnerSide,
            short_verdict: parsed.analysis.short_verdict,
            full_reasoning: parsed.analysis.full_reasoning,
            roast_line: parsed.analysis.roast_line,
            share_image_url: buildShareImagePath(
              caseRecord,
              sideA,
              sideB,
              winnerSide,
              parsed.analysis,
              computeWeightedScore
            ),
            scores: parsed.analysis.scores,
            shame_score: shameScore,
          });
          await ctx.runMutation(api.cases.setViralSeed, {
            caseId: args.caseId,
            seed: shameScore,
          });
          await ctx.runMutation(api.cases.clearDeliberationError, {
            caseId: args.caseId,
          });
          await report(100, "VERDICT SEALED");
          return null;
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

      throw new Error(
        `The judge returned an unusable ruling after ${MAX_ANALYSIS_ATTEMPTS} attempts: ${lastFailure}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown deliberation failure";
      console.error("[runDeliberation]", args.caseId, message);
      await ctx.runMutation(api.cases.recordDeliberationError, {
        caseId: args.caseId,
        message,
      });
    } finally {
      await ctx.runMutation(api.cases.unlockDeliberation, {
        caseId: args.caseId,
      });
    }

    return null;
  },
});

export const runAppeal = internalAction({
  args: {
    caseId: v.string(),
    plea: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = async (progress: number, phase: string) => {
      try {
        await ctx.runMutation(api.cases.setAppealProgress, {
          caseId: args.caseId,
          progress,
          phase,
        });
      } catch {
        // Progress is best-effort.
      }
    };

    try {
      if (!isCursorConfigured()) {
        throw new Error("CURSOR_API_KEY is not configured on Convex");
      }

      await report(12, "OPENING THE APPELLATE DOCKET...");
      const caseRecord = await ctx.runQuery(api.cases.get, {
        caseId: args.caseId,
      });
      const verdict = await ctx.runQuery(api.cases.getVerdict, {
        caseId: args.caseId,
      });
      if (!caseRecord || !verdict) {
        throw new Error("Case not found");
      }

      const parties = await ctx.runQuery(api.cases.getParties, {
        caseId: args.caseId,
      });
      const sideA = parties.find((p) => p.side === "A");
      const sideB = parties.find((p) => p.side === "B");
      if (!sideA || !sideB) {
        throw new Error("Case is missing one of its parties");
      }

      const appellantSide = verdict.winner_side === "A" ? "B" : "A";

      await report(28, "BRIEFING THE APPELLATE BENCH...");
      const prompt = buildAppealPrompt(
        caseRecord,
        sideA,
        sideB,
        verdict,
        appellantSide,
        args.plea,
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
            const progress =
              pollFloor + (pollCeil - pollFloor) * Math.min(1, t);
            const phase =
              status === "CREATING"
                ? "CONVENING THE PANEL..."
                : "HEARING THE APPEAL...";
            await report(progress, phase);
          },
        });

        if (completed.status !== "FINISHED" || !completed.result) {
          throw new Error(
            `Appeal hearing ended abnormally (${completed.status})`
          );
        }

        await report(attempt === 1 ? 78 : 90, "READING THE APPELLATE RULING...");
        const parsed = parseAppealAnalysis(completed.result);

        if (parsed.ok) {
          await report(92, "ENTERING THE APPEAL...");
          await ctx.runMutation(api.cases.insertAppeal, {
            caseId: args.caseId,
            outcome: parsed.analysis.outcome,
            plea: args.plea,
            ruling: parsed.analysis.ruling,
            roast_line: parsed.analysis.roast_line,
            share_image_url: buildAppealShareImagePath(
              caseRecord,
              sideA,
              sideB,
              verdict,
              parsed.analysis.outcome,
              parsed.analysis.roast_line,
              computeWeightedScore
            ),
          });
          await ctx.runMutation(api.cases.addViralSeedBonus, {
            caseId: args.caseId,
            bonus:
              parsed.analysis.outcome === "overturned"
                ? APPEAL_OVERTURNED_SEED_BONUS
                : APPEAL_UPHELD_SEED_BONUS,
          });
          await ctx.runMutation(api.cases.clearAppealError, {
            caseId: args.caseId,
          });
          await report(100, "APPEAL CLOSED");
          return null;
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

      throw new Error(
        `The appellate court returned an unusable ruling after ${MAX_ANALYSIS_ATTEMPTS} attempts: ${lastFailure}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown appeal failure";
      console.error("[runAppeal]", args.caseId, message);
      await ctx.runMutation(api.cases.recordAppealError, {
        caseId: args.caseId,
        message,
      });
    } finally {
      await ctx.runMutation(api.cases.unlockAppeal, {
        caseId: args.caseId,
      });
    }

    return null;
  },
});
