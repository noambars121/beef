import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const caseCategory = v.union(
  v.literal("food"),
  v.literal("relationships"),
  v.literal("roommates"),
  v.literal("work"),
  v.literal("money"),
  v.literal("gaming"),
  v.literal("petty"),
  v.literal("other")
);

export const partySide = v.union(v.literal("A"), v.literal("B"));

export const reactionType = v.union(
  v.literal("shock"),
  v.literal("laugh"),
  v.literal("agree")
);

export const caseStatus = v.union(v.literal("open"), v.literal("closed"));

export const appealOutcome = v.union(
  v.literal("upheld"),
  v.literal("overturned")
);

export const sideScores = v.object({
  logic: v.number(),
  evidence: v.number(),
});

/** Lifecycle of the on-chain seal on Monad testnet. */
export const monadSealStatus = v.union(
  v.literal("pending"),
  v.literal("sealed"),
  v.literal("failed")
);

export const verdictScores = v.object({
  A: sideScores,
  B: sideScores,
});

export default defineSchema({
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),

  cases: defineTable({
    title: v.string(),
    category: caseCategory,
    status: caseStatus,
    docket_no: v.number(),
    created_at: v.number(),
    last_activity_at: v.number(),
    viral_seed: v.number(),
    viral_rank: v.number(),
    owner_session_id: v.string(),
    // JURY MODE: while enabled and now < jury_expires_at the AI verdict stays
    // sealed for EVERYONE (pure social poll). Optional for pre-jury rows;
    // absent means disabled.
    jury_enabled: v.optional(v.boolean()),
    /** Epoch ms when the jury window closes (created_at + 5 min). */
    jury_expires_at: v.optional(v.number()),
    deliberating: v.boolean(),
    // When the current deliberation lock was taken; lets a crashed run be
    // reclaimed instead of bricking the case forever.
    deliberation_started_at: v.optional(v.number()),
    deliberation_error: v.union(v.string(), v.null()),
    /** 0–100 progress while the judge agent is working */
    deliberation_progress: v.optional(v.number()),
    /** Short arcade-style phase label for the UI terminal log */
    deliberation_phase: v.optional(v.string()),
    appealing: v.boolean(),
    appeal_started_at: v.optional(v.number()),
    appeal_error: v.union(v.string(), v.null()),
    appeal_progress: v.optional(v.number()),
    appeal_phase: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_status_viral_rank", ["status", "viral_rank"])
    .index("by_owner", ["owner_session_id"])
    .index("by_docket", ["docket_no"]),

  parties: defineTable({
    case_id: v.id("cases"),
    side: partySide,
    display_name: v.union(v.string(), v.null()),
    argument_text: v.string(),
    evidence_summary: v.union(v.string(), v.null()),
  }).index("by_case", ["case_id"]),

  verdicts: defineTable({
    case_id: v.id("cases"),
    winner_side: partySide,
    short_verdict: v.string(),
    full_reasoning: v.string(),
    roast_line: v.string(),
    share_image_url: v.string(),
    scores: v.optional(verdictScores),
    shame_score: v.optional(v.number()),
    // ---- Monad on-chain court record (BeefVerdictRegistry) ----
    /** Absent on verdicts sealed before the on-chain rollout. */
    monad_status: v.optional(monadSealStatus),
    monad_tx_hash: v.optional(v.string()),
    monad_block_number: v.optional(v.number()),
    monad_sealed_at: v.optional(v.number()),
  }).index("by_case", ["case_id"]),

  appeals: defineTable({
    case_id: v.id("cases"),
    outcome: appealOutcome,
    plea: v.string(),
    ruling: v.string(),
    roast_line: v.string(),
    share_image_url: v.string(),
    created_at: v.number(),
    // ---- Monad on-chain overturn record (only for outcome=overturned) ----
    monad_status: v.optional(monadSealStatus),
    monad_tx_hash: v.optional(v.string()),
  }).index("by_case", ["case_id"]),

  reactions: defineTable({
    case_id: v.id("cases"),
    type: reactionType,
    count: v.number(),
  })
    .index("by_case", ["case_id"])
    .index("by_case_type", ["case_id", "type"]),

  crowdVotes: defineTable({
    case_id: v.id("cases"),
    session_id: v.string(),
    side: partySide,
  })
    .index("by_case", ["case_id"])
    .index("by_case_session", ["case_id", "session_id"]),

  /** Content / safety reports from /report */
  reports: defineTable({
    case_id: v.optional(v.string()),
    category: v.union(
      v.literal("privacy"),
      v.literal("harassment"),
      v.literal("threat"),
      v.literal("copyright"),
      v.literal("impersonation"),
      v.literal("other")
    ),
    explanation: v.string(),
    contact_email: v.optional(v.string()),
    session_id: v.string(),
    created_at: v.number(),
    emailed: v.boolean(),
  }).index("by_created", ["created_at"]),
});
