import type { Metadata } from "next";
import { LegalPageLayout, LegalValue } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "IP, Copyright & DMCA Policy | BEEF",
  description:
    "The BEEF IP, Copyright & DMCA Policy: how to report claimed copyright infringement, submit a counter-notice, and how removals are handled.",
};

export default function CopyrightPage() {
  return (
    <LegalPageLayout
      title="BEEF IP, Copyright & DMCA Policy"
      subtitle="Copyright reporting and content-removal process"
      currentPath="/copyright"
    >
      <LegalSection heading="1. Respect for intellectual property">
        <p>
          Do not upload material that infringes another person&rsquo;s
          copyright, trademark, privacy, publicity, or other rights. You are
          responsible for ensuring you can submit and share your content.
        </p>
      </LegalSection>

      <LegalSection heading="2. Reporting claimed copyright infringement">
        <p>
          To submit a copyright complaint, send{" "}
          <LegalValue value={legalConfig.contactEmail} /> a written notice
          containing: (a) identification of the copyrighted work; (b)
          identification and URL of the allegedly infringing material; (c)
          your name, address, phone number, and email; (d) a statement that you
          have a good-faith belief the use is unauthorized; (e) a statement,
          under penalty of perjury, that the information is accurate and that
          you are authorized to act for the rights holder; and (f) your
          physical or electronic signature.
        </p>
      </LegalSection>

      <LegalSection heading="3. Counter-notice">
        <p>
          If you believe material was removed by mistake or misidentification,
          send a counter-notice to{" "}
          <LegalValue value={legalConfig.contactEmail} /> containing the
          information required by applicable law, including identification of
          the removed material, a good-faith statement, consent to the relevant
          court jurisdiction, contact information, and a signature. Obtain
          legal advice if you are unsure whether to send a counter-notice.
        </p>
      </LegalSection>

      <LegalSection heading="4. Repeat infringement and other removals">
        <p>
          We may remove content, disable access, or restrict repeat infringers
          and may act on complaints involving privacy, impersonation,
          defamation, safety, or unlawful content even where copyright law does
          not apply.
        </p>
      </LegalSection>

      <LegalSection heading="5. Designated agent">
        <p>
          For U.S. DMCA safe-harbor purposes, the operator should register a
          designated agent with the U.S. Copyright Office before relying on
          DMCA protections. Designated agent details:{" "}
          <LegalValue value={legalConfig.entityName} />,{" "}
          <LegalValue value={legalConfig.mailingAddress} />,{" "}
          <LegalValue value={legalConfig.contactEmail} />.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
