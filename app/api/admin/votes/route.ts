import { NextRequest, NextResponse } from "next/server";
import { getVotes, VoteRow } from "../../../lib/db";

type VotesResponse = {
  votes: VoteRow[];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundIdParam = searchParams.get("roundId");
    const roundId =
      roundIdParam && roundIdParam.length > 0 ? roundIdParam : undefined;

    const votes = await getVotes(roundId);

    const body: VotesResponse = { votes };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
