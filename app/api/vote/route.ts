// app/api/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { upsertVote } from "../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const { roundId, restaurantId, userId, score } = await req.json();

    if (
      !roundId ||
      !restaurantId ||
      !userId ||
      typeof score !== "number" ||
      score < 0 ||
      score > 2
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await upsertVote({ roundId, restaurantId, userId, score });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/vote error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
