import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api-error";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getSessionId } from "@/lib/session";
import { startAppealGeneration } from "@/lib/verdict/engine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const appealSchema = z.object({
  plea: z
    .string()
    .trim()
    .min(20, "State your grounds — at least 20 characters")
    .max(600, "The court's patience ends at 600 characters"),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = appealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid appeal plea" },
      { status: 400 }
    );
  }

  const sessionId = await getSessionId();

  const rate = consumeRateLimit(
    `appeal:${sessionId ?? "anonymous"}`,
    5,
    60 * 60 * 1000
  );
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "The appellate docket is full. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    await startAppealGeneration(id, {
      plea: parsed.data.plea,
      requesterSessionId: sessionId,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[POST /api/cases/:id/appeal]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { case_id: id, status: "appealing" },
    { status: 202 }
  );
}
