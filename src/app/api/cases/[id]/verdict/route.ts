import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSessionId } from "@/lib/session";
import { startVerdictGeneration } from "@/lib/verdict/engine";
import { VERDICT_TONE_VALUES } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const verdictRequestSchema = z.object({
  tone: z.enum(VERDICT_TONE_VALUES).optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let tone: (typeof VERDICT_TONE_VALUES)[number] | undefined;
  try {
    const raw = await request.text();
    if (raw) {
      const parsed = verdictRequestSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        return NextResponse.json(
          { error: `Invalid tone. Use one of: ${VERDICT_TONE_VALUES.join(", ")}` },
          { status: 400 }
        );
      }
      tone = parsed.data.tone;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = await getSessionId();

  const rate = consumeRateLimit(
    `verdict:${sessionId ?? "anonymous"}`,
    10,
    60 * 60 * 1000
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "The judge needs a recess. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    await startVerdictGeneration(id, { tone, requesterSessionId: sessionId });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[POST /api/cases/:id/verdict]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { case_id: id, status: "deliberating" },
    { status: 202 }
  );
}
