import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  appealOutcome,
  caseCategory,
  partySide,
  reactionType,
  verdictScores,
} from "./schema";
import {
  JURY_WINDOW_MS,
  REACTION_TYPE_VALUES,
  computeHeat,
  nextDocketNo,
  recomputeViralRank,
  toAppeal,
  toCase,
  toParty,
  toReaction,
  toVerdict,
} from "./lib";

/**
 * Malformed or foreign IDs arrive straight from public URLs; normalizeId
 * turns them into a clean "not found" instead of a thrown 500.
 */
async function findCase(
  ctx: QueryCtx | MutationCtx,
  caseId: string
): Promise<Doc<"cases"> | null> {
  const normalized = ctx.db.normalizeId("cases", caseId);
  if (!normalized) return null;
  return ctx.db.get(normalized);
}

// The deliberation loop runs fire-and-forget in the Next process; if that
// process dies mid-run, the lock would stay set forever. Locks older than
// this are considered abandoned and may be reclaimed.
const STALE_LOCK_MS = 10 * 60 * 1000;

function lockIsStale(startedAt: number | undefined, now: number): boolean {
  return startedAt === undefined || now - startedAt > STALE_LOCK_MS;
}

const partyInput = v.object({
  argument_text: v.string(),
  evidence_summary: v.union(v.string(), v.null()),
  display_name: v.union(v.string(), v.null()),
});

export const create = mutation({
  args: {
    title: v.string(),
    category: caseCategory,
    owner_session_id: v.string(),
    side_a: partyInput,
    side_b: partyInput,
    jury_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const docket_no = await nextDocketNo(ctx);
    const juryEnabled = args.jury_enabled === true;

    const caseId = await ctx.db.insert("cases", {
      title: args.title,
      category: args.category,
      status: "open",
      docket_no,
      created_at: now,
      last_activity_at: now,
      viral_seed: 0,
      viral_rank: 0,
      owner_session_id: args.owner_session_id,
      jury_enabled: juryEnabled,
      // The seal window runs from creation, not from verdict delivery — the
      // judge usually finishes deliberating while the jury is still voting.
      ...(juryEnabled ? { jury_expires_at: now + JURY_WINDOW_MS } : {}),
      deliberating: false,
      deliberation_error: null,
      appealing: false,
      appeal_error: null,
    });

    await ctx.db.insert("parties", {
      case_id: caseId,
      side: "A",
      display_name: args.side_a.display_name,
      argument_text: args.side_a.argument_text,
      evidence_summary: args.side_a.evidence_summary,
    });
    await ctx.db.insert("parties", {
      case_id: caseId,
      side: "B",
      display_name: args.side_b.display_name,
      argument_text: args.side_b.argument_text,
      evidence_summary: args.side_b.evidence_summary,
    });

    for (const type of REACTION_TYPE_VALUES) {
      await ctx.db.insert("reactions", {
        case_id: caseId,
        type,
        count: 0,
      });
    }

    const caseRecord = await ctx.db.get(caseId);
    return {
      case_id: caseId as string,
      status: caseRecord!.status,
    };
  },
});

