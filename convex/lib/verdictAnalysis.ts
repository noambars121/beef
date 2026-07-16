import { z } from "zod";

const APPEAL_OUTCOME_VALUES = ["upheld", "overturned"] as const;
type PartySide = "A" | "B";

const sideScoresSchema = z.object({
  logic: z.number().min(0).max(10),
  evidence: z.number().min(0).max(10),
});

export const verdictAnalysisSchema = z.object({
  winner_side: z.enum(["A", "B"]),
  scores: z.object({
    A: sideScoresSchema,
    B: sideScoresSchema,
  }),
  short_verdict: z.string().trim().min(5).max(220),
  full_reasoning: z.string().trim().min(20).max(1600),
  roast_line: z.string().trim().min(5).max(300),
  shame_score: z.number().min(0).max(100).optional(),
});

export type VerdictAnalysis = z.infer<typeof verdictAnalysisSchema>;

export function computeWeightedScore(scores: {
  logic: number;
  evidence: number;
}): number {
  return scores.logic * 2 + scores.evidence;
}

export function resolveWinnerSide(analysis: VerdictAnalysis): PartySide {
  const a = computeWeightedScore(analysis.scores.A);
  const b = computeWeightedScore(analysis.scores.B);
  if (a === b) return analysis.winner_side;
  return a > b ? "A" : "B";
}

export function estimateShameScore(analysis: VerdictAnalysis): number {
  const margin = Math.abs(
    computeWeightedScore(analysis.scores.A) -
      computeWeightedScore(analysis.scores.B)
  );
  return Math.max(20, Math.min(100, Math.round(20 + (margin / 30) * 80)));
}

function extractJsonSlice(raw: string): string | null {
  const cleaned = raw.replace(/```json/gi, "```").replace(/```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return cleaned.slice(start, end + 1);
}

export type ParseResult =
  | { ok: true; analysis: VerdictAnalysis }
  | { ok: false; error: string };

export function parseVerdictAnalysis(raw: string): ParseResult {
  const slice = extractJsonSlice(raw);
  if (!slice) {
    return { ok: false, error: "no JSON object found in the response" };
  }

  let value: unknown;
  try {
    value = JSON.parse(slice);
  } catch (error) {
    return {
      ok: false,
      error: `invalid JSON: ${error instanceof Error ? error.message : "parse failure"}`,
    };
  }

  const parsed = verdictAnalysisSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    return { ok: false, error: `schema violations — ${issues}` };
  }

  const declared = parsed.data.winner_side;
  const computed = resolveWinnerSide(parsed.data);
  if (declared !== computed) {
    const a = computeWeightedScore(parsed.data.scores.A);
    const b = computeWeightedScore(parsed.data.scores.B);
    return {
      ok: false,
      error: `winner_side "${declared}" contradicts your scores (weighted A=${a}, B=${b}); the roast must target the actual loser`,
    };
  }

  return { ok: true, analysis: parsed.data };
}

export const appealAnalysisSchema = z.object({
  outcome: z.enum(APPEAL_OUTCOME_VALUES),
  ruling: z.string().trim().min(20).max(1200),
  roast_line: z.string().trim().min(5).max(300),
});

export type AppealAnalysis = z.infer<typeof appealAnalysisSchema>;

export type AppealParseResult =
  | { ok: true; analysis: AppealAnalysis }
  | { ok: false; error: string };

export function parseAppealAnalysis(raw: string): AppealParseResult {
  const slice = extractJsonSlice(raw);
  if (!slice) {
    return { ok: false, error: "no JSON object found in the response" };
  }

  let value: unknown;
  try {
    value = JSON.parse(slice);
  } catch (error) {
    return {
      ok: false,
      error: `invalid JSON: ${error instanceof Error ? error.message : "parse failure"}`,
    };
  }

  const parsed = appealAnalysisSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    return { ok: false, error: `schema violations — ${issues}` };
  }

  return { ok: true, analysis: parsed.data };
}
