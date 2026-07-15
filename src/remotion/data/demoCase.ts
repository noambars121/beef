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

// External overlay captions (burned-in, sound-off friendly).
export const CAPTIONS = {
  hook: "YOUR GROUP CHAT HAS A JUDGE NOW.",
  twoSides: "TWO SIDES ENTER.",
  oneEgo: "ONE EGO LEAVES DAMAGED.",
  courtSpoken: "THE COURT HAS SPOKEN.",
  sendIt: "SEND THIS TO THE GROUP CHAT",
  endTitle: "BEEF",
  endLine1: "SETTLE THE ARGUMENT.",
  endLine2: "LET THE AI COOK.",
  endSmall: "FOR PETTY DEBATES. NOT SERIOUS DISPUTES.",
} as const;
