// lib/db.ts
import { sql } from "@vercel/postgres";

export async function upsertVote({
  roundId,
  restaurantId,
  userId,
  score,
}: {
  roundId: string;
  restaurantId: string;
  userId: string;
  score: number;
}) {
  await sql`
    INSERT INTO votes (round_id, restaurant_id, user_id, score)
    VALUES (${roundId}, ${restaurantId}, ${userId}, ${score})
    ON CONFLICT (round_id, restaurant_id, user_id)
    DO UPDATE SET score = ${score}, updated_at = now();
  `;
}

export type VoteResultRow = {
  restaurant_id: string;
  total_score: number;
  votes_count: number;
};

export async function getRoundResults(
  roundId: string
): Promise<VoteResultRow[]> {
  const { rows } = await sql<VoteResultRow>`
    SELECT
      restaurant_id,
      SUM(score)::int AS total_score,
      COUNT(*)::int AS votes_count
    FROM votes
    WHERE round_id = ${roundId}
    GROUP BY restaurant_id
    ORDER BY total_score DESC;
  `;
  return rows;
}
