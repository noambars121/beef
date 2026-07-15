"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import type { CaseFormErrors } from "@/lib/validators/case-form";
import type { CaseFormState } from "@/types";
import { CASE_CATEGORIES } from "@/types";

interface DisputeStepProps {
  data: CaseFormState;
  errors: CaseFormErrors;
  onChange: (field: keyof CaseFormState, value: string) => void;
}

export function DisputeStep({ data, errors, onChange }: DisputeStepProps) {
  return (
    <motion.div
      key="dispute"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 sm:space-y-6"
    >
      <div className="text-left">
        <p className="font-arcade text-[7px] uppercase tracking-wider text-arcade-pink sm:text-[8px]">
          STAGE 01
        </p>
        <h2 className="mt-2 font-arcade text-xs leading-relaxed text-arcade-yellow sm:text-base">
          NAME THE FIGHT
        </h2>
        <p className="mt-2 font-mono text-[10px] uppercase text-court-muted sm:text-xs">
          Pick your arena and title the match.
        </p>
      </div>

      <div className="space-y-5 text-left">
        <Input
          name="title"
          label="Case Title"
          placeholder="What's the drama?"
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          error={errors.title}
          hint="Punchy headline for the docket"
          maxLength={120}
          autoFocus
        />

        <div className="space-y-1.5">
          <label htmlFor="category" className="arcade-label">
            Category
          </label>
        <select
          id="category"
          name="category"
          value={data.category}
          onChange={(e) => onChange("category", e.target.value)}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "category-error" : undefined}
          className={[
            "arcade-input touch-target appearance-none text-base sm:text-sm",
            data.category === "" ? "text-court-muted" : "",
            errors.category ? "border-arcade-pink" : "",
          ].join(" ")}
        >
          <option value="" disabled>
            Choose the arena…
          </option>
          {CASE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p id="category-error" className="font-mono text-[10px] uppercase text-arcade-pink" role="alert">
            [ERROR: {errors.category}]
          </p>
        )}
        </div>
      </div>
    </motion.div>
  );
}
