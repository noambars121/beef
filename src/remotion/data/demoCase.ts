// Deterministic demo data for the BEEF viral iPhone demo video.
// Shapes mirror src/types/index.ts and obey the app's fight math:
// weighted = logic * 2 + evidence  ->  A: 8*2+7 = 23, B: 5*2+4 = 14.
// A wins (23 > 14) and the margin (9) lands in FLAWLESS VICTORY tier (>= 8).

import type { PartySide, SideScores } from "@/types";
import { getBlowoutTier, weightedScore } from "@/types";

export const DEMO_CASE = {
  docket_no: 42,
  title: "IS PINEAPPLE ON PIZZA A CRIME?",
  category: "food" as const,
  categoryLabel: "Food Crimes",
  tone: "savage" as const,
} as const;

export const DEMO_SIDE_A = {
  side: "A" as const,
  name: "TEAM PINEAPPLE",
  argument: "Sweet, salty, crispy. This is culinary balance.",
} as const;

export const DEMO_SIDE_B = {
  side: "B" as const,
  name: "PIZZA PURISTS",
  argument: "Fruit belongs in a bowl, not on melted cheese.",
} as const;

export const DEMO_SCORES: Record<"A" | "B", SideScores> = {
  A: { logic: 8, evidence: 7 },
  B: { logic: 5, evidence: 4 },
};

export const DEMO_VERDICT = {
  // Typed as PartySide (not the literal "A") so consumers can compare either side.
  winner_side: "A" as PartySide,
  short_verdict: "PINEAPPLE WINS. SWEETNESS IS NOT A FELONY.",
  roast_line: "PIZZA PURISTS BROUGHT A MANIFESTO TO A SNACK FIGHT.",
  full_reasoning:
    "Side A argued flavor mechanics: sweet, salt and crunch working together. Side B filed a food dress code and called it a case. Logic 8-5. Evidence 7-4. The math shows no mercy.",
} as const;

export const MAX_WEIGHTED_SCORE = 30; // logic(10)*2 + evidence(10) — mirrors VerdictView

export const DEMO_WEIGHTED = {
  A: weightedScore(DEMO_SCORES.A),
  B: weightedScore(DEMO_SCORES.B),
} as const;

export const DEMO_BLOWOUT = getBlowoutTier(DEMO_SCORES);

// Deliberation terminal logs (authentic `> LOG...` treatment from VerdictView).
export const DEMO_DELIBERATION_LOGS = [
  "COURT IN SESSION...",
  "WEIGHING THE AUDACITY...",
  "SHARPENING THE FATAL ROAST...",
] as const;

// ---- Jury mode demo data (mirrors JuryState / CrowdVoteTally) ----
// The friend votes A in the trap; two more jurors trickle in during the
// window. Majority (67% A) matches the judge -> ABSOLUTE CONSENSUS stamp.
export const DEMO_JURY = {
  windowLabel: "5 MIN",
  /** Jurors already in before the friend votes (trap footer count). */
  preVoteJurors: 2,
  /** Crowd tally shown from the voter view onward (friend voted A). */
  tally: { A: 2, B: 1 },
  jurors: 3,
  pctA: 67,
  pctB: 33,
  /** Countdown shown on the owner's jury box (ticking in real time). */
  ownerCountdownStartMs: 298_000, // 04:58
  /** Countdown at the moment the friend opens the trap link. */
  trapCountdownMs: 271_000, // 04:31
  /** Voter-view countdown start, before the cinematic time-skip. */
  voterCountdownStartMs: 252_000, // 04:12
} as const;

// External overlay captions (burned-in, sound-off friendly).
export const CAPTIONS = {
  hook: "YOUR GROUP CHAT HAS A JUDGE NOW.",
  twoSides: "TWO SIDES ENTER.",
  oneEgo: "ONE EGO LEAVES DAMAGED.",
  newJury: "NEW: JURY MODE",
  crowdFirst: "THE CROWD JUDGES FIRST.",
  newTrap: "NEW: THE TRAP",
  pickBlind: "PICK A SIDE. NO PEEKING.",
  fiveMinLater: "5 MINUTES LATER…",
  courtSpoken: "THE COURT HAS SPOKEN.",
  sendIt: "SEND THIS TO THE GROUP CHAT",
  hall: "EVERY BEEF ENDS UP HERE.",
  endTitle: "BEEF",
  endLine1: "SETTLE THE ARGUMENT.",
  endLine2: "LET THE AI COOK.",
  endSmall: "FOR PETTY DEBATES. NOT SERIOUS DISPUTES.",
} as const;

// ---- Hall of Shame demo leaderboard ----
// Entry #1 is this video's case (heat matches the SHAME_HEAT_28 footer line);
// the rest are plausible demo beefs that sell the board without real claims.
export interface HallEntry {
  docket: string;
  category: string;
  title: string;
  roast: string;
  winnerName: string;
  winnerSide: PartySide;
  heat: number;
  reactions: { shock: number; laugh: number; agree: number };
}

export const DEMO_HALL: HallEntry[] = [
  {
    docket: "CASE #0042",
    category: "FOOD CRIMES",
    title: DEMO_CASE.title,
    roast: DEMO_VERDICT.roast_line,
    winnerName: DEMO_SIDE_A.name,
    winnerSide: "A",
    heat: 28,
    reactions: { shock: 1, laugh: 1, agree: 0 },
  },
  {
    docket: "CASE #0041",
    category: "PETTY BEEF",
    title: "GPS SAYS 12 MINUTES. HE SAYS 5.",
    roast: "HE ARGUED WITH SATELLITES AND LOST.",
    winnerName: "TEAM GPS",
    winnerSide: "A",
    heat: 21,
    reactions: { shock: 2, laugh: 4, agree: 3 },
  },
  {
    docket: "CASE #0039",
    category: "ROOMMATES",
    title: "WHO ATE THE LABELED LEFTOVERS?",
    roast: "THE FRIDGE HAD ONE RULE. ONE.",
    winnerName: "FRIDGE COP",
    winnerSide: "B",
    heat: 17,
    reactions: { shock: 1, laugh: 3, agree: 2 },
  },
  {
    docket: "CASE #0038",
    category: "WORK & OFFICE",
    title: "IS REPLYING 'K' TO YOUR BOSS A CRIME?",
    roast: "PROFESSIONAL SELF-DESTRUCTION IN ONE LETTER.",
    winnerName: "HR DEFENDER",
    winnerSide: "B",
    heat: 9,
    reactions: { shock: 3, laugh: 1, agree: 1 },
  },
];

/** Mirrors formatCountdown in VerdictView.tsx (MM:SS). */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
