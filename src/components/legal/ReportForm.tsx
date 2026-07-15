"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { isLegalPlaceholder, legalConfig } from "@/lib/legal-config";

const REPORT_CATEGORIES = [
  { value: "privacy", label: "Privacy / personal information" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "threat", label: "Threat or safety concern" },
  { value: "copyright", label: "Copyright" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
] as const;

type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

function sanitizeCaseId(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
}

interface ReportErrors {
  category?: string;
  explanation?: string;
  contact_email?: string;
  form?: string;
}

export function ReportForm() {
  const searchParams = useSearchParams();
  const prefilledCaseId = useMemo(
    () => sanitizeCaseId(searchParams.get("case_id")),
    [searchParams]
  );

  const [caseId, setCaseId] = useState(prefilledCaseId);
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [explanation, setExplanation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<ReportErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailIsPlaceholder = isLegalPlaceholder(legalConfig.contactEmail);

  const validate = (): ReportErrors => {
    const next: ReportErrors = {};
    if (!category) next.category = "Pick a report category";
    if (explanation.trim().length < 10) {
      next.explanation = "Explain what happened (at least 10 characters)";
    }
    const email = contactEmail.trim();
    if (email && (!email.includes("@") || email.length > 254)) {
      next.contact_email = "That email address looks off";
    }
    return next;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || emailIsPlaceholder || submitting) {
      return;
    }

    setSubmitting(true);
    setSent(false);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: sanitizeCaseId(caseId),
          category,
          explanation: explanation.trim(),
          contact_email: contactEmail.trim(),
          website: honeypot,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        details?: Record<string, string>;
      } | null;

      if (!response.ok) {
        setErrors({
          form:
            payload?.error ||
            payload?.details?.explanation ||
            payload?.details?.category ||
            "Could not file the report. Try again.",
        });
        return;
      }

      setSent(true);
      setExplanation("");
      setCategory("");
      setContactEmail("");
      setErrors({});
    } catch {
      setErrors({ form: "Network error — try again in a moment." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="Case ID (optional)"
        name="case_id"
        value={caseId}
        onChange={(e) => setCaseId(sanitizeCaseId(e.target.value))}
        placeholder="Paste the case ID or leave blank"
        hint="Pre-filled when you arrive from a case page"
        autoComplete="off"
        spellCheck={false}
        maxLength={64}
      />

      <div className="space-y-1.5">
        <label htmlFor="report-category" className="arcade-label">
          What are you reporting?
        </label>
        <select
          id="report-category"
          name="category"
          required
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as ReportCategory | "");
            setErrors((prev) => ({ ...prev, category: undefined, form: undefined }));
          }}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "report-category-error" : undefined}
          className={[
            "arcade-input appearance-none text-base sm:text-sm",
            errors.category ? "border-arcade-pink focus:border-arcade-pink" : "",
          ].join(" ")}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {REPORT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p
            id="report-category-error"
            className="font-mono text-[10px] uppercase text-arcade-pink"
            role="alert"
          >
            [ERROR: {errors.category}]
          </p>
        )}
      </div>

      <Textarea
        label="What happened?"
        name="explanation"
        required
        value={explanation}
        onChange={(e) => {
          setExplanation(e.target.value);
          setErrors((prev) => ({
            ...prev,
            explanation: undefined,
            form: undefined,
          }));
        }}
        rows={5}
        maxLength={2000}
        showCount
        error={errors.explanation}
        placeholder="Describe the problem and, if you are asking for removal, which content should come down. Do not include more personal information than needed."
      />

      <Input
        label="Your email (optional)"
        name="contact_email"
        type="email"
        value={contactEmail}
        onChange={(e) => {
          setContactEmail(e.target.value);
          setErrors((prev) => ({
            ...prev,
            contact_email: undefined,
            form: undefined,
          }));
        }}
        error={errors.contact_email}
        hint="Only used to reply about this report"
        placeholder="you@example.com"
        autoComplete="email"
        maxLength={254}
      />

      <div
        className="absolute left-[-10000px] top-auto h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="report-website">Website</label>
        <input
          id="report-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {emailIsPlaceholder ? (
        <div
          role="alert"
          className="border-4 border-arcade-yellow bg-arcade-yellow/10 p-3"
        >
          <p className="font-arcade text-[8px] uppercase leading-relaxed tracking-wider text-arcade-yellow">
            ⚠ Dev notice: report inbox not configured
          </p>
          <p className="mt-1 font-mono text-[11px] leading-snug text-foreground/90 sm:text-xs">
            Set a real contact email in{" "}
            <code>src/lib/legal-config.ts</code> to enable report submission.
          </p>
        </div>
      ) : (
        <div className="border-t-4 border-double border-arcade-border pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            disabled={submitting}
          >
            {submitting ? "SENDING…" : "SEND REPORT"}
          </Button>
          {errors.form && (
            <p
              className="mt-2 border-2 border-arcade-pink/60 bg-arcade-pink/10 p-2 font-mono text-[11px] leading-relaxed text-arcade-pink sm:text-xs"
              role="alert"
            >
              [ERROR: {errors.form}]
            </p>
          )}
          {sent && (
            <p
              className="mt-2 border-2 border-arcade-green/60 bg-arcade-green/10 p-2 font-mono text-[11px] leading-relaxed text-arcade-green sm:text-xs"
              role="status"
            >
              Report filed. We&apos;ll review it on a best-effort basis.
            </p>
          )}
        </div>
      )}

      <p className="font-mono text-[10px] leading-relaxed text-court-muted sm:text-[11px]">
        Reports are reviewed on a best-effort basis. Intentionally false or
        abusive reports may be rejected. For urgent danger, contact local
        emergency services first — BEEF is not an emergency service.
      </p>
    </form>
  );
}
