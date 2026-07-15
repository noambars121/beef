import type { Metadata } from "next";
import { LegalPageLayout, LegalValue } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Terms of Use | BEEF",
  description:
    "The BEEF Terms of Use: an entertainment-only AI dispute experience. Eligibility, user responsibilities, AI-generated results, and liability terms.",
};

export default function TermsPage() {
  const entity = <LegalValue value={legalConfig.entityName} />;

  return (
    <LegalPageLayout
      title="BEEF Terms of Use"
      subtitle="Entertainment-only AI dispute experience"
      currentPath="/terms"
    >
      <LegalSection heading="1. What BEEF is">
        <p>
          BEEF is an entertainment-oriented web application that lets users
          submit two sides of a disagreement and receive an AI-generated
          opinion, scores, explanation, and playful roast (the
          &ldquo;Service&rdquo;). The Service is not a court, arbitrator,
          mediator, lawyer, legal adviser, therapist, financial adviser, or
          emergency service. Every result is for entertainment and discussion
          only; it is not a binding decision and must not be relied on to
          resolve legal, medical, financial, employment, safety, family,
          housing, or other consequential disputes.
        </p>
      </LegalSection>

      <LegalSection heading="2. Acceptance and eligibility">
        <p>
          By accessing or using the Service, you agree to these Terms of Use
          and confirm that you are legally able to do so. You must be at least
          13 years old. If you are under the age of majority where you live,
          you may use the Service only with the permission and supervision of a
          parent or legal guardian. Do not use BEEF if local law prohibits it.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your responsibilities">
        <ul>
          <li>Provide truthful, lawful, and reasonably respectful submissions.</li>
          <li>
            Do not submit private, confidential, sensitive, or identifying
            information about another person unless you have the right and
            permission to do so.
          </li>
          <li>
            Do not use the Service to threaten, harass, defame, impersonate,
            discriminate against, dox, stalk, blackmail, or target another
            person.
          </li>
          <li>
            Do not submit content involving a real minor&rsquo;s personal
            information, sexual content, exploitation, or abuse.
          </li>
          <li>
            Do not use the Service to obtain professional advice, evade law
            enforcement, coordinate wrongdoing, scrape the Service, bypass rate
            limits, or interfere with its operation.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. AI-generated results">
        <p>
          BEEF uses artificial intelligence. AI can be inaccurate, incomplete,
          biased, or inappropriate despite safeguards. The AI does not
          independently verify claims or evidence. You are responsible for
          deciding whether, how, and with whom to act on any output. Do not
          treat a verdict, score, roast, or appeal result as a factual finding
          about any person.
        </p>
      </LegalSection>

      <LegalSection heading="5. User content and permission to operate">
        <p>
          You retain ownership of content you submit, subject to the rights you
          grant here. You grant {entity} a worldwide, non-exclusive,
          royalty-free license to host, process, reproduce, display, modify
          solely for technical operation and safety, analyze, and create
          AI-generated outputs from your submitted content. This license ends
          when your content is deleted from active systems, except to the
          extent retention is necessary for security, legal obligations,
          dispute handling, backups, or aggregated/de-identified analytics. You
          represent that you have all rights and permissions needed to submit
          the content.
        </p>
      </LegalSection>

      <LegalSection heading="6. Public sharing and the Hall of Shame">
        <p>
          Cases, verdicts, reactions, share cards, and related material may be
          visible to people who receive a shared link or are displayed in
          public areas of the Service, including the Hall of Shame, depending
          on the product setting. Do not submit anything you would not want
          others to see. We may remove, limit, redact, de-index, or refuse to
          display content at our discretion.
        </p>
      </LegalSection>

      <LegalSection heading="7. Prohibited content and enforcement">
        <p>
          The Community &amp; Content Policy is incorporated into these Terms.
          We may investigate violations and may remove content, block sharing,
          restrict access, rate-limit activity, or terminate access without
          notice where reasonably necessary to protect users, the Service, or
          others.
        </p>
      </LegalSection>

      <LegalSection heading="8. Intellectual property">
        <p>
          The Service, its software, branding, designs, prompts, visual assets,
          and other materials are owned by or licensed to {entity} and are
          protected by applicable intellectual-property laws. Except for the
          limited right to use the Service under these Terms, no rights are
          granted to you.
        </p>
      </LegalSection>

      <LegalSection heading="9. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
          AVAILABLE.&rdquo; TO THE MAXIMUM EXTENT PERMITTED BY LAW,{" "}
          {entity} DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR
          STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, NON-INFRINGEMENT, ACCURACY, AVAILABILITY, AND SECURITY. WE
          DO NOT GUARANTEE THAT THE SERVICE OR AI OUTPUT WILL BE ERROR-FREE,
          AVAILABLE, SAFE, OR SUITABLE FOR YOUR PURPOSE.
        </p>
      </LegalSection>

      <LegalSection heading="10. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {entity} AND ITS PERSONNEL
          WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST DATA, PROFITS, GOODWILL,
          OR REPUTATION, ARISING FROM OR RELATED TO THE SERVICE. OUR TOTAL
          LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE WILL NOT EXCEED THE
          GREATER OF US$100 OR THE AMOUNT YOU PAID US FOR THE SERVICE IN THE 12
          MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.
        </p>
      </LegalSection>

      <LegalSection heading="11. Indemnity">
        <p>
          To the extent permitted by law, you will defend, indemnify, and hold
          harmless {entity} and its personnel from claims, damages,
          liabilities, and expenses arising from your content, your misuse of
          the Service, or your violation of these Terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes, suspension, and termination">
        <p>
          We may modify, suspend, or discontinue all or part of the Service, or
          update these Terms. Material changes will be posted with a revised
          effective date. Your continued use after changes take effect means
          you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="13. Governing law and contact">
        <p>
          These Terms are governed by the laws of{" "}
          <LegalValue value={legalConfig.governingLaw} />, excluding
          conflict-of-law rules. Courts located in{" "}
          <LegalValue value={legalConfig.governingLaw} /> will have exclusive
          jurisdiction unless applicable law requires otherwise. Contact:{" "}
          <LegalValue value={legalConfig.contactEmail} />; mailing address:{" "}
          <LegalValue value={legalConfig.mailingAddress} />.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
