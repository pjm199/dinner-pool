// lib/db.ts
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let initPromise: Promise<void> | null = null;

async function ensureSchema() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
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
  })().catch((err) => {
    // allow retry if init fails
    initPromise = null;
    console.error("Error in ensureSchema:", err);
    throw err;
  });

  return initPromise;
}

export async function resetVotes(): Promise<void> {
  await ensureSchema();
  await pool.query(`TRUNCATE TABLE votes;`);
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

export type VoteRow = {
  id: string;
  round_id: string;
  restaurant_id: string;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
};

export async function getVotes(roundId?: string): Promise<VoteRow[]> {
  await ensureSchema();

  if (roundId) {
    const res = await pool.query<VoteRow>(
      `
        SELECT id, round_id, restaurant_id, user_id, score,
               to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
               to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
        FROM votes
        WHERE round_id = $1
        ORDER BY created_at DESC
      `,
      [roundId]
    );
    return res.rows;
  }

  const res = await pool.query<VoteRow>(
    `
      SELECT id, round_id, restaurant_id, user_id, score,
             to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
             to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at
      FROM votes
      ORDER BY created_at DESC
    `
  );
  return res.rows;
}

export async function deleteVote(id: string): Promise<void> {
  await ensureSchema();
  await pool.query(`DELETE FROM votes WHERE id = $1`, [id]);
}


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
