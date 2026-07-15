import type { ReactNode } from "react";

interface LegalSectionProps {
  /** Section heading, e.g. "1. What BEEF is". */
  heading: string;
  children: ReactNode;
}

/** A titled section of a legal document with proper heading hierarchy. */
export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="legal-section">
      <h2>{heading}</h2>
      {children}
    </section>
  );
}
