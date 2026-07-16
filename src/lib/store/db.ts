import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import type {
  Appeal,
  Case,
  CaseCategory,
  CaseEnvelope,
  CrowdState,
  CrowdVoteTally,
  Party,
  PartySide,
  Reaction,
  ReactionType,
  Verdict,
  VerdictTone,
} from "@/types";

export interface InsertCaseInput {
  title: string;
  category: CaseCategory;
  owner_session_id: string;
  /** JURY MODE: seal the verdict for 5 minutes from creation. */
  jury_enabled: boolean;
  side_a: {
    argument_text: string;
    evidence_summary: string | null;
    display_name: string | null;
  };
  side_b: {
    argument_text: string;
    evidence_summary: string | null;
    display_name: string | null;
  };
}

export interface GalleryEntry {
  case: Case;
  parties: Party[];
  verdict: Verdict;
  appeal: Appeal | null;
  reactions: Reaction[];
  /** Time-decayed rank used for ordering and display. */
  heat: number;
}

export interface PrecedentSummary {
  docket_no: number;
  title: string;
  short_verdict: string;
}

export type CastCrowdVoteResult =
  | { status: "not_found" }
  | { status: "owner" }
  | { status: "ok" | "already_voted"; crowd: CrowdState };

function requireConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return url;
}

export async function insertCase(
  input: InsertCaseInput
): Promise<{ case_id: string; status: Case["status"] }> {
  return fetchMutation(api.cases.create, input, {
    url: requireConvexUrl(),
  });
}

export async function getCase(caseId: string): Promise<Case | undefined> {
  const result = await fetchQuery(
    api.cases.get,
    { caseId },
    { url: requireConvexUrl() }
  );
  return result ?? undefined;
}