export const getEnvelope = query({
  args: {
    caseId: v.string(),
    viewerSessionId: v.optional(v.string()),
    // Wall-clock time supplied by the caller (Next.js API layer) so this
    // query stays deterministic — never call Date.now() inside a query.
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return null;

    const parties = await ctx.db
      .query("parties")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();

    const verdictDoc = await ctx.db
      .query("verdicts")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();

    const appealDoc = await ctx.db
      .query("appeals")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();

    const votes = await ctx.db
      .query("crowdVotes")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();

    const tally = { A: 0, B: 0 };
    let viewer_vote: "A" | "B" | null = null;
    for (const vote of votes) {
      tally[vote.side] += 1;
      if (
        args.viewerSessionId &&
        vote.session_id === args.viewerSessionId
      ) {
        viewer_vote = vote.side;
      }
    }

    const is_owner = Boolean(
      args.viewerSessionId &&
        caseDoc.owner_session_id === args.viewerSessionId
    );

    // JURY MODE: while the window is open the verdict is sealed for EVERYONE
    // (owner included) — the case is a pure social poll until the judge
    // "enters the court" at jury_expires_at.
    const juryEnabled = caseDoc.jury_enabled === true;
    const juryExpiresAt = juryEnabled ? caseDoc.jury_expires_at ?? null : null;
    const juryActive = juryExpiresAt !== null && args.now < juryExpiresAt;

    const hasVerdict = Boolean(verdictDoc);
    // Outside the jury window the old trap rule applies: owners see the
    // verdict immediately, everyone else must pick a side first.
    const canReveal = !juryActive && (is_owner || viewer_vote !== null);
    const verdict_sealed = hasVerdict && !canReveal;

    return {
      case: toCase(caseDoc),
      parties: parties.map(toParty),
      verdict: !verdict_sealed && verdictDoc ? toVerdict(verdictDoc) : null,
      verdict_sealed,
      appeal: !verdict_sealed && appealDoc ? toAppeal(appealDoc) : null,
      reactions: reactions.map(toReaction),
      crowd: { tally, viewer_vote },
      jury: {
        enabled: juryEnabled,
        active: juryActive,
        expires_at:
          juryExpiresAt !== null
            ? new Date(juryExpiresAt).toISOString()
            : null,
        remaining_ms: juryActive ? juryExpiresAt - args.now : 0,
      },
      deliberation: {
        in_progress: caseDoc.deliberating,
        error: caseDoc.deliberation_error,
        progress: caseDoc.deliberation_progress ?? (caseDoc.deliberating ? 5 : 0),
        phase: caseDoc.deliberation_phase ?? null,
      },
      appeal_state: {
        in_progress: caseDoc.appealing,
        error: caseDoc.appeal_error,
        progress: caseDoc.appeal_progress ?? (caseDoc.appealing ? 5 : 0),
        phase: caseDoc.appeal_phase ?? null,
      },
      viewer: { is_owner },
    };
  },
});

export const get = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    return caseDoc ? toCase(caseDoc) : null;
  },
});

export const getParties = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return [];
    const parties = await ctx.db
      .query("parties")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();
    return parties.map(toParty);
  },
});

export const getVerdict = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return null;
    const verdictDoc = await ctx.db
      .query("verdicts")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();
    return verdictDoc ? toVerdict(verdictDoc) : null;
  },
});

export const getAppeal = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return null;
    const appealDoc = await ctx.db
      .query("appeals")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();
    return appealDoc ? toAppeal(appealDoc) : null;
  },
});

export const getReactions = query({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return [];
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();
    return reactions.map(toReaction);
  },
});

export const getCrowdTally = query({
  args: { caseId: v.string() },
  returns: v.object({ A: v.number(), B: v.number() }),
  handler: async (ctx, args) => {
    const tally = { A: 0, B: 0 };
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return tally;
    const votes = await ctx.db
      .query("crowdVotes")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();
    for (const vote of votes) {
      tally[vote.side] += 1;
    }
    return tally;
  },
});

export const listPrecedents = query({
  args: {
    excludeCaseId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3;
    const closed = await ctx.db
      .query("cases")
      .withIndex("by_status", (q) => q.eq("status", "closed"))
      .order("desc")
      .take(limit + 5);

    const precedents = [];
    for (const caseDoc of closed) {
      if ((caseDoc._id as string) === args.excludeCaseId) continue;
      const verdictDoc = await ctx.db
        .query("verdicts")
        .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
        .unique();
      if (!verdictDoc) continue;
      precedents.push({
        docket_no: caseDoc.docket_no,
        title: caseDoc.title,
        short_verdict: verdictDoc.short_verdict,
      });
      if (precedents.length >= limit) break;
    }
    return precedents;
  },
});

