import type { Metadata } from "next";
import { LegalPageLayout, LegalValue } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Privacy Notice | BEEF",
  description:
    "The BEEF Privacy Notice: what information BEEF collects, how it is used for AI verdicts and sharing, retention, your choices, and how to contact us.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="BEEF Privacy Notice"
      subtitle="How BEEF processes information"
      currentPath="/privacy"
    >
      <LegalSection heading="1. Scope">
        <p>
          This Privacy Notice explains how{" "}
          <LegalValue value={legalConfig.entityName} /> (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;BEEF&rdquo;) processes personal
          information when you use BEEF. It should be read with the Terms of
          Use and Cookie Notice.
        </p>
      </LegalSection>

      <LegalSection heading="2. Information we collect">
        <ul>
          <li>
            Information you submit: display names, dispute titles, arguments,
            evidence summaries, appeal text, reactions, and other content you
            choose to provide.
          </li>
          <li>
            Session and technical information: an anonymous browser-session
            identifier stored in a cookie; IP address and device/browser
            information that may be processed by our hosting, security,
            analytics, and infrastructure providers; request logs; timestamps;
            and rate-limit/security signals.
          </li>
          <li>
            Usage information: pages viewed, actions taken, case IDs, votes,
            reaction choices, and diagnostic information.
          </li>
          <li>Communications: messages or requests you send to us.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How we use information">
        <ul>
          <li>
            Operate the Service, create cases, generate AI verdicts, permit
            sharing, and provide the Hall of Shame and appeal features.
          </li>
          <li>
            Maintain anonymous sessions, prevent fraud/abuse, enforce rate
            limits, and protect users and systems.
          </li>
          <li>
            Debug, secure, improve, and measure the Service, including
            de-identified or aggregated analysis where permitted.
          </li>
          <li>
            Comply with legal obligations and respond to lawful requests.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. AI processing">
        <p>
          Submitted case content is sent to our AI service provider(s) to
          generate verdicts and appeals. Do not submit sensitive personal
          information. We configure providers and workflows to support the
          Service, but AI outputs may be retained or processed according to the
          applicable provider relationship and configuration. Before launch,
          document each active provider, its location, contractual terms,
          retention settings, and whether inputs are used for provider model
          training.
        </p>
      </LegalSection>

      <LegalSection heading="5. When we disclose information">
        <p>
          We disclose information to service providers that host, operate,
          secure, analyze, or support the Service, including database, hosting,
          AI, and content-delivery providers. We may disclose information when
          legally required or to protect rights, safety, and security. Public
          or shared case content may be visible to recipients of a link and in
          public product surfaces. We do not sell personal information for
          money. If a data practice changes, this Notice will be updated before
          the change takes effect.
        </p>
      </LegalSection>

      <LegalSection heading="6. Retention">
        <p>
          We retain information for as long as reasonably necessary to operate
          the Service, maintain security, resolve disputes, comply with legal
          obligations, and enforce agreements. Public cases and share artifacts
          may remain available until removed, deleted, or otherwise limited.
          Backups may persist for a limited period. Define and publish concrete
          retention periods before production launch.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your choices and rights">
        <p>
          You may request access, correction, deletion, or information about
          our processing by contacting{" "}
          <LegalValue value={legalConfig.contactEmail} />. We may need to
          verify your request and may retain limited information where allowed
          or required by law. Depending on where you live, you may have
          additional privacy rights, including the right to complain to a
          regulator. We will not discriminate against you for exercising
          applicable privacy rights.
        </p>
      </LegalSection>

      <LegalSection heading="8. Children">
        <p>
          BEEF is not directed to children under 13, and we do not knowingly
          collect personal information from them. If you believe a child under
          13 submitted personal information, contact us at{" "}
          <LegalValue value={legalConfig.contactEmail} /> so we can investigate
          and delete it where appropriate.
        </p>
      </LegalSection>

      <LegalSection heading="9. Security">
        <p>
          We use reasonable administrative, technical, and organizational
          safeguards appropriate to the nature of the Service. No online system
          is completely secure. Please do not submit highly sensitive
          information.
        </p>
      </LegalSection>

      <LegalSection heading="10. International processing and updates">
        <p>
          Your information may be processed in countries other than where you
          live. Those countries may have different data-protection laws. We
          will update this Notice when our practices materially change.
          Contact: <LegalValue value={legalConfig.contactEmail} />;{" "}
          <LegalValue value={legalConfig.mailingAddress} />.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
