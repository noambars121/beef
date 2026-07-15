import type { Metadata } from "next";
import { LegalPageLayout, LegalValue } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "AI Transparency Disclosure | BEEF",
  description:
    "What the BEEF AI judge does — and does not — do. AI verdicts are non-binding entertainment output, not fact-finding, legal advice, or real rulings.",
};

export default function AiDisclosurePage() {
  return (
    <LegalPageLayout
      title="BEEF AI Transparency Disclosure"
      subtitle="What the AI judge does—and does not—do"
      currentPath="/ai-disclosure"
    >
      <LegalSection heading="1. AI is part of the experience">
        <p>
          BEEF uses an automated AI system to analyze the two sides of a
          submitted case and generate a non-binding entertainment output. The
          output can include a winner, scores, reasoning, a roast, and an
          appeal result.
        </p>
      </LegalSection>

      <LegalSection heading="2. What the AI does not do">
        <p>
          The AI does not independently investigate facts, authenticate
          evidence, determine truth, apply law, provide legal advice, make
          binding decisions, or replace human judgment. It may be wrong,
          incomplete, inconsistent, or influenced by the wording and omissions
          in a submission.
        </p>
      </LegalSection>

      <LegalSection heading="3. Human impact and choices">
        <p>
          BEEF should not be used to make decisions about employment, housing,
          credit, insurance, education, healthcare, legal rights, safety, or
          other high-impact matters. Users decide whether to submit, share,
          react to, or disregard an output.
        </p>
      </LegalSection>

      <LegalSection heading="4. Input restrictions">
        <p>
          Do not submit sensitive personal data, private messages without
          permission, identifying information about others, or content
          involving minors. See the Privacy Notice and Community &amp; Content
          Policy.
        </p>
      </LegalSection>

      <LegalSection heading="5. Tone and safety">
        <p>
          The selected judge tone controls style, not factual reliability.
          &ldquo;Savage&rdquo; means playful critique of arguments; it must not
          be used to target protected characteristics or vulnerable personal
          traits. We may filter, limit, revise, remove, or refuse content and
          outputs for safety, quality, or legal reasons.
        </p>
      </LegalSection>

      <LegalSection heading="6. Feedback and reporting">
        <p>
          If an output is unsafe, discriminatory, clearly inaccurate, or
          otherwise problematic, do not rely on it or amplify it. Report it at{" "}
          <LegalValue value={legalConfig.contactEmail} /> with the case URL and
          a brief explanation.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
