"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { CaseFormErrors } from "@/lib/validators/case-form";
import type { CaseFormState, PartySide } from "@/types";

interface PartyStepProps {
  side: PartySide;
  data: CaseFormState;
  errors: CaseFormErrors;
  onChange: (field: keyof CaseFormState, value: string) => void;
}

const SIDE_CONFIG = {
  A: {
    accent: "text-arcade-blue",
    border: "border-arcade-blue/50",
    glow: "neon-glow-blue",
    badge: "border-arcade-blue text-arcade-blue bg-arcade-blue/10",
    nameField: "name_a" as const,
    argumentField: "argument_a" as const,
    evidenceField: "evidence_a" as const,
    title: "PLAYER 1",
    subtitle: "Make your case.",
    namePlaceholder: "Danny, Mom, The Roommate…",
  },
  B: {
    accent: "text-arcade-pink",
    border: "border-arcade-pink/50",
    glow: "neon-glow-pink",
    badge: "border-arcade-pink text-arcade-pink bg-arcade-pink/10",
    nameField: "name_b" as const,
    argumentField: "argument_b" as const,
    evidenceField: "evidence_b" as const,
    title: "PLAYER 2",
    subtitle: "Counter-attack.",
    namePlaceholder: "Maya, Dad, The Landlord…",
  },
};

export function PartyStep({ side, data, errors, onChange }: PartyStepProps) {
  const config = SIDE_CONFIG[side];

  return (
    <motion.div
      key={`side-${side}`}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
    >
      <div className="shrink-0 text-left">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-block border-2 px-2 py-0.5 font-arcade text-[7px] uppercase tracking-wider sm:text-[8px] ${config.badge}`}
          >
            SIDE {side}
          </span>
          <h2 className={`font-arcade text-xs sm:text-sm ${config.accent}`}>
            {config.title}
          </h2>
          <span className="font-mono text-[10px] uppercase text-court-muted sm:text-xs">
            {config.subtitle}
          </span>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col gap-3 border-4 bg-black/80 p-3 sm:gap-3 sm:p-4 ${config.border} ${config.glow}`}
      >
        <Input
          name={config.nameField}
          label="Fighter Name (Optional)"
          placeholder={config.namePlaceholder}
          value={data[config.nameField]}
          onChange={(e) => onChange(config.nameField, e.target.value)}
          error={errors[config.nameField]}
          hint="Real stakes need real names — tag your opponent"
          maxLength={24}
          className="py-2 text-base sm:text-sm"
        />

        <Textarea
          name={config.argumentField}
          label="File your evidence. No crying."
          placeholder="Present your strongest case..."
          value={data[config.argumentField]}
          onChange={(e) => onChange(config.argumentField, e.target.value)}
          error={errors[config.argumentField]}
          maxLength={3000}
          showCount
          rows={4}
          className="!min-h-0 resize-none py-2 text-base sm:text-sm"
          autoFocus
        />

        <Textarea
          name={config.evidenceField}
          label="Evidence (Optional)"
          placeholder="Screenshots, timestamps, witnesses..."
          value={data[config.evidenceField]}
          onChange={(e) => onChange(config.evidenceField, e.target.value)}
          error={errors[config.evidenceField]}
          maxLength={1000}
          rows={2}
          className="!min-h-0 shrink-0 resize-none py-2 text-base sm:text-sm"
        />
      </div>
    </motion.div>
  );
}
