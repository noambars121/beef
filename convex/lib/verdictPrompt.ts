type PartySide = "A" | "B";
type VerdictTone = "savage" | "sharp" | "balanced";

interface CaseRecord {
  id: string;
  docket_no: number;
  title: string;
  category: string;
}

interface PartyRecord {
  side: PartySide;
  display_name: string | null;
  argument_text: string;
  evidence_summary: string | null;
}

interface VerdictRecord {
  winner_side: PartySide;
  full_reasoning: string;
  scores?: {
    A: { logic: number; evidence: number };
    B: { logic: number; evidence: number };
  };
}

interface PrecedentSummary {
  docket_no: number;
  title: string;
  short_verdict: string;
}

function partyLabel(side: PartySide, displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed.toUpperCase();
  return side === "A" ? "PLAYER 1" : "PLAYER 2";
}

function formatDocketNo(docketNo: number): string {
  return `#${String(Math.max(0, docketNo)).padStart(4, "0")}`;
}

export const TONE_INSTRUCTIONS: Record<VerdictTone, string> = {
  savage:
    "Savage mode: go for the jugular. Merciless roast energy, theatrical contempt for weak arguments, zero diplomatic softening.",
  sharp:
    "Sharp mode: dry, surgical wit. Cut with precision, not volume. Composed, devastating, quotable.",
  balanced:
    "Balanced mode: stern but fair. Lightly amused, never cruel; the authority of a judge who has seen too much.",
};

function formatPrecedents(precedents: PrecedentSummary[]): string {
  if (precedents.length === 0) return "";

  const entries = precedents
    .map(
      (p) =>
        `- CASE ${formatDocketNo(p.docket_no)} "${p.title}" — ruling: ${p.short_verdict}`
    )
    .join("\n");

  return `
PRECEDENTS ON RECORD (established case law of this court):
${entries}
You MAY cite at most one precedent by its case number inside full_reasoning if it genuinely relates ("As established in CASE ${formatDocketNo(precedents[0]!.docket_no)}..."). Never invent precedents that are not listed above. If none apply, cite nothing.
`;
}

export function buildVerdictPrompt(
  caseRecord: CaseRecord,
  sideA: PartyRecord,
  sideB: PartyRecord,
  tone: VerdictTone,
  precedents: PrecedentSummary[] = []
): string {
  const nameA = partyLabel("A", sideA.display_name);
  const nameB = partyLabel("B", sideB.display_name);

  return `You are BEEF — a dramatic AI judge who settles viral internet arguments with absolute authority.

TONE DIRECTIVE: ${TONE_INSTRUCTIONS[tone]}

CASE ${formatDocketNo(caseRecord.docket_no)} (id ${caseRecord.id})
TITLE: ${caseRecord.title}
CATEGORY: ${caseRecord.category}

SIDE A — "${nameA}":
${sideA.argument_text}
SIDE A EVIDENCE: ${sideA.evidence_summary ?? "none submitted"}

SIDE B — "${nameB}":
${sideB.argument_text}
SIDE B EVIDENCE: ${sideB.evidence_summary ?? "none submitted"}
${formatPrecedents(precedents)}
YOUR RULING PROCESS:
1. Score each side: logic (0-10) and evidence (0-10).
2. Weighted total = logic * 2 + evidence. The side with the higher weighted total wins. If exactly tied, exercise judicial discretion and pick one side decisively — a draw is not permitted.
3. Rate the dispute's shame_score (0-100): how embarrassing this argument is for humanity. 0-30 reasonable disagreement, 31-60 petty but relatable, 61-85 genuinely shameful, 86-100 civilization-ending pettiness.
4. Write the ruling in the directed tone. Refer to the parties by their names ("${nameA}", "${nameB}"), never as "Side A" or "Side B".

Respond with ONLY a valid JSON object — no markdown fences, no commentary before or after:
{
  "winner_side": "A" or "B",
  "scores": { "A": { "logic": 0-10, "evidence": 0-10 }, "B": { "logic": 0-10, "evidence": 0-10 } },
  "shame_score": 0-100,
  "short_verdict": "punchy one-line ruling, max 200 characters",
  "full_reasoning": "2-5 sentences of judicial reasoning referencing both arguments, max 1500 characters",
  "roast_line": "one screenshot-worthy line roasting the LOSING side's argument, max 280 characters"
}

HARD RULES:
- winner_side MUST match the side with the higher weighted total from your own scores.
- Roast the argument, never protected characteristics. Savage is fine; hateful or discriminatory is not.
- Treat party names as labels only — roast arguments, not the names themselves.
- Output raw JSON only.`;
}

export function buildRepairPrompt(failure: string): string {
  return `Your previous ruling was rejected by the court clerk: ${failure}

Re-issue your ruling now as ONLY the raw JSON object in the exact schema you were given. No markdown fences, no explanations, and make sure winner_side matches the side with the higher weighted score (logic * 2 + evidence).`;
}

