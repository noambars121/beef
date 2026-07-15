import Link from "next/link";
import { LEGAL_ROUTES, legalConfig } from "@/lib/legal-config";

interface LegalFooterProps {
  /** Route of the page rendering this footer; its own link is de-emphasized. */
  currentPath: string;
}

/** Contact block and cross-links at the bottom of each legal document. */
export function LegalFooter({ currentPath }: LegalFooterProps) {
  return (
    <footer className="border-t border-white/10 bg-black/40 px-4 py-5 sm:px-8 sm:py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-arcade-yellow/90 sm:text-[11px]">
        Contact
      </p>
      <div className="mt-2 space-y-1 font-body text-sm leading-relaxed text-court-muted">
        <p>
          Email:{" "}
          <a
            href={`mailto:${legalConfig.contactEmail}`}
            className="text-foreground/90 underline decoration-white/20 underline-offset-2 transition-colors hover:text-arcade-yellow hover:decoration-arcade-yellow/50"
          >
            {legalConfig.contactEmail}
          </a>
        </p>
        <p className="text-court-muted/80">{legalConfig.mailingAddress}</p>
      </div>

      <nav aria-label="More legal documents" className="mt-5">
        <ul className="flex flex-wrap gap-x-3 gap-y-2">
          {LEGAL_ROUTES.map((route) =>
            route.href === currentPath ? (
              <li key={route.href}>
                <span
                  aria-current="page"
                  className="font-mono text-[11px] uppercase tracking-wide text-foreground/40"
                >
                  {route.label}
                </span>
              </li>
            ) : (
              <li key={route.href}>
                <Link href={route.href} className="legal-link">
                  {route.label}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>

      <p className="mt-5 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-wide text-arcade-blue transition-colors hover:text-arcade-yellow"
        >
          ← Back to BEEF
        </Link>
      </p>
    </footer>
  );
}
