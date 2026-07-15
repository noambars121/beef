import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/BackLink";
import { getSessionId } from "@/lib/session";
import { getCase, getCaseEnvelope, getVerdict } from "@/lib/store/db";
import { VerdictView } from "./VerdictView";

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CasePageProps) {
  const { id } = await params;
  // Deliberately bypasses the crowd-vote seal: link-preview crawlers have no
  // session, and the OG card is the whole viral loop. Humans still hit the
  // vote gate in the UI; teasing the ruling in the embed is the hook.
  const caseRecord = await getCase(id);
  if (!caseRecord) return { title: "Case Not Found | BEEF" };

  const verdict = await getVerdict(id);
  return {
    title: `${caseRecord.title} | BEEF`,
    description: verdict
      ? `${verdict.short_verdict} — think the crowd agrees? Cast your vote, then see the ruling.`
      : `Verdict pending in the case of "${caseRecord.title}"`,
    openGraph: verdict
      ? { images: [verdict.share_image_url] }
      : undefined,
  };
}

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params;
  const sessionId = await getSessionId();

  const envelope = await getCaseEnvelope(id, sessionId);
  if (!envelope) {
    notFound();
  }

  return (
    <main className="page-shell-narrow items-stretch justify-start py-2 sm:items-center sm:justify-center sm:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 pr-14 sm:mb-3 sm:pr-16">
          <BackLink />
          {/* Reporting stays reachable in every verdict state (open, sealed, deliberating, revealed). */}
          <Link
            href={`/report?case_id=${envelope.case.id}`}
            className="touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-none border-4 border-arcade-border bg-black px-2.5 py-2 font-arcade text-[7px] uppercase tracking-wider text-court-muted transition-all hover:border-arcade-pink hover:text-arcade-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-pink sm:px-3 sm:text-[8px]"
          >
            REPORT THIS CASE
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">
          <VerdictView initialData={envelope} />
        </div>
      </div>
    </main>
  );
}
