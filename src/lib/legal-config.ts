/**
 * Central legal identity config for BEEF.
 *
 * Every legal page, the site footer, and the report flow read these values.
 * Contact is email-only — no personal name or physical office on this product.
 */

export interface LegalConfig {
  /** User-facing product name. */
  productName: string;
  /** Operating name shown on legal pages (not a personal name). */
  entityName: string;
  /** Monitored inbox for legal, privacy, copyright, and report requests. */
  contactEmail: string;
  /** Mailing note — BEEF has no physical mailing address. */
  mailingAddress: string;
  /** Governing law jurisdiction (state or country). */
  governingLaw: string;
  /** Effective date shown on every legal document. */
  effectiveDate: string;
}

export const legalConfig: LegalConfig = {
  productName: "BEEF",
  entityName: "BEEF",
  contactEmail: "barsbuildme@gmail.com",
  mailingAddress: "Email only — no physical mailing address",
  governingLaw: "United States",
  effectiveDate: "July 14, 2026",
};

/** True when a value still looks like an unreplaced [BRACKETED] placeholder. */
export function isLegalPlaceholder(value: string): boolean {
  return /\[[^\]]*\]/.test(value);
}

/** True when any launch-blocking legal identity value is still a placeholder. */
export function legalConfigHasPlaceholders(): boolean {
  return [
    legalConfig.entityName,
    legalConfig.contactEmail,
    legalConfig.mailingAddress,
    legalConfig.governingLaw,
  ].some(isLegalPlaceholder);
}

/** Routes for every legal surface, used by footers and cross-links. */
export const LEGAL_ROUTES = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/community", label: "Community Rules" },
  { href: "/cookies", label: "Cookies" },
  { href: "/copyright", label: "Copyright" },
  { href: "/ai-disclosure", label: "AI Disclosure" },
  { href: "/report", label: "Report a Case" },
] as const;
