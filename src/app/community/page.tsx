import type { Metadata } from "next";
import { LegalPageLayout, LegalValue } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Community & Content Policy | BEEF",
  description:
    "The BEEF Community & Content Policy: rules for cases, roasts, sharing, and public content. Keep beefs low-stakes, consensual, and free of real-world harm.",
};

export default function CommunityPage() {
  return (
    <LegalPageLayout
      title="BEEF Community & Content Policy"
      subtitle="Rules for cases, roasts, sharing, and public content"
      currentPath="/community"
    >
      <LegalSection heading="1. Purpose">
        <p>
          BEEF is designed for playful, consensual, low-stakes internet
          arguments—not real-world harm. The goal is a funny verdict, not
          humiliation, harassment, or escalation.
        </p>
      </LegalSection>

      <LegalSection heading="2. Keep cases low-stakes">
        <ul>
          <li>
            Use fictional, casual, or consensual disputes: food, roommates,
            gaming, petty debates, and similar topics.
          </li>
          <li>
            Get permission before posting another person&rsquo;s name,
            messages, screenshots, or other information.
          </li>
          <li>
            Use aliases whenever possible. Remove names, usernames, phone
            numbers, addresses, account numbers, school/work identifiers, and
            location details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Never submit">
        <ul>
          <li>
            Threats; targeted harassment; hate or slurs; sexual harassment;
            non-consensual intimate content; stalking; blackmail; doxxing; or
            impersonation.
          </li>
          <li>
            Personal data, confidential information, passwords, financial
            details, health information, legal records, private
            communications, or content involving children.
          </li>
          <li>
            Allegations of crimes, abuse, misconduct, or wrongdoing about
            identifiable people; use of BEEF to expose, shame, or pressure a
            real person.
          </li>
          <li>
            Content encouraging self-harm, violence, illegal activity, or
            dangerous conduct.
          </li>
          <li>
            Copyrighted content you do not have permission to use, except
            where a lawful exception clearly applies.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. AI roast boundaries">
        <p>
          Choose a tone at your own risk. The &ldquo;savage&rdquo; tone is
          intended for playful criticism of the submitted arguments, not
          attacks on identity, appearance, protected characteristics,
          disability, health, trauma, or real-life vulnerability. AI can make
          mistakes; report problematic output using{" "}
          <LegalValue value={legalConfig.contactEmail} />.
        </p>
      </LegalSection>

      <LegalSection heading="5. Public sharing">
        <p>
          Sharing a case can make it widely visible and difficult to retract.
          Do not share a case involving a person who has not agreed to be part
          of the joke. The Hall of Shame is a product label, not permission to
          bully anyone.
        </p>
      </LegalSection>

      <LegalSection heading="6. Enforcement">
        <p>
          We may remove or redact content, disable a share link, restrict
          access, report unlawful material where appropriate, and preserve
          information when necessary for safety or legal reasons. Contact{" "}
          <LegalValue value={legalConfig.contactEmail} /> to report a case or
          request review.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
