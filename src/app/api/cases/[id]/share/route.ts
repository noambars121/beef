import { NextResponse } from "next/server";
import { getShareablePackage } from "@/lib/actions/cases";
import { ApiError } from "@/lib/api-error";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  try {
    const sharePackage = await getShareablePackage(id, baseUrl);
    return NextResponse.json(sharePackage);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[GET /api/cases/:id/share]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
