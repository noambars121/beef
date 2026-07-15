"use client";

import { motion } from "framer-motion";
import type { CaseFormStep } from "@/types";
import { PixelIcon, type PixelAsset } from "@/components/pixel/PixelIcon";

const STEPS: {
  id: CaseFormStep;
  label: string;
  shortLabel: string;
  asset: PixelAsset;
}[] = [
  { id: "dispute", label: "DISPUTE", shortLabel: "D", asset: "scales" },
  { id: "side-a", label: "P1", shortLabel: "1", asset: "fighterP1" },
  { id: "side-b", label: "P2", shortLabel: "2", asset: "fighterP2" },
  { id: "review", label: "SEAL", shortLabel: "S", asset: "gavel" },
];

interface FormStepIndicatorProps {
  currentStep: CaseFormStep;
  compact?: boolean;
}

export function FormStepIndicator({ currentStep, compact = false }: FormStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav
      aria-label="Form progress"
      className={[
        "shrink-0 border-b-4 border-double border-arcade-border",
        compact ? "mb-3 pb-3 sm:mb-3 sm:pb-3" : "mb-4 pb-4 sm:mb-5 sm:pb-5",
      ].join(" ")}
    >
      <ol className="flex items-center justify-between gap-0.5 sm:gap-2">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
              <div className="relative flex w-full items-center">
                {index > 0 && (
                  <div
                    className={[
                      "absolute right-1/2 h-1 w-full -translate-y-1/2",
                      isComplete || isCurrent ? "bg-arcade-yellow" : "bg-arcade-border",
                    ].join(" ")}
                    style={{ top: "50%", width: "100%", left: "-50%" }}
                  />
                )}
                <motion.div
                  className={[
                    "relative z-10 mx-auto flex shrink-0 items-center justify-center border-4 bg-black transition-all",
                    compact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9 sm:h-11 sm:w-11",
                    isCurrent
                      ? "border-arcade-yellow shadow-[0_0_10px_rgba(255,230,0,0.5)]"
                      : isComplete
                        ? "border-arcade-green"
                        : "border-arcade-border opacity-60",
                  ].join(" ")}
                  animate={isCurrent ? { scale: [1, 1.06, 1] } : {}}
                  transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                >
                  <PixelIcon asset={step.asset} size={compact ? 18 : 20} alt="" className="sm:hidden" />
                  <PixelIcon asset={step.asset} size={compact ? 22 : 26} alt="" className="hidden sm:block" />
                </motion.div>
              </div>
              <span
                className={[
                  "hidden text-center font-arcade text-[7px] uppercase tracking-wider sm:block sm:text-[8px]",
                  isCurrent ? "text-arcade-yellow" : "text-court-muted",
                ].join(" ")}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center font-arcade text-[7px] text-arcade-yellow sm:hidden">
        STEP {currentIndex + 1}/{STEPS.length}: {STEPS[currentIndex].label}
      </p>
    </nav>
  );
}

export { STEPS };
