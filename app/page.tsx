"use client";

import { useEffect, useState } from "react";
import { RestaurantCard, Restaurant } from "./components/RestaurantCard";

const ROUND_ID = "round-1"; // change to "round-2", "final" for next rounds

// example closing time – adjust!
const pollClosesAt = new Date("2025-11-27T21:00:00+01:00");

const restaurants: Restaurant[] = [
  { id: "r1", name: "Trattoria Da Mario", tags: ["🍝 Italian", "€€"], url: "#" },
  { id: "r2", name: "Pizzeria Vesuvio", tags: ["🍕 Pizza", "€"], url: "#" },
  { id: "r3", name: "Sushi Master", tags: ["🍣 Sushi", "€€€"], url: "#" },
  { id: "r4", name: "Green Garden", tags: ["🥗 Vegan", "€€"], url: "#" },
  { id: "r5", name: "Burger House", tags: ["🍔 Burger", "€"], url: "#" },
  // add up to 10 for Round 1
];

type AggregatedResult = {
  id: string;
  name: string;
  score: number;
  votesCount: number;
};

type ResultRow = {
  restaurant_id: string;
  total_score: string | number;
  votes_count: string | number;
};

export default function HomePage() {
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [results, setResults] = useState<AggregatedResult[] | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // simple "now" and closed state – recalculated each render
  const [isClosed, setIsClosed] = useState(false);
  const [closingText, setClosingText] = useState("");



  useEffect(() => {
    // runs only in browser
    const now = new Date();
    setIsClosed(now > pollClosesAt);
    setClosingText(pollClosesAt.toLocaleString());
  }, []);

  // init userId (once, per device)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored = localStorage.getItem("dp_user_id");
    if (!stored) {
      stored =
        (crypto as Crypto).randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("dp_user_id", stored);
    }
    setUserId(stored);
  }, []);

  const handleJoin = () => {
    if (!nickname.trim()) return;
    setJoined(true);
  };

  const handleVoteChange = async (restaurantId: string, value: number) => {
    if (!joined || !userId || isClosed) return;

    // update local UI
    setVotes((prev) => ({ ...prev, [restaurantId]: value }));
    setShowResults(false);

    // send to backend (fire & forget)
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: ROUND_ID,
          restaurantId,
          userId,
          score: value,
        }),
      });
    } catch (err) {
      console.error("Error sending vote", err);
    }
  };

  const handleSeeResults = async () => {
    if (!joined) return;

    setIsLoadingResults(true);
    try {
      const res = await fetch(`/api/results/${ROUND_ID}`);
      const data = await res.json();

      const aggregated: AggregatedResult[] = (data.results ?? []).map(
        (row: ResultRow) => {
          const r = restaurants.find((x) => x.id === row.restaurant_id);
          return {
            id: row.restaurant_id,
            name: r?.name ?? row.restaurant_id,
            score: Number(row.total_score),
            votesCount: Number(row.votes_count),
          };
        }
      );

      // ensure we also show restaurants with zero votes
      const withZeros = restaurants.map((r) => {
        const found = aggregated.find((a) => a.id === r.id);
        if (found) return found;
        return { id: r.id, name: r.name, score: 0, votesCount: 0 };
      });

      withZeros.sort((a, b) => b.score - a.score);

      setResults(withZeros);
      setShowResults(true);
    } catch (err) {
      console.error("Error fetching results", err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleResetLocalVotes = () => {
    setVotes({});
    setShowResults(false);
  };

  const hasAnyLocalVote = Object.keys(votes).length > 0;
  const votedCount = Object.keys(votes).length;
  const totalRestaurants = restaurants.length;

  const winner = results?.[0];

  return (
    <main className="min-h-screen bg-blue-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-md px-4 py-6 space-y-4">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-2xl font-bold mb-1 text-emerald-400">
            Dinner Poll 🍽️
          </h1>
          <p className="text-s uppercase tracking-wide text-slate-400">

          </p>
          <p className="text-s uppercase tracking-wide text-slate-400">
            Round 1 — Top 10
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Closes: {closingText || "…"}
          </p>

          {isClosed ? (
            <p className="mt-2 text-sm text-emerald-300">
              This round is <span className="font-semibold">closed</span>. Final
              results below.
            </p>
          ) : joined ? (
            <p className="mt-2 text-sm text-emerald-300">
              Joined as <span className="font-semibold">{nickname}</span>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-300">
              Join the poll, vote for each place, then reveal the winner.
            </p>
          )}
        </header>

        {/* Join card */}
        <section className="mt-2 rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-2">
          <p className="text-sm font-medium">Step 1 — Join this poll</p>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Your name or nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={isClosed}
            />
            <button
              onClick={handleJoin}
              disabled={!nickname.trim() || isClosed}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                nickname.trim() && !isClosed
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              Join
            </button>
          </div>
          {joined && !isClosed && (
            <p className="text-xs text-emerald-300">
              You can now vote on each restaurant below.
            </p>
          )}
        </section>

        {/* Progress info */}
        <section className="flex justify-between items-center text-xs text-slate-400">
          <span>Step 2 — Vote on restaurants</span>
          <span>
            {votedCount} / {totalRestaurants} voted
          </span>
        </section>

        {/* Restaurant list */}
        <section className="space-y-3">
          {restaurants.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              value={votes[r.id]}
              onChange={(value: number) => handleVoteChange(r.id, value)}
              disabled={!joined || isClosed}
            />
          ))}
        </section>

        {/* Actions */}
        <section className="mt-4 flex gap-3">
          <button
            onClick={handleSeeResults}
            disabled={isClosed ? false : !joined || !hasAnyLocalVote}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition
              ${
                joined || isClosed
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
          >
            {isLoadingResults ? "Loading..." : "See results"}
          </button>
          <button
            onClick={handleResetLocalVotes}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-900"
          >
            Reset my votes
          </button>
        </section>

        {/* Results */}
        <section className="mt-4 border-t border-slate-800 pt-4 pb-10">
          <h2 className="text-lg font-semibold mb-2">Results</h2>

          {!showResults && !isClosed && (
            <p className="text-sm text-slate-400">
              After everyone has voted, tap{" "}
              <span className="font-semibold">See results</span> to reveal the
              current ranking.
            </p>
          )}

          {(showResults || isClosed) && results && results.length > 0 && (
            <>
              {winner && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/60">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 mb-1">
                    {isClosed ? "Final winner" : "Current winner"}
                  </p>
                  <p className="text-base font-semibold">{winner.name} 🎉</p>
                  <p className="text-xs text-emerald-200 mt-1">
                    Score: {winner.score} · Votes: {winner.votesCount}
                  </p>
                </div>
              )}

              <ul className="text-sm space-y-1">
                {results.map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>{r.name}</span>
                    <span className="font-mono">
                      {r.score} ({r.votesCount})
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
