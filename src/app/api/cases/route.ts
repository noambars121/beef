import { NextResponse } from "next/server";
import { z } from "zod";
import { createCase } from "@/lib/actions/cases";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getOrCreateSessionId } from "@/lib/session";
import { CASE_CATEGORY_VALUES } from "@/types";

const fighterNameSchema = z
  .string()
  .trim()
  .max(24, "Fighter names cap at 24 characters")
  .optional();

const createCaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be under 120 characters"),
  category: z.enum(CASE_CATEGORY_VALUES, { error: "Unknown category" }),
  side_a_text: z
    .string()
    .trim()
    .min(30, "Side A's argument needs at least 30 characters")
    .max(3000, "Side A's argument must be under 3000 characters"),
  side_b_text: z
    .string()
    .trim()
    .min(30, "Side B's argument needs at least 30 characters")
    .max(3000, "Side B's argument must be under 3000 characters"),
  side_a_evidence: z.string().trim().max(1000).optional(),
  side_b_evidence: z.string().trim().max(1000).optional(),
  side_a_name: fighterNameSchema,
  side_b_name: fighterNameSchema,
  // JURY MODE: optional 5-minute crowd-court window before the reveal.
  jury_enabled: z.boolean().optional().default(false),
  // Consent gate — server-side enforcement, never trust the client checkboxes.
  // Both fields must be strictly `true`; anything else fails validation.
  age_confirmed: z.literal(true, {
    error: "You must confirm you are at least 13 and may submit this content",
  }),
  terms_accepted: z.literal(true, {
    error:
      "You must accept the Terms of Use and Community Rules before filing",
  }),
});

function zodDetails(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    if (!details[key]) {
      details[key] = issue.message;
    }
  }
  return details;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  const sessionId = await getOrCreateSessionId();

  const rate = consumeRateLimit(`create:${sessionId}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many cases filed. The docket is full — try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    // TODO(consent): before production launch, persist proof of acceptance —
    // e.g. an accepted_at timestamp + a terms version string on the case row
    // (or a small consent log keyed by owner_session_id). Skipped here to
    // avoid Convex schema churn; the gate above already blocks non-consented
    // submissions server-side.
    const result = await createCase(parsed.data, sessionId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cases]", error);
    return NextResponse.json(
      { error: "The court clerk's filing system is down. Try again shortly." },
      { status: 500 }
    );
  }
}