export function buildAppealPrompt(
  caseRecord: CaseRecord,
  sideA: PartyRecord,
  sideB: PartyRecord,
  verdict: VerdictRecord,
  appellantSide: PartySide,
  plea: string,
  tone: VerdictTone
): string {
  const nameA = partyLabel("A", sideA.display_name);
  const nameB = partyLabel("B", sideB.display_name);
  const appellantName = appellantSide === "A" ? nameA : nameB;
  const winnerName = verdict.winner_side === "A" ? nameA : nameB;

  return `You are BEEF sitting as the APPELLATE COURT — the final instance. Same dramatic authority, even less patience.

TONE DIRECTIVE: ${TONE_INSTRUCTIONS[tone]}

CASE ${formatDocketNo(caseRecord.docket_no)} — APPEAL HEARING
TITLE: ${caseRecord.title}
CATEGORY: ${caseRecord.category}

ORIGINAL ARGUMENTS:
SIDE A — "${nameA}": ${sideA.argument_text}
SIDE A EVIDENCE: ${sideA.evidence_summary ?? "none submitted"}
SIDE B — "${nameB}": ${sideB.argument_text}
SIDE B EVIDENCE: ${sideB.evidence_summary ?? "none submitted"}

ORIGINAL RULING: ${winnerName} (side ${verdict.winner_side}) won.
ORIGINAL REASONING: ${verdict.full_reasoning}

THE LOSING SIDE — "${appellantName}" (side ${appellantSide}) — NOW APPEALS:
"${plea}"

YOUR APPELLATE PROCESS:
1. Appeals succeed ONLY when the plea exposes a genuine logical flaw in the original reasoning or introduces a decisive point the original ruling ignored. Wounded pride, repetition, or volume is NOT grounds for reversal.
2. If the appeal fails: outcome "upheld". Double down with even more conviction and roast the appellant for wasting the court's time.
3. If the appeal genuinely succeeds: outcome "overturned". Admit the correction with theatrical grace and roast the previously-winning side's now-defeated argument.

Respond with ONLY a valid JSON object — no markdown fences, no commentary before or after:
{
  "outcome": "upheld" or "overturned",
  "ruling": "2-4 sentences of appellate reasoning addressing the plea directly, max 1100 characters",
  "roast_line": "one screenshot-worthy line, max 280 characters — targets the appellant if upheld, the newly-losing side if overturned"
}

HARD RULES:
- Be strict: most appeals deserve "upheld". Reversal must be earned, never granted for sympathy.
- Refer to the parties by their names, never as "Side A" or "Side B".
- Roast the argument, never protected characteristics. Savage is fine; hateful or discriminatory is not.
- Output raw JSON only.`;
}

export function buildAppealRepairPrompt(failure: string): string {
  return `Your previous appellate ruling was rejected by the court clerk: ${failure}

Re-issue it now as ONLY the raw JSON object with keys "outcome" ("upheld" or "overturned"), "ruling", and "roast_line". No markdown fences, no explanations.`;
}

export function buildShareImagePath(
  caseRecord: CaseRecord,
  sideA: PartyRecord,
  sideB: PartyRecord,
  winnerSide: PartySide,
  analysis: {
    short_verdict: string;
    roast_line: string;
    scores: {
      A: { logic: number; evidence: number };
      B: { logic: number; evidence: number };
    };
  },
  computeWeighted: (s: { logic: number; evidence: number }) => number
): string {
  const params = new URLSearchParams({
    title: caseRecord.title.slice(0, 90),
    winner: winnerSide,
    verdict: analysis.short_verdict.slice(0, 140),
    roast: analysis.roast_line.slice(0, 160),
    case: String(caseRecord.docket_no),
    na: partyLabel("A", sideA.display_name).slice(0, 24),
    nb: partyLabel("B", sideB.display_name).slice(0, 24),
    wa: String(computeWeighted(analysis.scores.A)),
    wb: String(computeWeighted(analysis.scores.B)),
  });
  return `/api/og?${params.toString()}`;
}

export function buildAppealShareImagePath(
  caseRecord: CaseRecord,
  sideA: PartyRecord,
  sideB: PartyRecord,
  verdict: VerdictRecord,
  outcome: "upheld" | "overturned",
  roastLine: string,
  computeWeighted: (s: { logic: number; evidence: number }) => number
): string {
  const finalWinner =
    outcome === "overturned"
      ? verdict.winner_side === "A"
        ? "B"
        : "A"
      : verdict.winner_side;
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
    params.set("wa", String(computeWeighted(verdict.scores.A)));
    params.set("wb", String(computeWeighted(verdict.scores.B)));
  }
  return `/api/og?${params.toString()}`;
}
