"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { DisputeStep } from "@/components/case/DisputeStep";
import { FormStepIndicator, STEPS } from "@/components/case/FormStepIndicator";
import { PartyStep } from "@/components/case/PartyStep";
import { ReviewStep } from "@/components/case/ReviewStep";
import { Button } from "@/components/ui/Button";
import { PixelIcon } from "@/components/pixel/PixelIcon";
import {
  toCreateCaseRequest,
  validateDisputeStep,
  validateFullForm,
  validateSideAStep,
  validateSideBStep,
  type CaseFormErrors,
} from "@/lib/validators/case-form";
import type {
  CaseFormState,
  CaseFormStep,
  CreateCaseResponse,
} from "@/types";

const INITIAL_STATE: CaseFormState = {
  title: "",
  category: "",
  name_a: "",
  argument_a: "",
  evidence_a: "",
  name_b: "",
  argument_b: "",
  evidence_b: "",
  tone: "savage",
  // Jury mode is an opt-in twist, never a default requirement.
  jury_enabled: false,
  // Consent boxes intentionally start unchecked — never pre-check these.
  age_confirmed: false,
  terms_accepted: false,
};

const SERVER_FIELD_MAP: Record<string, keyof CaseFormState> = {
  title: "title",
  category: "category",
  side_a_text: "argument_a",
  side_a_evidence: "evidence_a",
  side_a_name: "name_a",
  side_b_text: "argument_b",
  side_b_evidence: "evidence_b",
  side_b_name: "name_b",
  jury_enabled: "jury_enabled",
  age_confirmed: "age_confirmed",
  terms_accepted: "terms_accepted",
};

export function CaseSubmissionForm() {
  const router = useRouter();
  const [step, setStep] = useState<CaseFormStep>("dispute");
  const [data, setData] = useState<CaseFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<CaseFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const isCompactStep = step === "side-a" || step === "side-b";
  const isReviewStep = step === "review";

  const handleChange = useCallback(
    (field: keyof CaseFormState, value: string | boolean) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setSubmitError(null);
    },
    []
  );

  const validateCurrentStep = useCallback((): CaseFormErrors => {
    switch (step) {
      case "dispute":
        return validateDisputeStep(data);
      case "side-a":
        return validateSideAStep(data);
      case "side-b":
        return validateSideBStep(data);
      case "review":
        return validateFullForm(data);
      default:
        return {};
    }
  }, [step, data]);

  const goNext = useCallback(() => {
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    const nextIndex = Math.min(stepIndex + 1, STEPS.length - 1);
    setStep(STEPS[nextIndex].id);
  }, [validateCurrentStep, stepIndex]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      router.push("/");
      return;
    }
    setErrors({});
    setSubmitError(null);
    setStep(STEPS[stepIndex - 1].id);
  }, [stepIndex, router]);

  const handleSubmit = async () => {
    const formErrors = validateFullForm(data);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toCreateCaseRequest(data)),
      });

      const result = (await response.json()) as CreateCaseResponse & {
        error?: string;
        details?: Record<string, string>;
      };

      if (!response.ok) {
        if (result.details) {
          const mapped: CaseFormErrors = {};
          for (const [key, message] of Object.entries(result.details)) {
            const field = SERVER_FIELD_MAP[key];
            if (field) mapped[field] = message;
          }
          if (Object.keys(mapped).length > 0) setErrors(mapped);
        }
        throw new Error(result.error ?? "Failed to file the case");
      }

      try {
        await fetch(`/api/cases/${result.case_id}/verdict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tone: data.tone }),
        });
      } catch {
        // Ignored: the case page handles the retry path.
      }

      router.push(`/case/${result.case_id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="arcade-panel arcade-screen flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none p-3 sm:p-5">
      {step === "dispute" && (
        <header className="mb-2 shrink-0 text-center sm:mb-3">
          <p className="font-arcade text-[7px] uppercase tracking-[0.2em] text-arcade-pink text-flash sm:text-[8px] sm:tracking-[0.3em]">
            STAGE 01: CHARACTER SELECT
          </p>
          <h1 className="mx-auto mt-1 font-arcade text-sm leading-relaxed text-arcade-yellow filter drop-shadow-[0_2px_0_#000] sm:text-lg md:text-xl">
            INSERT YOUR DISPUTE
          </h1>
        </header>
      )}

      <FormStepIndicator currentStep={step} compact={isCompactStep || isReviewStep} />

      <div
        className={[
          "min-h-0 flex-1 px-0.5 text-left",
          isCompactStep
            ? "flex flex-col overflow-hidden"
            : "overflow-x-hidden overflow-y-auto",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          {step === "dispute" && (
            <DisputeStep data={data} errors={errors} onChange={handleChange} />
          )}
          {step === "side-a" && (
            <PartyStep side="A" data={data} errors={errors} onChange={handleChange} />
          )}
          {step === "side-b" && (
            <PartyStep side="B" data={data} errors={errors} onChange={handleChange} />
          )}
          {step === "review" && (
            <ReviewStep data={data} errors={errors} onChange={handleChange} />
          )}
        </AnimatePresence>

        {submitError && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 border-4 border-arcade-pink bg-black p-3 font-mono text-[10px] uppercase text-arcade-pink sm:text-xs"
            role="alert"
          >
            [ERROR: {submitError}]
          </motion.p>
        )}
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2 border-t-4 border-arcade-border pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
        {step === "review" ? (
          <Button
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!data.age_confirmed || !data.terms_accepted}
            title={
              !data.age_confirmed || !data.terms_accepted
                ? "Check both boxes in FINAL CLEARANCE to file"
                : undefined
            }
            onClick={handleSubmit}
            className="w-full min-w-0 px-3 text-[9px] sm:w-auto sm:px-8 sm:text-[10px]"
          >
            <span className="inline-flex max-w-full items-center justify-center gap-2">
              <PixelIcon asset="gavel" size={18} alt="" className="shrink-0" />
              <span className="text-center leading-tight">DRAG THEM TO COURT</span>
            </span>
          </Button>
        ) : (
          <Button variant="secondary" onClick={goNext} className="w-full sm:w-auto sm:order-2">
            CONTINUE →
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={goBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto sm:order-1"
        >
          ← BACK
        </Button>
      </div>
    </div>
  );
}
