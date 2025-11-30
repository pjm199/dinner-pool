// app/api/admin/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resetVotes } from "../../../lib/db";

export async function POST(request: NextRequest) {
  // avoid unused-parameter warnings
  void request;

  try {
    await resetVotes();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/reset error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
