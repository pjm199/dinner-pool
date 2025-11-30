// lib/db.ts
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Run-once init per instance
let initPromise: Promise<void> | null = null;

async function ensureSchema() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 1) Ensure votes table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id text NOT NULL,
        restaurant_id text NOT NULL,
        user_id text NOT NULL,
        score integer NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE (round_id, restaurant_id, user_id)
      );
    `);

    // 2) In production on Vercel, always reset votes on new instance
    if (process.env.VERCEL_ENV === "production") {
      console.log("[DB] Truncating votes table on startup (production).");
      await pool.query(`TRUNCATE TABLE votes;`);
    }
  })().catch((err) => {
    // If init fails, allow retry on next call
    initPromise = null;
    console.error("Error in ensureSchema:", err);
    throw err;
  });

  return initPromise;
}

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
}): Promise<void> {
  await ensureSchema();

  await pool.query(
    `
      INSERT INTO votes (round_id, restaurant_id, user_id, score)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (round_id, restaurant_id, user_id)
      DO UPDATE SET score = EXCLUDED.score, updated_at = now();
    `,
    [roundId, restaurantId, userId, score]
  );
}

export type VoteResultRow = {
  restaurant_id: string;
  total_score: number;
  votes_count: number;
};

export async function getRoundResults(
  roundId: string
): Promise<VoteResultRow[]> {
  await ensureSchema();

  const res = await pool.query<VoteResultRow>(
    `
      SELECT
        restaurant_id,
        SUM(score)::int AS total_score,
        COUNT(*)::int AS votes_count
      FROM votes
      WHERE round_id = $1
      GROUP BY restaurant_id
      ORDER BY total_score DESC;
    `,
    [roundId]
  );

  return res.rows;
}
