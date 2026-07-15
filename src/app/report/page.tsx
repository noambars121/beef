import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { ReportForm } from "@/components/legal/ReportForm";

export const metadata: Metadata = {
  title: "Report a Case | BEEF",
  description:
    "Report a BEEF case or request content removal: privacy, harassment, safety, copyright, or impersonation concerns go straight to the operator.",
};

export default function ReportPage() {
  return (
    <LegalPageLayout
      title="Report a Case"
      subtitle="Flag a case or request content removal"
      currentPath="/report"
    >
      <LegalSection heading="Before you report">
        <p>
          Use this form to flag a case that involves your personal information,
          harassment, a safety concern, copyright, or impersonation — or to ask
          for content to be removed. Reports go to a human, not the AI judge.
        </p>
        <p>
          Include only the details needed to review the report. See the{" "}
          <a href="/community">Community &amp; Content Policy</a> for what is
          and is not allowed on BEEF.
        </p>
      </LegalSection>

      <LegalSection heading="Report details">
        <Suspense fallback={null}>
          <ReportForm />
        </Suspense>
      </LegalSection>
    </LegalPageLayout>
  );
}
