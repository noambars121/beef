import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const REACTION_TYPE_VALUES = ["shock", "laugh", "agree"] as const;

// JURY MODE window: how long the AI verdict stays sealed after case creation
// while the crowd votes blind. Mirrored as JURY_WINDOW_MINUTES in
// src/types/index.ts for UI copy — keep them in sync.
export const JURY_WINDOW_MS = 5 * 60 * 1000;

export const REACTION_WEIGHTS = {
  shock: 3,
  laugh: 2,
  agree: 1,
} as const;

export function toCase(doc: Doc<"cases">) {
  return {
    id: doc._id as string,
    docket_no: doc.docket_no,
    title: doc.title,
    category: doc.category,
    status: doc.status,
    created_at: new Date(doc.created_at).toISOString(),
    last_activity_at: new Date(doc.last_activity_at).toISOString(),
    viral_rank: doc.viral_rank,
    jury_enabled: doc.jury_enabled ?? false,
    jury_expires_at:
      doc.jury_expires_at !== undefined
        ? new Date(doc.jury_expires_at).toISOString()
        : null,
  };
}

export function toParty(doc: Doc<"parties">) {
  return {
    id: doc._id as string,
    case_id: doc.case_id as string,
    side: doc.side,
    display_name: doc.display_name,
    argument_text: doc.argument_text,
    evidence_summary: doc.evidence_summary,
  };
}

export function toVerdict(doc: Doc<"verdicts">) {
  return {
    id: doc._id as string,
    case_id: doc.case_id as string,
    winner_side: doc.winner_side,
    short_verdict: doc.short_verdict,
    full_reasoning: doc.full_reasoning,
    roast_line: doc.roast_line,
    share_image_url: doc.share_image_url,
    scores: doc.scores,
    shame_score: doc.shame_score,
    monad_status: doc.monad_status ?? null,
    monad_tx_hash: doc.monad_tx_hash ?? null,
    monad_block_number: doc.monad_block_number ?? null,
  };
}

export function toAppeal(doc: Doc<"appeals">) {
  return {
    id: doc._id as string,
    case_id: doc.case_id as string,
    outcome: doc.outcome,
    plea: doc.plea,
    ruling: doc.ruling,
    roast_line: doc.roast_line,
    share_image_url: doc.share_image_url,
    created_at: new Date(doc.created_at).toISOString(),
    monad_status: doc.monad_status ?? null,
    monad_tx_hash: doc.monad_tx_hash ?? null,
  };
}

export function toReaction(doc: Doc<"reactions">) {
  return {
    id: doc._id as string,
    case_id: doc.case_id as string,
    type: doc.type,
    count: doc.count,
  };
}

// Heat decay half-life: rank halves every 72h without engagement, keeping the
// Hall of Shame fresh. Pure read-time math — stored viral_rank is never mutated.
export const HEAT_HALF_LIFE_HOURS = 72;

export function computeHeat(
  viralRank: number,
  lastActivityAt: number,
  now: number
): number {
  const ageHours = Math.max(0, (now - lastActivityAt) / 3_600_000);
  return Math.round(viralRank * Math.pow(0.5, ageHours / HEAT_HALF_LIFE_HOURS));
}

export function reactionWeightSum(
  reactions: Array<{ type: (typeof REACTION_TYPE_VALUES)[number]; count: number }>
): number {
  return reactions.reduce(
    (rank, r) => rank + r.count * REACTION_WEIGHTS[r.type],
    0
  );
}

export async function nextDocketNo(ctx: MutationCtx): Promise<number> {
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", "docket"))
    .unique();

  if (!existing) {
    await ctx.db.insert("counters", { name: "docket", value: 1 });
    return 1;
  }

  const next = existing.value + 1;
  await ctx.db.patch(existing._id, { value: next });
  return next;
}

export async function recomputeViralRank(
  ctx: MutationCtx,
  caseId: Id<"cases">,
  viralSeed: number
): Promise<number> {
  const reactions = await ctx.db
    .query("reactions")
    .withIndex("by_case", (q) => q.eq("case_id", caseId))
    .collect();
  return viralSeed + reactionWeightSum(reactions);
}