export async function getParties(caseId: string): Promise<Party[]> {
  return fetchQuery(
    api.cases.getParties,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function getVerdict(caseId: string): Promise<Verdict | undefined> {
  const result = await fetchQuery(
    api.cases.getVerdict,
    { caseId },
    { url: requireConvexUrl() }
  );
  return result ?? undefined;
}

export async function getAppeal(caseId: string): Promise<Appeal | undefined> {
  const result = await fetchQuery(
    api.cases.getAppeal,
    { caseId },
    { url: requireConvexUrl() }
  );
  return result ?? undefined;
}

export async function getReactions(caseId: string): Promise<Reaction[]> {
  return fetchQuery(
    api.cases.getReactions,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function listPrecedents(
  caseId: string,
  limit = 3
): Promise<PrecedentSummary[]> {
  return fetchQuery(
    api.cases.listPrecedents,
    { excludeCaseId: caseId, limit },
    { url: requireConvexUrl() }
  );
}

export async function insertVerdict(
  input: Omit<Verdict, "id">
): Promise<Verdict> {
  return fetchMutation(
    api.cases.insertVerdict,
    {
      caseId: input.case_id,
      winner_side: input.winner_side,
      short_verdict: input.short_verdict,
      full_reasoning: input.full_reasoning,
      roast_line: input.roast_line,
      share_image_url: input.share_image_url,
      scores: input.scores,
      shame_score: input.shame_score,
    },
    { url: requireConvexUrl() }
  );
}

export async function insertAppeal(
  input: Omit<Appeal, "id" | "created_at">
): Promise<Appeal> {
  return fetchMutation(
    api.cases.insertAppeal,
    {
      caseId: input.case_id,
      outcome: input.outcome,
      plea: input.plea,
      ruling: input.ruling,
      roast_line: input.roast_line,
      share_image_url: input.share_image_url,
    },
    { url: requireConvexUrl() }
  );
}

export async function setViralSeed(
  caseId: string,
  seed: number
): Promise<void> {
  await fetchMutation(
    api.cases.setViralSeed,
    { caseId, seed },
    { url: requireConvexUrl() }
  );
}

export async function addViralSeedBonus(
  caseId: string,
  bonus: number
): Promise<void> {
  await fetchMutation(
    api.cases.addViralSeedBonus,
    { caseId, bonus },
    { url: requireConvexUrl() }
  );
}

export async function incrementReaction(
  caseId: string,
  type: ReactionType
): Promise<{ reactions: Reaction[]; viral_rank: number } | undefined> {
  const result = await fetchMutation(
    api.cases.incrementReaction,
    { caseId, type },
    { url: requireConvexUrl() }
  );
  return result ?? undefined;
}

export async function listGalleryEntries(limit = 60): Promise<GalleryEntry[]> {
  return fetchQuery(
    api.cases.listGallery,
    { limit },
    { url: requireConvexUrl() }
  );
}

export async function getCaseEnvelope(
  caseId: string,
  viewerSessionId?: string
): Promise<CaseEnvelope | undefined> {
  const result = await fetchQuery(
    api.cases.getEnvelope,
    // Convex queries must stay deterministic, so the wall clock that decides
    // whether the jury window is still open is injected here.
    { caseId, viewerSessionId, now: Date.now() },
    { url: requireConvexUrl() }
  );
  return (result as CaseEnvelope | null) ?? undefined;
}

export async function getCrowdTally(caseId: string): Promise<CrowdVoteTally> {
  return fetchQuery(
    api.cases.getCrowdTally,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function acquireDeliberationLock(
  caseId: string,
  requesterSessionId?: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  return fetchMutation(
    api.cases.tryLockDeliberation,
    { caseId, requesterSessionId },
    { url: requireConvexUrl() }
  );
}

export async function enqueueDeliberation(
  caseId: string,
  tone?: VerdictTone,
  requesterSessionId?: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  return fetchMutation(
    api.cases.enqueueDeliberation,
    { caseId, tone, requesterSessionId },
    { url: requireConvexUrl() }
  );
}

export async function unlockDeliberation(caseId: string): Promise<void> {
  await fetchMutation(
    api.cases.unlockDeliberation,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function recordDeliberationError(
  caseId: string,
  message: string
): Promise<void> {
  await fetchMutation(
    api.cases.recordDeliberationError,
    { caseId, message },
    { url: requireConvexUrl() }
  );
}

export async function clearDeliberationError(caseId: string): Promise<void> {
  await fetchMutation(
    api.cases.clearDeliberationError,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function setDeliberationProgress(
  caseId: string,
  progress: number,
  phase?: string
): Promise<void> {
  await fetchMutation(
    api.cases.setDeliberationProgress,
    { caseId, progress, phase },
    { url: requireConvexUrl() }
  );
}

export async function acquireAppealLock(
  caseId: string,
  requesterSessionId?: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  return fetchMutation(
    api.cases.tryLockAppeal,
    { caseId, requesterSessionId },
    { url: requireConvexUrl() }
  );
}

export async function enqueueAppeal(
  caseId: string,
  plea: string,
  requesterSessionId?: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  return fetchMutation(
    api.cases.enqueueAppeal,
    { caseId, plea, requesterSessionId },
    { url: requireConvexUrl() }
  );
}

export async function unlockAppeal(caseId: string): Promise<void> {
  await fetchMutation(
    api.cases.unlockAppeal,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function recordAppealError(
  caseId: string,
  message: string
): Promise<void> {
  await fetchMutation(
    api.cases.recordAppealError,
    { caseId, message },
    { url: requireConvexUrl() }
  );
}

export async function clearAppealError(caseId: string): Promise<void> {
  await fetchMutation(
    api.cases.clearAppealError,
    { caseId },
    { url: requireConvexUrl() }
  );
}

export async function setAppealProgress(
  caseId: string,
  progress: number,
  phase?: string
): Promise<void> {
  await fetchMutation(
    api.cases.setAppealProgress,
    { caseId, progress, phase },
    { url: requireConvexUrl() }
  );
}

export async function castCrowdVote(
  caseId: string,
  sessionId: string,
  side: PartySide
): Promise<CastCrowdVoteResult> {
  return fetchMutation(
    api.cases.castCrowdVote,
    { caseId, sessionId, side },
    { url: requireConvexUrl() }
  );
}
