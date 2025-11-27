import { NextRequest, NextResponse } from "next/server";
import { getRoundResults } from "../../../lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  try {
    const { roundId } = await params;

    if (!roundId) {
      return NextResponse.json({ error: "Missing roundId" }, { status: 400 });
    }

    const results = await getRoundResults(roundId);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("GET /api/results error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
