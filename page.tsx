"use client";

import { useCallback, useEffect, useState } from "react";

type AdminVote = {
  id: string;
  roundId: string;
  restaurantId: string;
  userId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
};

type VotesApiResponse = {
  votes: {
    id: string;
    round_id: string;
    restaurant_id: string;
    user_id: string;
    score: number;
    created_at: string;
    updated_at: string;
  }[];
};

const DEFAULT_ROUND = "round-1";

export default function AdminVotesPage() {
  const [roundId, setRoundId] = useState<string>(DEFAULT_ROUND);
  const [votes, setVotes] = useState<AdminVote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadVotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = roundId ? `?roundId=${encodeURIComponent(roundId)}` : "";
      const res = await fetch(`/api/admin/votes${query}`);

      if (!res.ok) {
        setError(`Error loading votes (HTTP ${res.status})`);
        return;
      }

      const data: VotesApiResponse = await res.json();
      const mapped: AdminVote[] = data.votes.map((v) => ({
        id: v.id,
        roundId: v.round_id,
        restaurantId: v.restaurant_id,
        userId: v.user_id,
        score: v.score,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      }));

      setVotes(mapped);
    } catch {
      setError("Unexpected error loading votes");
    } finally {
      setLoading(false);
    }
  }, [roundId]);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Delete this vote from the database?");
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setError(null);

      const res = await fetch(`/api/admin/votes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setError(`Error deleting vote (HTTP ${res.status})`);
        return;
      }

      // Remove from local state
      setVotes((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setError("Unexpected error deleting vote");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void loadVotes();
  }, [loadVotes]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-3xl px-4 py-6 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">Admin · Votes</h1>
            <p className="text-xs text-slate-400">
              CRUD view over the <span className="font-mono">votes</span> table.
            </p>
          </div>
          <a
            href="/admin"
            className="text-xs underline text-sky-300 hover:text-sky-200"
          >
            &larr; Back to results
          </a>
        </header>

        <section className="space-y-3 rounded-2xl bg-slate-900/80 border border-slate-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300" htmlFor="round-select">
                Filter by round
              </label>
              <input
                id="round-select"
                type="text"
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="round-1"
              />
              <p className="text-[10px] text-slate-500">
                Example: <span className="font-mono">round-1</span>,{" "}
                <span className="font-mono">round-2</span>,{" "}
                <span className="font-mono">final</span>. Leave empty for all.
              </p>
            </div>

            <button
              type="button"
              onClick={loadVotes}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </section>

        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
          <h2 className="text-sm font-semibold mb-2">Votes ({votes.length})</h2>

          {votes.length === 0 && !loading && (
            <p className="text-xs text-slate-400">
              No votes found for this filter.
            </p>
          )}

          {votes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="py-2 px-2 text-left">Round</th>
                    <th className="py-2 px-2 text-left">Restaurant</th>
                    <th className="py-2 px-2 text-left">User</th>
                    <th className="py-2 px-2 text-right">Score</th>
                    <th className="py-2 px-2 text-left">Created</th>
                    <th className="py-2 px-2 text-left">Updated</th>
                    <th className="py-2 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-slate-800/70 hover:bg-slate-800/60"
                    >
                      <td className="py-2 px-2 font-mono">{v.roundId}</td>
                      <td className="py-2 px-2 font-mono">{v.restaurantId}</td>
                      <td className="py-2 px-2 font-mono">{v.userId}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        {v.score}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-400">
                        {v.createdAt}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-400">
                        {v.updatedAt}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDelete(v.id)}
                          disabled={deletingId === v.id}
                          className="px-2 py-1 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-[11px] font-semibold text-slate-950"
                        >
                          {deletingId === v.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