export const listGallery = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 60;
    const now = Date.now();
    const closed = await ctx.db
      .query("cases")
      .withIndex("by_status", (q) => q.eq("status", "closed"))
      .collect();

    // Rank by time-decayed heat so stale drama sinks without data loss.
    const ranked = closed
      .map((caseDoc) => ({
        caseDoc,
        heat: computeHeat(caseDoc.viral_rank, caseDoc.last_activity_at, now),
      }))
      .sort(
        (a, b) =>
          b.heat - a.heat || b.caseDoc.created_at - a.caseDoc.created_at
      );

    const entries = [];
    for (const { caseDoc, heat } of ranked.slice(0, limit)) {
      const verdictDoc = await ctx.db
        .query("verdicts")
        .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
        .unique();
      if (!verdictDoc) continue;

      const parties = await ctx.db
        .query("parties")
        .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
        .collect();

      const appealDoc = await ctx.db
        .query("appeals")
        .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
        .unique();

      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
        .collect();

      entries.push({
        case: toCase(caseDoc),
        parties: parties.map(toParty),
        verdict: toVerdict(verdictDoc),
        appeal: appealDoc ? toAppeal(appealDoc) : null,
        reactions: reactions.map(toReaction),
        heat,
      });
    }

    return entries;
  },
});

export const tryLockDeliberation = mutation({
  args: {
    caseId: v.string(),
    requesterSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) {
      return { ok: false as const, error: "Case not found", status: 404 };
    }

    const existingVerdict = await ctx.db
      .query("verdicts")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();
    if (caseDoc.status === "closed" || existingVerdict) {
      return {
        ok: false as const,
        error: "The verdict has already been delivered",
        status: 409,
      };
    }

    const parties = await ctx.db
      .query("parties")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .collect();
    const hasBothSides =
      parties.some((p) => p.side === "A") &&
      parties.some((p) => p.side === "B");
    if (!hasBothSides) {
      return {
        ok: false as const,
        error: "Case is missing one of its parties",
        status: 422,
      };
    }

    if (
      caseDoc.owner_session_id &&
      caseDoc.owner_session_id !== args.requesterSessionId
    ) {
      return {
        ok: false as const,
        error: "Only the case filer can summon the judge",
        status: 403,
      };
    }

    const now = Date.now();
    if (caseDoc.deliberating && !lockIsStale(caseDoc.deliberation_started_at, now)) {
      return {
        ok: false as const,
        error: "Deliberation is already in progress",
        status: 409,
      };
    }

    await ctx.db.patch(caseDoc._id, {
      deliberating: true,
      deliberation_started_at: now,
      deliberation_error: null,
      deliberation_progress: 5,
      deliberation_phase: "SUMMONING THE JUDGE...",
    });

    return { ok: true as const };
  },
});

export const setDeliberationProgress = mutation({
  args: {
    caseId: v.string(),
    progress: v.number(),
    phase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc || !caseDoc.deliberating) return;
    const progress = Math.max(0, Math.min(100, Math.round(args.progress)));
    // Never move the bar backwards — polls can race.
    const current = caseDoc.deliberation_progress ?? 0;
    if (progress < current) return;
    await ctx.db.patch(caseDoc._id, {
      deliberation_progress: progress,
      ...(args.phase !== undefined ? { deliberation_phase: args.phase } : {}),
    });
  },
});

export const unlockDeliberation = mutation({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    await ctx.db.patch(caseDoc._id, {
      deliberating: false,
      deliberation_progress: 100,
      deliberation_phase: "VERDICT SEALED",
    });
  },
});

export const recordDeliberationError = mutation({
  args: { caseId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    await ctx.db.patch(caseDoc._id, { deliberation_error: args.message });
  },
});

export const clearDeliberationError = mutation({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    await ctx.db.patch(caseDoc._id, { deliberation_error: null });
  },
});

