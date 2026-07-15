import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getOrCreateSessionId } from "@/lib/session";
import { castCrowdVote, getCaseEnvelope } from "@/lib/store/db";
import type { PredictResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const predictSchema = z.object({
  side: z.enum(["A", "B"]),
});

/**
 * Casts this viewer's crowd prediction. Voting is what unlocks the sealed
 * verdict for non-owners — unless JURY MODE is on and the window is still
 * open, in which case the ruling stays sealed and the client shows the
 * jury-box countdown instead. The seal decision is delegated to getEnvelope
 * so there is exactly one place that decides what a viewer may see.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = predictSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pick a side: A or B" },
      { status: 400 }
    );
  }

  const sessionId = await getOrCreateSessionId();
  const rate = consumeRateLimit(`predict:${sessionId}`, 30, 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Easy, juror. Slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  try {
    const result = await castCrowdVote(id, sessionId, parsed.data.side);

    switch (result.status) {
      case "not_found":
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      case "owner":
        return NextResponse.json(
          { error: "The case filer cannot vote in their own trial" },
          { status: 403 }
        );
      case "ok":
      case "already_voted": {
        // The viewer has a recorded vote now; the envelope decides whether
        // that lifts the seal (it won't while the jury window is open).
        const envelope = await getCaseEnvelope(id, sessionId);
        if (!envelope) {
          return NextResponse.json(
            { error: "Case not found" },
            { status: 404 }
          );
        }
        const response: PredictResponse = {
          crowd: envelope.crowd,
          verdict: envelope.verdict,
          appeal: envelope.appeal,
          verdict_sealed: envelope.verdict_sealed,
          jury: envelope.jury,
        };
        return NextResponse.json(response);
      }
    }
  } catch (error) {
    console.error("[POST /api/cases/:id/predict]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
