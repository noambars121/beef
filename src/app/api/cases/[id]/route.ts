import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getCaseEnvelope } from "@/lib/store/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const sessionId = await getSessionId();

  try {
    const envelope = await getCaseEnvelope(id, sessionId);
    if (!envelope) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json(envelope);
  } catch (error) {
    console.error("[GET /api/cases/:id]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
