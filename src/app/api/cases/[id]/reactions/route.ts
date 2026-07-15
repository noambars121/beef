import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getOrCreateSessionId } from "@/lib/session";
import { incrementReaction } from "@/lib/store/db";
import { REACTION_TYPE_VALUES } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const reactionSchema = z.object({
  type: z.enum(REACTION_TYPE_VALUES),
});

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid reaction. Use one of: ${REACTION_TYPE_VALUES.join(", ")}` },
      { status: 400 }
    );
  }

  const sessionId = await getOrCreateSessionId();
  const rate = consumeRateLimit(`react:${sessionId}`, 60, 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Easy on the gavel. Slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    const result = await incrementReaction(id, parsed.data.type);
    if (!result) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/cases/:id/reactions]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
