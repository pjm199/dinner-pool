// lib/db.ts
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let initialized = false;
let initPromise: Promise<void> | null = null;

const currentDeploySha = process.env.VERCEL_GIT_COMMIT_SHA ?? "local-dev";

// Ensure schema exists and reset votes on new deploy (on Vercel)
async function ensureSchema() {
  if (initialized) return;
  if (!initPromise) {
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

      // 2) Meta table to track last deploy SHA
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_meta (
          id int PRIMARY KEY DEFAULT 1,
          last_deploy_sha text
        );
      `);

      // 3) Only do reset logic when we know the commit SHA (on Vercel)
      if (currentDeploySha && currentDeploySha !== "local-dev") {
        const res = await pool.query<{
          last_deploy_sha: string | null;
        }>(`SELECT last_deploy_sha FROM app_meta WHERE id = 1`);

        if (res.rows.length === 0) {
          // First time: just store current SHA, no reset
          await pool.query(
            `INSERT INTO app_meta (id, last_deploy_sha) VALUES (1, $1)`,
            [currentDeploySha]
          );
        } else {
          const lastSha = res.rows[0].last_deploy_sha;
          if (lastSha !== currentDeploySha) {
            // New deploy detected → reset votes
            await pool.query(`TRUNCATE TABLE votes;`);
            await pool.query(
              `UPDATE app_meta SET last_deploy_sha = $1 WHERE id = 1`,
              [currentDeploySha]
            );
          }
        }
      }

      initialized = true;
    })().catch((err) => {
      console.error("Error ensuring schema:", err);
      throw err;
    });
  }
  await initPromise;
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
