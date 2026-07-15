// Core schema for BEEF. Field names are snake_case so every record
// maps 1:1 onto a future SQL/Supabase migration without renaming.

export type CaseStatus = "open" | "closed";
export type PartySide = "A" | "B";

export const CASE_CATEGORY_VALUES = [
  "food",
  "relationships",
  "roommates",
  "work",
  "money",
  "gaming",
  "petty",
  "other",
] as const;
export type CaseCategory = (typeof CASE_CATEGORY_VALUES)[number];

export const CASE_CATEGORIES: ReadonlyArray<{
  value: CaseCategory;
  label: string;
}> = [
  { value: "food", label: "Food Crimes" },
  { value: "relationships", label: "Relationships" },
  { value: "roommates", label: "Roommates" },
  { value: "work", label: "Work & Office" },
  { value: "money", label: "Money" },
  { value: "gaming", label: "Gaming" },
  { value: "petty", label: "Petty Beef" },
  { value: "other", label: "Other" },
];

export function getCategoryLabel(value: CaseCategory): string {
  return CASE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const REACTION_TYPE_VALUES = ["shock", "laugh", "agree"] as const;
export type ReactionType = (typeof REACTION_TYPE_VALUES)[number];

export const REACTION_META: Record<
  ReactionType,
  { tag: string; label: string; asset: "shock" | "laugh" | "agree" }
> = {
  shock: { tag: "SHK", label: "Shock", asset: "shock" },
  laugh: { tag: "LOL", label: "Laugh", asset: "laugh" },
  agree: { tag: "YES", label: "Agree", asset: "agree" },
};

export const VERDICT_TONE_VALUES = ["savage", "sharp", "balanced"] as const;
export type VerdictTone = (typeof VERDICT_TONE_VALUES)[number];

export const APPEAL_OUTCOME_VALUES = ["upheld", "overturned"] as const;
export type AppealOutcome = (typeof APPEAL_OUTCOME_VALUES)[number];

export const VERDICT_TONES: ReadonlyArray<{
  value: VerdictTone;
  label: string;
  description: string;
}> = [
  { value: "savage", label: "Savage", description: "Full roast. No survivors." },
  { value: "sharp", label: "Sharp", description: "Surgical wit. Dry and devastating." },
  { value: "balanced", label: "Balanced", description: "Stern, fair, lightly amused." },
];

// ---- Entities ----

export interface Case {
  id: string;
  /** Sequential court docket number, e.g. 42 renders as CASE #0042. */
  docket_no: number;
  title: string;
  category: CaseCategory;
  status: CaseStatus;
  created_at: string;
  /** Timestamp of the last engagement (reaction/verdict/appeal); drives heat decay. */
  last_activity_at: string;
  /** Raw virality: AI shame seed + weighted crowd reactions (undecayed). */
  viral_rank: number;
  /** JURY MODE: verdict stays sealed for everyone until the window closes. */
  jury_enabled: boolean;
  /** ISO timestamp when the jury window ends; null when jury mode is off. */
  jury_expires_at: string | null;
}

// ---- Jury mode (the 5-minute crowd-court window) ----

/** Mirror of JURY_WINDOW_MS in convex/lib.ts — keep in sync. */
export const JURY_WINDOW_MINUTES = 5;

export interface JuryState {
  enabled: boolean;
  /** True while the window is open and the verdict is sealed for everyone. */
  active: boolean;
  /** ISO timestamp when the window closes; null when jury mode is off. */
  expires_at: string | null;
  /** Milliseconds left in the window, measured on the server clock. */
  remaining_ms: number;
}

export interface Party {
  id: string;
  case_id: string;
  side: PartySide;
  /** Optional fighter name shown instead of "PLAYER 1/2". */
  display_name: string | null;
  argument_text: string;
  evidence_summary: string | null;
}

export interface SideScores {
  logic: number;
  evidence: number;
}

export type VerdictScores = Record<PartySide, SideScores>;

export interface Verdict {
  id: string;
  case_id: string;
  winner_side: PartySide;
  short_verdict: string;
  full_reasoning: string;
  roast_line: string;
  share_image_url: string;
  /**
   * Judge's raw scoreboard. Optional because verdicts persisted before the
   * scoring rollout lack it; consumers must fall back gracefully.
   */
  scores?: VerdictScores;
  /** AI-assessed shamefulness of the dispute, 0-100. Seeds viral_rank. */
  shame_score?: number;
}

export interface Appeal {
  id: string;
  case_id: string;
  outcome: AppealOutcome;
  /** The appellant's plea that triggered this appeal. */
  plea: string;
  /** Appellate ruling text. */
  ruling: string;
  /** Fresh roast: the appellant if upheld, the newly-losing side if overturned. */
  roast_line: string;
  share_image_url: string;
  created_at: string;
}

/** Winner after the appellate court has spoken (appeal may flip the ruling). */
export function effectiveWinnerSide(
  verdict: Pick<Verdict, "winner_side">,
  appeal: Pick<Appeal, "outcome"> | null | undefined
): PartySide {
  if (appeal?.outcome === "overturned") {
    return verdict.winner_side === "A" ? "B" : "A";
  }
  return verdict.winner_side;
}

// ---- Fight math (blowout detection) ----

export type BlowoutTier = "standard" | "flawless" | "fatality";

/** Logic counts double — must mirror the server-side weighting exactly. */
export function weightedScore(scores: SideScores): number {
  return scores.logic * 2 + scores.evidence;
}

const FLAWLESS_MARGIN = 8;
const FATALITY_MARGIN = 14;

export function getBlowoutTier(scores: VerdictScores | undefined): BlowoutTier {
  if (!scores) return "standard";
  const margin = Math.abs(weightedScore(scores.A) - weightedScore(scores.B));
  if (margin >= FATALITY_MARGIN) return "fatality";
  if (margin >= FLAWLESS_MARGIN) return "flawless";
  return "standard";
}

export const BLOWOUT_LABELS: Record<Exclude<BlowoutTier, "standard">, string> = {
  flawless: "FLAWLESS VICTORY",
  fatality: "FATALITY",
};

// ---- Display helpers ----

export function partyLabel(side: PartySide, displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed.toUpperCase();
  return side === "A" ? "PLAYER 1" : "PLAYER 2";
}

export function formatDocketNo(docketNo: number): string {
  return `#${String(Math.max(0, docketNo)).padStart(4, "0")}`;
}

export interface Reaction {
  id: string;
  case_id: string;
  type: ReactionType;
  count: number;
}

// ---- Crowd prediction (vote before the verdict is revealed) ----

export interface CrowdVoteTally {
  A: number;
  B: number;
}

export interface CrowdState {
  tally: CrowdVoteTally;
  /** Which side this viewer picked, or null if they haven't voted. */
  viewer_vote: PartySide | null;
}

export function crowdTotal(tally: CrowdVoteTally): number {
  return tally.A + tally.B;
}

export function crowdPercent(tally: CrowdVoteTally, side: PartySide): number {
  const total = crowdTotal(tally);
  if (total === 0) return 0;
  return Math.round((tally[side] / total) * 100);
}

/** Which side the crowd backs, or "tie" on a dead-even (or empty) split. */
export function crowdMajority(tally: CrowdVoteTally): PartySide | "tie" {
  if (tally.A > tally.B) return "A";
  if (tally.B > tally.A) return "B";
  return "tie";
}

// ---- REST contracts ----

export interface CreateCaseRequest {
  title: string;
  category: CaseCategory;
  side_a_text: string;
  side_b_text: string;
  side_a_evidence?: string;
  side_b_evidence?: string;
  side_a_name?: string;
  side_b_name?: string;
  /** Submitter confirmed they are 13+ and may submit this content. Must be true. */
  age_confirmed: boolean;
  /** Submitter accepted the Terms of Use / Community Rules and the entertainment-only AI disclosure. Must be true. */
  terms_accepted: boolean;
  /** JURY MODE: seal the AI verdict for 5 minutes while the crowd votes blind. */
  jury_enabled?: boolean;
}

export interface CreateCaseResponse {
  case_id: string;
  status: CaseStatus;
}

export interface DeliberationState {
  in_progress: boolean;
  error: string | null;
  /** 0–100 while the judge agent is working */
  progress: number;
  /** Arcade terminal phase label */
  phase: string | null;
}

export interface AppealState {
  in_progress: boolean;
  error: string | null;
  progress: number;
  phase: string | null;
}

export interface CaseEnvelope {
  case: Case;
  parties: Party[];
  /**
   * Null while the case is open — and also for non-owner visitors who haven't
   * cast a crowd prediction yet (the reveal gate). `verdict_sealed`
   * distinguishes "no verdict exists" from "verdict withheld until you vote".
   */
  verdict: Verdict | null;
  /** True when a verdict exists server-side but is masked for this viewer. */
  verdict_sealed: boolean;
  appeal: Appeal | null;
  reactions: Reaction[];
  crowd: CrowdState;
  /** The 5-minute crowd-court window; while active the verdict stays sealed. */
  jury: JuryState;
  deliberation: DeliberationState;
  appeal_state: AppealState;
  viewer: { is_owner: boolean };
}

/**
 * Response to casting a crowd vote. Verdict/appeal stay null while the jury
 * window is still open — voting alone no longer guarantees the reveal.
 */
export interface PredictResponse {
  crowd: CrowdState;
  verdict: Verdict | null;
  appeal: Appeal | null;
  verdict_sealed: boolean;
  jury: JuryState;
}

export interface SharePackage {
  case_id: string;
  title: string;
  category: CaseCategory;
  winner_side: PartySide;
  winner_name: string;
  loser_name: string;
  short_verdict: string;
  roast_line: string;
  share_image_url: string;
  case_url: string;
  share_text: string;
  /** Self-deprecating variant for the losing side to post. */
  loser_share_text: string;
  appeal_outcome: AppealOutcome | null;
  reactions: Record<ReactionType, number>;
  viral_rank: number;
  /** Total crowd votes cast on this case. */
  jury_votes: number;
  /** % of jurors who sided with the final winner; null when nobody voted. */
  crowd_approval_pct: number | null;
}

// ---- Case submission form ----

export type CaseFormStep = "dispute" | "side-a" | "side-b" | "review";

export interface CaseFormState {
  title: string;
  category: CaseCategory | "";
  name_a: string;
  argument_a: string;
  evidence_a: string;
  name_b: string;
  argument_b: string;
  evidence_b: string;
  tone: VerdictTone;
  /** JURY MODE toggle on the review step — seals the verdict for 5 minutes. */
  jury_enabled: boolean;
  /** Consent checkboxes on the review step — both must be true to file. */
  age_confirmed: boolean;
  terms_accepted: boolean;
}
