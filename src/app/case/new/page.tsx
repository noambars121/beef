import { CaseSubmissionForm } from "@/components/case/CaseSubmissionForm";
import { BackLink } from "@/components/layout/BackLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insert Case | BEEF",
  description: "Submit your argument. Let the arcade announcer decide.",
};

export default function NewCasePage() {
  return (
    <main className="page-shell items-stretch justify-start py-2 sm:items-center sm:justify-center sm:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 pr-14 sm:mb-3 sm:pr-16">
          <BackLink />
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-stretch overflow-hidden p-1 sm:items-center">
          <CaseSubmissionForm />
        </div>
      </div>
    </main>
  );
}
