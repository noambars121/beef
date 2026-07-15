import Link from "next/link";
import type { ReactNode } from "react";
import { BackLink } from "@/components/layout/BackLink";
import { LegalFooter } from "@/components/legal/LegalFooter";
import {
  LEGAL_ROUTES,
  legalConfig,
  legalConfigHasPlaceholders,
} from "@/lib/legal-config";

interface LegalPageLayoutProps {
  /** Document title, e.g. "BEEF Terms of Use". */
  title: string;
  /** Short strapline under the title, from the source document. */
  subtitle?: string;
  /** Current route, used to de-emphasize self-links in the footer. */
  currentPath: string;
  children: ReactNode;
}

/**
 * Shared shell for legal document pages — calmer reading layout that fits
 * mobile and desktop. Top chrome stays put while the document scrolls.
 */
export function LegalPageLayout({
  title,
  subtitle,
  currentPath,
  children,
}: LegalPageLayoutProps) {
  const hasPlaceholders = legalConfigHasPlaceholders();

  return (
    <main className="legal-page mx-auto w-full max-w-3xl px-3 pb-8 pt-2 sm:px-6 sm:pb-10 sm:pt-3">
      {/* Sticky chrome — does not roll away when scrolling the document */}
      <div className="legal-topbar sticky top-0 z-30 -mx-3 mb-4 bg-[#08080c]/92 px-3 backdrop-blur-md sm:-mx-6 sm:mb-5 sm:px-6">
        <div className="flex items-center gap-2 border-b border-white/10 py-2.5 pr-14">
          <BackLink
            label="← BACK"
            className="!min-h-0 border-2 px-2.5 py-1.5 text-[7px] sm:text-[8px]"
          />
          <p className="hidden min-w-0 truncate font-mono text-[10px] uppercase tracking-wide text-court-muted sm:block">
            Legal · {title}
          </p>
        </div>

        <nav
          aria-label="Legal documents"
          className="legal-doc-nav -mx-3 overflow-x-auto px-3 pb-2.5 pt-2 sm:-mx-0 sm:mx-0 sm:px-0"
        >
          <ul className="flex w-max min-w-full gap-1.5 sm:flex-wrap sm:w-auto">
            {LEGAL_ROUTES.map((route) => {
              const active = route.href === currentPath;
              return (
                <li key={route.href} className="shrink-0">
                  {active ? (
                    <span
                      aria-current="page"
                      className="inline-flex border-2 border-arcade-yellow bg-arcade-yellow/15 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-arcade-yellow sm:text-[11px]"
                    >
                      {route.label}
                    </span>
                  ) : (
                    <Link
                      href={route.href}
                      className="inline-flex border-2 border-arcade-border bg-black/50 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide text-court-muted transition-colors hover:border-arcade-blue hover:text-arcade-blue sm:text-[11px]"
                    >
                      {route.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <article className="legal-article overflow-hidden border border-white/10 bg-[#0c0c12]/95 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
        <header className="border-b border-white/10 px-4 py-5 sm:px-8 sm:py-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-arcade-yellow/90 sm:text-[11px]">
            BEEF · Legal
          </p>
          <h1 className="mt-2 font-body text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-prose font-body text-sm leading-relaxed text-court-muted sm:text-base">
              {subtitle}
            </p>
          )}
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-court-muted sm:text-xs">
            Effective{" "}
            <span className="text-foreground/90">{legalConfig.effectiveDate}</span>
            <span className="mx-1.5 text-white/20">·</span>
            Operator <LegalValue value={legalConfig.entityName} />
          </p>
        </header>

        {hasPlaceholders && (
          <aside
            role="note"
            aria-label="Development notice"
            className="border-b border-arcade-yellow/40 bg-arcade-yellow/95 px-4 py-3 sm:px-8"
          >
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-black sm:text-xs">
              Dev notice — placeholder legal identity
            </p>
            <p className="mt-1 font-body text-[12px] leading-snug text-black/90 sm:text-sm">
              Bracketed values on this page are unreplaced placeholders. Set the
              real entity, contact email, mailing address, and governing law in{" "}
              <code className="rounded bg-black/10 px-1">src/lib/legal-config.ts</code>
              , and have a qualified lawyer review these documents before launch.
            </p>
          </aside>
        )}

        <div className="legal-body px-4 py-5 sm:px-8 sm:py-8">{children}</div>

        <LegalFooter currentPath={currentPath} />
      </article>
    </main>
  );
}

/**
 * Renders a legalConfig value. While the value is still a bracketed
 * placeholder it is highlighted so it cannot be missed in development.
 */
export function LegalValue({ value }: { value: string }) {
  if (/\[[^\]]*\]/.test(value)) {
    return <mark className="legal-placeholder">{value}</mark>;
  }
  return <span className="text-foreground">{value}</span>;
}