export const insertVerdict = mutation({
  args: {
    caseId: v.string(),
    winner_side: partySide,
    short_verdict: v.string(),
    full_reasoning: v.string(),
    roast_line: v.string(),
    share_image_url: v.string(),
    scores: v.optional(verdictScores),
    shame_score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) throw new Error("Case not found");
    const caseId = caseDoc._id;

    // Idempotency guard: a verdict is written exactly once per case.
    const existing = await ctx.db
      .query("verdicts")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .unique();
    if (existing) return toVerdict(existing);

    const now = Date.now();
    const verdictId = await ctx.db.insert("verdicts", {
      case_id: caseId,
      winner_side: args.winner_side,
      short_verdict: args.short_verdict,
      full_reasoning: args.full_reasoning,
      roast_line: args.roast_line,
      share_image_url: args.share_image_url,
      scores: args.scores,
      shame_score: args.shame_score,
    });

    await ctx.db.patch(caseId, {
      status: "closed",
      deliberating: false,
      deliberation_error: null,
      last_activity_at: now,
    });

    const verdictDoc = await ctx.db.get(verdictId);
    return toVerdict(verdictDoc!);
  },
});

export const setViralSeed = mutation({
  args: { caseId: v.string(), seed: v.number() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    // Shame arrives 0-100 from the judge; half-weight it so crowd reactions
    // can always out-shout the seed. Clamp defensively.
    const seed = Math.round(Math.max(0, Math.min(100, args.seed)) / 2);
    const viral_rank = await recomputeViralRank(ctx, caseDoc._id, seed);
    await ctx.db.patch(caseDoc._id, {
      viral_seed: seed,
      viral_rank,
      last_activity_at: Date.now(),
    });
  },
});

export const addViralSeedBonus = mutation({
  args: { caseId: v.string(), bonus: v.number() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    const viral_seed = Math.max(
      0,
      caseDoc.viral_seed + Math.round(args.bonus)
    );
    const viral_rank = await recomputeViralRank(ctx, caseDoc._id, viral_seed);
    await ctx.db.patch(caseDoc._id, {
      viral_seed,
      viral_rank,
      last_activity_at: Date.now(),
    });
  },
});

export const incrementReaction = mutation({
  args: {
    caseId: v.string(),
    type: reactionType,
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return null;
    const caseId = caseDoc._id;

    let row = await ctx.db
      .query("reactions")
      .withIndex("by_case_type", (q) =>
        q.eq("case_id", caseId).eq("type", args.type)
      )
      .unique();

    if (!row) {
      const id = await ctx.db.insert("reactions", {
        case_id: caseId,
        type: args.type,
        count: 0,
      });
      row = (await ctx.db.get(id))!;
    }

    await ctx.db.patch(row._id, { count: row.count + 1 });

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect();

    const viral_rank = await recomputeViralRank(
      ctx,
      caseId,
      caseDoc.viral_seed
    );
    await ctx.db.patch(caseId, {
      viral_rank,
      last_activity_at: Date.now(),
    });

    return {
      reactions: reactions.map(toReaction),
      viral_rank,
    };
  },
});

export const tryLockAppeal = mutation({
  args: {
    caseId: v.string(),
    requesterSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) {
      return { ok: false as const, error: "Case not found", status: 404 };
    }

    const verdictDoc = await ctx.db
      .query("verdicts")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();
    if (caseDoc.status !== "closed" || !verdictDoc) {
      return {
        ok: false as const,
        error: "There is no verdict to appeal yet",
        status: 409,
      };
    }

    const existingAppeal = await ctx.db
      .query("appeals")
      .withIndex("by_case", (q) => q.eq("case_id", caseDoc._id))
      .unique();
    if (existingAppeal) {
      return {
        ok: false as const,
        error:
          "The appellate court has already ruled. There is no third instance.",
        status: 409,
      };
    }

    if (
      caseDoc.owner_session_id &&
      caseDoc.owner_session_id !== args.requesterSessionId
    ) {
      return {
        ok: false as const,
        error: "Only the case filer can lodge an appeal",
        status: 403,
      };
    }

    const now = Date.now();
    if (caseDoc.appealing && !lockIsStale(caseDoc.appeal_started_at, now)) {
      return {
        ok: false as const,
        error: "The appeal is already being heard",
        status: 409,
      };
    }

    await ctx.db.patch(caseDoc._id, {
      appealing: true,
      appeal_started_at: now,
      appeal_error: null,
      appeal_progress: 5,
      appeal_phase: "FILING THE APPEAL...",
    });

    return { ok: true as const };
  },
});

