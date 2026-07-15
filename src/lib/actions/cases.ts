import { ApiError } from "@/lib/api-error";
import * as db from "@/lib/store/db";
import type {
  CreateCaseRequest,
  CreateCaseResponse,
  ReactionType,
  SharePackage,
} from "@/types";
import {
  REACTION_TYPE_VALUES,
  crowdTotal,
  effectiveWinnerSide,
  formatDocketNo,
  partyLabel,
} from "@/types";

export async function createCase(
  input: CreateCaseRequest,
  ownerSessionId: string
): Promise<CreateCaseResponse> {
  const created = await db.insertCase({
    title: input.title,
    category: input.category,
    owner_session_id: ownerSessionId,
    jury_enabled: input.jury_enabled === true,
    side_a: {
      argument_text: input.side_a_text,
      evidence_summary: normalizeEvidence(input.side_a_evidence),
      display_name: normalizeName(input.side_a_name),
    },
    side_b: {
      argument_text: input.side_b_text,
      evidence_summary: normalizeEvidence(input.side_b_evidence),
      display_name: normalizeName(input.side_b_name),
    },
  });

  return { case_id: created.case_id, status: created.status };
}

export async function getShareablePackage(
  caseId: string,
  baseUrl: string
): Promise<SharePackage> {
  const caseRecord = await db.getCase(caseId);
  if (!caseRecord) {
    throw new ApiError("Case not found", 404);
  }

  const verdict = await db.getVerdict(caseId);
  if (!verdict || caseRecord.status !== "closed") {
    throw new ApiError("The verdict has not been delivered yet", 409);
  }

  const appeal = (await db.getAppeal(caseId)) ?? null;
  const parties = await db.getParties(caseId);
  const sideA = parties.find((p) => p.side === "A");
  const sideB = parties.find((p) => p.side === "B");

  const finalWinner = effectiveWinnerSide(verdict, appeal);
  const winnerName = partyLabel(
    finalWinner,
    (finalWinner === "A" ? sideA : sideB)?.display_name
  );
  const loserName = partyLabel(
    finalWinner === "A" ? "B" : "A",
    (finalWinner === "A" ? sideB : sideA)?.display_name
  );

  const reactions = Object.fromEntries(
    REACTION_TYPE_VALUES.map((type) => [type, 0])
  ) as Record<ReactionType, number>;
  for (const row of await db.getReactions(caseId)) {
    reactions[row.type] = row.count;
  }

  // Crowd approval: what share of the jury sided with the final winner.
  // Computed fresh at share time so late votes count, unlike the OG image
  // stored on the verdict row.
  const tally = await db.getCrowdTally(caseId);
  const juryVotes = crowdTotal(tally);
  const crowdApprovalPct =
    juryVotes > 0 ? Math.round((tally[finalWinner] / juryVotes) * 100) : null;

  const caseUrl = `${baseUrl}/case/${caseId}`;
  const docket = formatDocketNo(caseRecord.docket_no);

  // The freshest ruling wins the share card: appeal roast supersedes trial roast.
  const activeRoast = appeal?.roast_line ?? verdict.roast_line;
  let activeImageUrl = appeal?.share_image_url ?? verdict.share_image_url;
  if (crowdApprovalPct !== null) {
    // Stored OG paths always carry a query string (/api/og?...), so a bare
    // "&" append is safe. The chip renders only when the param is present.
    activeImageUrl = `${activeImageUrl}&jury=${crowdApprovalPct}`;
  }

  const juryTag =
    crowdApprovalPct !== null
      ? ` ${crowdApprovalPct}% OF THE JURY AGREED WITH THE ROASTING.`
      : "";

  const appealTag =
    appeal?.outcome === "overturned"
      ? " OVERTURNED ON APPEAL —"
      : appeal?.outcome === "upheld"
        ? " UPHELD ON APPEAL —"
        : "";

  // Written from the FINAL loser's perspective, which the appeal may have flipped.
  const loserShareText =
    appeal?.outcome === "overturned"
      ? `I WON case ${docket} in AI court… then lost it on appeal. The judge said: “${activeRoast}” Come witness the reversal: ${caseUrl}`
      : appeal?.outcome === "upheld"
        ? `I lost CASE ${docket} in AI court, appealed, and lost AGAIN. The judge said: “${activeRoast}” Come witness the double KO: ${caseUrl}`
        : `I just lost CASE ${docket} in AI court. The judge said: “${activeRoast}” Come witness my public shaming: ${caseUrl}`;

  return {
    case_id: caseRecord.id,
    title: caseRecord.title,
    category: caseRecord.category,
    winner_side: finalWinner,
    winner_name: winnerName,
    loser_name: loserName,
    short_verdict: verdict.short_verdict,
    roast_line: activeRoast,
    share_image_url: `${baseUrl}${activeImageUrl}`,
    case_url: caseUrl,
    share_text: `BEEF RULES: A FATAL ROAST OF ${loserName.toUpperCase()}.${appealTag} ${winnerName} WINS.${juryTag} “${activeRoast}” Witness the execution: ${caseUrl}`,
    loser_share_text: loserShareText,
    appeal_outcome: appeal?.outcome ?? null,
    reactions,
    viral_rank: caseRecord.viral_rank,
    jury_votes: juryVotes,
    crowd_approval_pct: crowdApprovalPct,
  };
}

function normalizeEvidence(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// Strips control characters so names can never smuggle newlines into prompts
// or share cards, then trims and caps length as a final defense.
function normalizeName(value?: string): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028\u2029]/g, "")
    .trim()
    .slice(0, 24);
  return cleaned ? cleaned : null;
}
