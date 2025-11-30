"use client";

import { useState } from "react";

type AdminRestaurantMeta = {
  id: string;
  name: string;
};

type ApiResultRow = {
  restaurant_id: string;
  total_score: number;
  votes_count: number;
};

type AdminApiResponse = {
  results?: ApiResultRow[];
};

type AggregatedResult = {
  id: string;
  name: string;
  score: number;
  votesCount: number;
};

const adminRestaurants: AdminRestaurantMeta[] = [
  { id: "r1", name: "Trattoria Da Mario" },
  { id: "r2", name: "Pizzeria Vesuvio" },
  { id: "r3", name: "Sushi Master" },
  { id: "r4", name: "Green Garden" },
  { id: "r5", name: "Burger House" },
  // add more if you have them
];

const ROUND_OPTIONS: string[] = ["round-1", "round-2", "final"];

export default function AdminPage() {
  const [roundId, setRoundId] = useState<string>("round-1");
  const [results, setResults] = useState<AggregatedResult[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const res = await fetch(`/api/results/${roundId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: AdminApiResponse = await res.json();
      const rawResults: ApiResultRow[] = data.results ?? [];

      const aggregated: AggregatedResult[] = rawResults.map((row) => {
        const restaurantMeta = adminRestaurants.find(
          (x) => x.id === row.restaurant_id
        );

        return {
          id: row.restaurant_id,
          name: restaurantMeta?.name ?? row.restaurant_id,
          score: row.total_score,
          votesCount: row.votes_count,
        };
      });

      // Ensure all known restaurants appear, even with 0 votes
      const withZeros: AggregatedResult[] = adminRestaurants.map((r) => {
        const found = aggregated.find((a) => a.id === r.id);
        if (found) return found;
        return {
          id: r.id,
          name: r.name,
          score: 0,
          votesCount: 0,
        };
      });

      withZeros.sort((a, b) => b.score - a.score);
      setResults(withZeros);
    } catch (err) {
      console.error("Error loading admin results", err);
      setError("Error loading results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-md px-4 py-6 space-y-4">
        <header className="text-center">
          <h1 className="text-2xl font-bold mb-1">Admin · Results</h1>
          <p className="text-xs text-slate-400">
            Private view — don&apos;t share this link.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-300">Select round</label>
            <select
              value={roundId}
              onChange={(e) => setRoundId(e.target.value)}
              className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {ROUND_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadResults}
            className="w-full mt-3 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
          >
            {loading ? "Loading..." : "Refresh results"}
          </button>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </section>

        {/* Results */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <h2 className="text-sm font-semibold mb-2">
            Round: <span className="font-mono">{roundId}</span>
          </h2>

          {!results && !loading && !error && (
            <p className="text-xs text-slate-400">
              Click &quot;Refresh results&quot; to load votes.
            </p>
          )}

          {results && results.length > 0 && (
            <>
              <div className="mb-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-[11px] uppercase tracking-[0.15em] text-emerald-300 mb-1">
                  Leader
                </p>
                <p className="text-sm font-semibold">{results[0].name} 🎉</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  Total points:{" "}
                  <span className="font-mono font-semibold">
                    {results[0].score}
                  </span>{" "}
                  · Voters:{" "}
                  <span className="font-mono font-semibold">
                    {results[0].votesCount}
                  </span>
                </p>
              </div>

              <ul className="text-xs space-y-1">
                {results.map((r, index) => (
                  <li key={r.id} className="flex justify-between items-center">
                    <span>
                      <span className="text-slate-500 mr-1">{index + 1}.</span>
                      {r.name}
                    </span>
                    <span className="font-mono">
                      {r.score} ({r.votesCount})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {results && results.length === 0 && (
            <p className="text-xs text-slate-400">
              No votes yet for this round.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