export const setAppealProgress = mutation({
  args: {
    caseId: v.string(),
    progress: v.number(),
    phase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc || !caseDoc.appealing) return;
    const progress = Math.max(0, Math.min(100, Math.round(args.progress)));
    const current = caseDoc.appeal_progress ?? 0;
    if (progress < current) return;
    await ctx.db.patch(caseDoc._id, {
      appeal_progress: progress,
      ...(args.phase !== undefined ? { appeal_phase: args.phase } : {}),
    });
  },
});

export const unlockAppeal = mutation({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    await ctx.db.patch(caseDoc._id, {
      appealing: false,
      appeal_progress: 100,
      appeal_phase: "APPEAL CLOSED",
    });
  },
});

export const recordAppealError = mutation({
  args: { caseId: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    await ctx.db.patch(caseDoc._id, { appeal_error: args.message });
  },
});

export const clearAppealError = mutation({
  args: { caseId: v.string() },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return;
    await ctx.db.patch(caseDoc._id, { appeal_error: null });
  },
});

export const insertAppeal = mutation({
  args: {
    caseId: v.string(),
    outcome: appealOutcome,
    plea: v.string(),
    ruling: v.string(),
    roast_line: v.string(),
    share_image_url: v.string(),
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) throw new Error("Case not found");
    const caseId = caseDoc._id;

    // Idempotency guard: there is exactly one appellate ruling per case.
    const existing = await ctx.db
      .query("appeals")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .unique();
    if (existing) return toAppeal(existing);

    const now = Date.now();
    const appealId = await ctx.db.insert("appeals", {
      case_id: caseId,
      outcome: args.outcome,
      plea: args.plea,
      ruling: args.ruling,
      roast_line: args.roast_line,
      share_image_url: args.share_image_url,
      created_at: now,
    });

    await ctx.db.patch(caseId, {
      appealing: false,
      appeal_error: null,
      last_activity_at: now,
    });

    const appealDoc = await ctx.db.get(appealId);
    return toAppeal(appealDoc!);
  },
});

/** Dev-only cleanup: removes a case and all related rows. */
export const purgeCase = internalMutation({
  args: { caseId: v.string() },
  returns: v.object({ deleted: v.boolean() }),
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) return { deleted: false };

    const caseId = caseDoc._id;

    for (const row of await ctx.db
      .query("parties")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db
      .query("verdicts")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db
      .query("appeals")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db
      .query("reactions")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db
      .query("crowdVotes")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect()) {
      await ctx.db.delete(row._id);
    }

    await ctx.db.delete(caseId);
    return { deleted: true };
  },
});

export const castCrowdVote = mutation({
  args: {
    caseId: v.string(),
    sessionId: v.string(),
    side: partySide,
  },
  handler: async (ctx, args) => {
    const caseDoc = await findCase(ctx, args.caseId);
    if (!caseDoc) {
      return { status: "not_found" as const };
    }
    const caseId = caseDoc._id;

    if (caseDoc.owner_session_id === args.sessionId) {
      return { status: "owner" as const };
    }

    const existing = await ctx.db
      .query("crowdVotes")
      .withIndex("by_case_session", (q) =>
        q.eq("case_id", caseId).eq("session_id", args.sessionId)
      )
      .unique();

    let status: "ok" | "already_voted" = "ok";
    if (existing) {
      status = "already_voted";
    } else {
      await ctx.db.insert("crowdVotes", {
        case_id: caseId,
        session_id: args.sessionId,
        side: args.side,
      });
      await ctx.db.patch(caseId, { last_activity_at: Date.now() });
    }

    const votes = await ctx.db
      .query("crowdVotes")
      .withIndex("by_case", (q) => q.eq("case_id", caseId))
      .collect();

    const tally = { A: 0, B: 0 };
    let viewer_vote: "A" | "B" | null = null;
    for (const vote of votes) {
      tally[vote.side] += 1;
      if (vote.session_id === args.sessionId) {
        viewer_vote = vote.side;
      }
    }

    return {
      status,
      crowd: { tally, viewer_vote },
    };
  },
});
