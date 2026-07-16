import Link from "next/link";
import { LEGAL_ROUTES } from "@/lib/legal-config";

/**
 * Site footer with legal links.
 * On home it sits pinned in the viewport (shrink-0) so the page stays no-scroll.
 */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="mt-auto shrink-0 border-t border-white/10 bg-black/80">
      <div
        className={[
          "mx-auto w-full max-w-5xl px-3 sm:px-6",
          compact
            ? "pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
            : "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:pt-3.5",
        ].join(" ")}
      >
        <nav aria-label="Legal and safety">
          <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 sm:gap-x-2">
            {LEGAL_ROUTES.map((route) => (
              <li key={route.href} className="flex">
                <Link href={route.href} className="site-footer-link">
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {!compact ? (
          <p className="mt-1.5 text-center font-body text-[11px] leading-snug text-court-muted sm:text-xs">
            BEEF is for low-stakes arguments and entertainment—not legal advice
            or real-world dispute resolution.
          </p>
        ) : null}
      </div>
    </footer>
  );
}
