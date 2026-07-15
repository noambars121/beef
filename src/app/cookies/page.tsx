import type { Metadata } from "next";
import { LegalPageLayout, LegalValue } from "@/components/legal/LegalPageLayout";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Cookie Notice | BEEF",
  description:
    "The BEEF Cookie Notice: the essential anonymous session cookie BEEF uses, related technologies, and how to manage cookies in your browser.",
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="BEEF Cookie Notice"
      subtitle="Anonymous sessions and related technologies"
      currentPath="/cookies"
    >
      <LegalSection heading="1. What cookies are">
        <p>
          Cookies are small text files stored by a browser. Similar
          technologies may include local storage, pixels, and server logs.
        </p>
      </LegalSection>

      <LegalSection heading="2. Cookies BEEF currently uses">
        <ul>
          <li>
            Essential session cookie: <code>beef_session</code>. It stores an
            anonymous UUID used to identify a browser session, determine case
            ownership, prevent duplicate voting, and apply rate limits. It is
            HTTP-only, SameSite=Lax, and intended to persist for up to one
            year.
          </li>
          <li>
            Strictly necessary technical storage or logs may be used by our
            hosting, security, and infrastructure providers to operate and
            protect the Service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Optional technologies">
        <p>
          Do not add analytics, advertising, retargeting, social-media pixels,
          or non-essential cookies without updating this Notice and
          implementing any consent mechanism required in the locations where
          BEEF is offered. Before launch, inventory every script, tag, SDK, and
          third-party request.
        </p>
      </LegalSection>

      <LegalSection heading="4. Managing cookies">
        <p>
          You can manage or delete cookies in your browser settings. Blocking
          essential cookies may prevent case ownership, voting controls, rate
          limits, or other features from working correctly.
        </p>
      </LegalSection>

      <LegalSection heading="5. Contact">
        <p>
          Questions about cookies can be sent to{" "}
          <LegalValue value={legalConfig.contactEmail} />.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
