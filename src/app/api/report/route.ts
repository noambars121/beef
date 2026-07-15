import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { isLegalPlaceholder, legalConfig } from "@/lib/legal-config";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sendReportEmail } from "@/lib/report-email";
import { getOrCreateSessionId } from "@/lib/session";

const CATEGORIES = [
  "privacy",
  "harassment",
  "threat",
  "copyright",
  "impersonation",
  "other",
] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  privacy: "Privacy / personal information",
  harassment: "Harassment or bullying",
  threat: "Threat or safety concern",
  copyright: "Copyright",
  impersonation: "Impersonation",
  other: "Other",
};

const reportSchema = z.object({
  case_id: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9_-]*$/, "Invalid case ID")
    .optional()
    .default(""),
  category: z.enum(CATEGORIES, { error: "Pick a report category" }),
  explanation: z
    .string()
    .trim()
    .min(10, "Explain what happened (at least 10 characters)")
    .max(2000, "Keep the explanation under 2000 characters"),
  contact_email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .default("")
    .refine(
      (value) => !value || (value.includes("@") && value.includes(".")),
      "That email address looks off"
    ),
  website: z.string().max(0).optional().default(""),
});

function zodDetails(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}

function requireConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return url;
}

/**
 * Files a report in Convex and emails the legal inbox when Gmail SMTP
 * (REPORT_EMAIL_PASS) is configured.
 */
export async function POST(request: Request) {
  if (isLegalPlaceholder(legalConfig.contactEmail)) {
    return NextResponse.json(
      { error: "Report inbox is not configured yet." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: zodDetails(parsed.error) },
      { status: 400 }
    );
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const sessionId = await getOrCreateSessionId();
  const rate = consumeRateLimit(`report:${sessionId}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many reports. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  const { case_id, category, explanation, contact_email } = parsed.data;
  const categoryLabel = CATEGORY_LABELS[category];
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin;
  const caseUrl = case_id ? `${origin}/case/${case_id}` : "(no case ID provided)";

  const subject = `BEEF report: ${categoryLabel}${
    case_id ? ` — case ${case_id}` : ""
  }`;

  const message = [
    "BEEF REPORT / REMOVAL REQUEST",
    "------------------------------",
    `Case ID: ${case_id || "(not provided)"}`,
    `Case URL: ${caseUrl}`,
    `Category: ${categoryLabel}`,
    `Reply email: ${contact_email || "(not provided)"}`,
    "",
    "What happened:",
    explanation,
    "",
    "------------------------------",
    "Sent via the BEEF report form.",
  ].join("\n");

  try {
    const reportId = (await fetchMutation(
      api.reports.submit,
      {
        case_id: case_id || undefined,
        category,
        explanation,
        contact_email: contact_email || undefined,
        session_id: sessionId,
      },
      { url: requireConvexUrl() }
    )) as Id<"reports">;

    let emailed = false;
    try {
      emailed = await sendReportEmail({
        subject,
        message,
        replyTo: contact_email || undefined,
      });
      if (emailed) {
        await fetchMutation(
          api.reports.markEmailed,
          { reportId },
          { url: requireConvexUrl() }
        );
      }
    } catch (mailError) {
      console.error("[POST /api/report] email failed", mailError);
    }

    return NextResponse.json({ ok: true, emailed });
  } catch (error) {
    console.error("[POST /api/report]", error);
    return NextResponse.json(
      { error: "Could not file the report. Try again shortly." },
      { status: 500 }
    );
  }
}
