"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseFormErrors } from "@/lib/validators/case-form";
import type { CaseFormState } from "@/types";
import {
  JURY_WINDOW_MINUTES,
  VERDICT_TONES,
  getCategoryLabel,
  partyLabel,
} from "@/types";

interface ReviewStepProps {
  data: CaseFormState;
  errors: CaseFormErrors;
  onChange: (field: keyof CaseFormState, value: string | boolean) => void;
}

export function ReviewStep({ data, errors, onChange }: ReviewStepProps) {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="flex w-full min-w-0 flex-col gap-3 pb-1 sm:gap-4"
    >
      <div className="shrink-0 text-left">
        <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-yellow sm:text-[8px]">
          FINAL REVIEW
        </p>
        <h2 className="mt-1 font-arcade text-xs leading-snug text-foreground sm:text-sm">
          SEAL THE ROM
        </h2>
        <p className="mt-1 font-mono text-[10px] uppercase text-court-muted sm:text-xs">
          Pick the judge&apos;s tone.
        </p>
      </div>

      <article className="min-w-0 border-4 border-arcade-border bg-black/80 p-2.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-yellow sm:text-[8px]">
            MATCH
          </p>
          {data.category !== "" && (
            <span className="max-w-full truncate border-2 border-arcade-border px-2 py-0.5 font-arcade text-[6px] uppercase tracking-wider text-court-muted sm:text-[7px]">
              {getCategoryLabel(data.category)}
            </span>
          )}
        </div>
        <h3 className="mt-1 break-all font-mono text-sm font-bold leading-snug sm:break-words sm:text-base">
          {data.title}
        </h3>
      </article>

      <div className="grid min-w-0 gap-2 sm:grid-cols-2 sm:gap-3">
        <article className="min-w-0 border-4 border-arcade-blue/40 bg-arcade-blue/5 p-2.5 sm:p-3">
          <p className="break-all font-arcade text-[7px] uppercase tracking-wider text-arcade-blue sm:break-words sm:text-[8px]">
            P1 — {partyLabel("A", data.name_a)}
          </p>
          <p className="mt-1 break-all text-xs leading-relaxed text-foreground/90 sm:break-words sm:text-sm">
            {data.argument_a}
          </p>
          {data.evidence_a && (
            <p className="mt-1 break-all text-[10px] text-court-muted sm:break-words">
              Evidence: {data.evidence_a}
            </p>
          )}
        </article>

        <article className="min-w-0 border-4 border-arcade-pink/40 bg-arcade-pink/5 p-2.5 sm:p-3">
          <p className="break-all font-arcade text-[7px] uppercase tracking-wider text-arcade-pink sm:break-words sm:text-[8px]">
            P2 — {partyLabel("B", data.name_b)}
          </p>
          <p className="mt-1 break-all text-xs leading-relaxed text-foreground/90 sm:break-words sm:text-sm">
            {data.argument_b}
          </p>
          {data.evidence_b && (
            <p className="mt-1 break-all text-[10px] text-court-muted sm:break-words">
              Evidence: {data.evidence_b}
            </p>
          )}
        </article>
      </div>

      <div className="min-w-0">
        <p className="arcade-label mb-2">Judge&apos;s Tone</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {VERDICT_TONES.map((tone) => {
            const selected = data.tone === tone.value;
            return (
              <label
                key={tone.value}
                className={[
                  "touch-target min-w-0 cursor-pointer border-4 p-2.5 transition-colors sm:p-3",
                  selected
                    ? "border-arcade-yellow bg-arcade-yellow/10 neon-glow-yellow"
                    : "border-arcade-border bg-black hover:border-arcade-yellow/50",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="tone"
                  value={tone.value}
                  checked={selected}
                  onChange={() => onChange("tone", tone.value)}
                  className="sr-only"
                />
                <p
                  className={[
                    "font-arcade text-[8px] uppercase tracking-wider sm:text-[9px]",
                    selected ? "text-arcade-yellow" : "text-foreground",
                  ].join(" ")}
                >
                  {tone.label}
                </p>
                <p className="mt-0.5 font-mono text-[10px] leading-snug text-court-muted sm:text-xs">
                  {tone.description}
                </p>
              </label>
            );
          })}
        </div>
      </div>

      {/* Jury mode — optional 5-minute crowd court before the AI reveal */}
      <div className="min-w-0">
        <p className="arcade-label mb-2">Jury Mode — Optional</p>
        <label
          className={[
            "touch-target flex min-w-0 cursor-pointer items-start gap-3 border-4 p-2.5 transition-colors sm:p-3",
            data.jury_enabled
              ? "border-court-crimson bg-court-crimson/10 shadow-[0_0_20px_rgba(255,32,64,0.25)]"
              : "border-arcade-border bg-black hover:border-court-crimson/50",
          ].join(" ")}
        >
          <input
            type="checkbox"
            name="jury_enabled"
            checked={data.jury_enabled}
            onChange={(e) => onChange("jury_enabled", e.target.checked)}
            className="sr-only"
          />
          <span
            aria-hidden
            className={[
              "mt-0.5 shrink-0 border-2 px-1.5 py-1 font-arcade text-[7px] tracking-wider transition-colors",
              data.jury_enabled
                ? "border-court-crimson bg-court-crimson text-black"
                : "border-arcade-border bg-black text-court-muted",
            ].join(" ")}
          >
            {data.jury_enabled ? "ON" : "OFF"}
          </span>
          <span className="min-w-0">
            <span
              className={[
                "block font-arcade text-[8px] uppercase tracking-wider sm:text-[9px]",
                data.jury_enabled ? "text-court-crimson" : "text-foreground",
              ].join(" ")}
            >
              SUMMON THE JURY ({JURY_WINDOW_MINUTES} MIN)
            </span>
            <span className="mt-0.5 block font-mono text-[10px] leading-snug text-court-muted sm:text-xs">
              Seal the AI verdict for {JURY_WINDOW_MINUTES} minutes. Everyone
              you send the link to must pick a side blind — then the judge
              enters the court and reveals who was right.
            </span>
          </span>
        </label>
      </div>

      {/* Consent gate — both boxes are required before the case can be filed */}
      <fieldset className="min-w-0 border-4 border-arcade-border bg-black/80 p-2.5 sm:p-4">
        <legend className="flex flex-wrap items-center gap-x-2 px-1">
          <span className="font-arcade text-[7px] uppercase tracking-wider text-arcade-yellow sm:text-[8px]">
            FINAL CLEARANCE
          </span>
          <span className="font-arcade text-[6px] uppercase tracking-wider text-arcade-pink sm:text-[7px]">
            REQUIRED TO FILE
          </span>
        </legend>

        <div className="space-y-2.5 sm:space-y-3">
          <ConsentCheckbox
            name="age_confirmed"
            checked={data.age_confirmed}
            error={errors.age_confirmed}
            onChange={(value) => onChange("age_confirmed", value)}
          >
            I confirm I am at least 13 years old and have the right to submit
            this content.
          </ConsentCheckbox>

          <ConsentCheckbox
            name="terms_accepted"
            checked={data.terms_accepted}
            error={errors.terms_accepted}
            onChange={(value) => onChange("terms_accepted", value)}
          >
            I agree to the <ConsentLink href="/terms">Terms of Use</ConsentLink>{" "}
            and <ConsentLink href="/community">Community Rules</ConsentLink>,
            and I understand BEEF&rsquo;s{" "}
            <ConsentLink href="/ai-disclosure">
              AI verdict is for entertainment only
            </ConsentLink>
            .
          </ConsentCheckbox>
        </div>
      </fieldset>
    </motion.div>
  );
}

interface ConsentCheckboxProps {
  name: string;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
  children: ReactNode;
}

function ConsentCheckbox({
  name,
  checked,
  error,
  onChange,
  children,
}: ConsentCheckboxProps) {
  const inputId = `consent-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className={[
          "flex cursor-pointer items-start gap-2.5 border-2 bg-black/60 p-2 transition-colors sm:gap-3 sm:p-2.5",
          error
            ? "border-arcade-pink"
            : checked
              ? "border-arcade-yellow/60"
              : "border-arcade-border hover:border-arcade-yellow/40",
        ].join(" ")}
      >
        <input
          id={inputId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-arcade-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arcade-yellow sm:h-[18px] sm:w-[18px]"
        />
        <span className="min-w-0 font-mono text-[11px] leading-relaxed text-foreground/90 sm:text-xs">
          {children}
        </span>
      </label>
      {error && (
        <p
          id={errorId}
          className="mt-1 font-mono text-[10px] uppercase text-arcade-pink"
          role="alert"
        >
          [ERROR: {error}]
        </p>
      )}
    </div>
  );
}

/** Opens in a new tab so wizard state survives reading the policy. */
function ConsentLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-arcade-blue underline decoration-arcade-blue/40 underline-offset-2 transition-colors hover:text-arcade-yellow hover:decoration-arcade-yellow/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-arcade-yellow"
    >
      {children}
    </Link>
  );
}
