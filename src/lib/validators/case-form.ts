import { z } from "zod";
import type { CaseFormState, CreateCaseRequest } from "@/types";
import { CASE_CATEGORY_VALUES, VERDICT_TONE_VALUES } from "@/types";

const fighterNameSchema = z
  .string()
  .trim()
  .max(24, "Fighter names cap at 24 characters");

export const caseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be under 120 characters"),
  category: z.enum(CASE_CATEGORY_VALUES, {
    error: "Pick a category for the docket",
  }),
  name_a: fighterNameSchema,
  argument_a: z
    .string()
    .trim()
    .min(30, "Side A's argument needs at least 30 characters")
    .max(3000, "Argument must be under 3000 characters"),
  evidence_a: z.string().trim().max(1000, "Evidence must be under 1000 characters"),
  name_b: fighterNameSchema,
  argument_b: z
    .string()
    .trim()
    .min(30, "Side B's argument needs at least 30 characters")
    .max(3000, "Argument must be under 3000 characters"),
  evidence_b: z.string().trim().max(1000, "Evidence must be under 1000 characters"),
  tone: z.enum(VERDICT_TONE_VALUES),
  jury_enabled: z.boolean(),
  age_confirmed: z.literal(true, {
    error: "Confirm you are at least 13 and have the right to submit this",
  }),
  terms_accepted: z.literal(true, {
    error: "Accept the Terms of Use and Community Rules to file your case",
  }),
});

export type CaseFormErrors = Partial<Record<keyof CaseFormState, string>>;

const disputeFields = ["title", "category"] as const;
const sideAFields = ["name_a", "argument_a", "evidence_a"] as const;
const sideBFields = ["name_b", "argument_b", "evidence_b"] as const;

function pickErrors(
  result:
    | { success: true; data: unknown }
    | { success: false; error: z.ZodError },
  fields: readonly (keyof CaseFormState)[]
): CaseFormErrors {
  if (result.success) return {};

  const errors: CaseFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CaseFormState;
    if (fields.includes(field) && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export function validateDisputeStep(data: CaseFormState): CaseFormErrors {
  return pickErrors(caseFormSchema.safeParse(data), disputeFields);
}

export function validateSideAStep(data: CaseFormState): CaseFormErrors {
  return pickErrors(caseFormSchema.safeParse(data), sideAFields);
}

export function validateSideBStep(data: CaseFormState): CaseFormErrors {
  return pickErrors(caseFormSchema.safeParse(data), sideBFields);
}

export function validateFullForm(data: CaseFormState): CaseFormErrors {
  const result = caseFormSchema.safeParse(data);
  if (result.success) return {};

  const errors: CaseFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CaseFormState;
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export function toCreateCaseRequest(data: CaseFormState): CreateCaseRequest {
  const parsed = caseFormSchema.parse(data);
  return {
    title: parsed.title,
    category: parsed.category,
    side_a_text: parsed.argument_a,
    side_b_text: parsed.argument_b,
    side_a_evidence: parsed.evidence_a || undefined,
    side_b_evidence: parsed.evidence_b || undefined,
    side_a_name: parsed.name_a || undefined,
    side_b_name: parsed.name_b || undefined,
    age_confirmed: parsed.age_confirmed,
    terms_accepted: parsed.terms_accepted,
    jury_enabled: parsed.jury_enabled,
  };
}
