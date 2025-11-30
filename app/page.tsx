"use client";

import { useEffect, useState } from "react";
import { Restaurant } from "./components/RestaurantCard";
import { RestaurantCard } from "./components/RestaurantCard";
/*import { url } from "inspector";*/
/*import Image from "next/image";*/

const ROUND_ID = "round-1"; // change to "round-2", "final" for next rounds

// example closing time – adjust!
const pollClosesAt = new Date("2025-11-31T21:00:00+01:00");

const restaurants: Restaurant[] = [
  {
    id: "r1",
    name: "La Brinca",
    tags: ["🍝 Italian", "€€€"],
    url: "https://www.labrinca.it/",
    location: "Via Campo di Ne, 58 16040 - Ne (GE",
    description:
      "La Brinca proposes a large variety of traditional local dishes which stem from the peasant heritage of west Liguria, therefore only using on the local farm produces of the season",
    images: [
      "/images/brinca-1.jpg",
      "/images/brinca-2.jpg",
      "/images/brinca-3.jpg",
    ],
    specialties: [
      "Acciughe in conserva",
      "Cùniggiu Magro",
      "Bianco e Nero",
      "Gnocchetti di castagna al Pesto di mortaio",
    ],
  },
  {
    id: "r2",
    name: "L'Arca Tra gli Ulivi",
    tags: ["🍝 Italian", "€€"],
    url: "https://www.tripadvisor.com/Restaurant_Review-g187826-d1807364-Reviews-L_Arca_Tra_gli_Ulivi-Rapallo_Italian_Riviera_Liguria.html",
    location: "Rapallo",
    description:
      "Dishes of Italian and Mediterranean cuisines can be ordered at L'Arca Tra gli Ulivi. The great location of this spot makes it easy to reach by any transport. The staff is said to be well-trained here. The spectacular atmosphere makes a good impression on customers.",
    images: ["/images/arca-1.jpg", "/images/arca-2.jpg", "/images/arca-3.jpg"], // put your real paths in /public/images
    specialties: [
      "Ravioli",
      "Asado",
      "Tagliatelle au pesto",
      "Seafood linguine",
      "Tiramisu",
    ],
  },
  {
    id: "r3",
    name: "Ca da Nonna",
    tags: ["🍝 Ligurian Food", "€€"],
    url: "https://www.tripadvisor.it/Restaurant_Review-g1129801-d1739848-Reviews-Agriturismo_Ca_Da_Nonna-Ne_Province_of_Genoa_Liguria.html",
    location: "Cassagna – countryside",
    description: "Ravioli au Tuccu",
    images: [
      "/images/nonna-1.jpg",
      "/images/nonna-2.jpg",
      "/images/nonna-3.jpg",
    ],
    specialties: ["Salumi", "Focaccia", "Torta di riso (Finita in fretta)"],
  },
  {
    id: "r4",
    name: "Locanda Balanzone",
    tags: ["🍝 Ligurian Food", "€€"],
    url: "https://www.tripadvisor.it/Restaurant_Review-g1055404-d10286063-Reviews-Locanda_Balanzone-Carasco_Province_of_Genoa_Liguria.html",
    location: " Carasco ",
    description: "Italiana, Emiliana",
    images: [
      "/images/balanzone-1.jpg",
      "/images/balanzone-2.jpg",
      "/images/balanzone-3.jpg",
    ],
    specialties: ["Salumi", "Ravioli", "Tortellini"],
  },
  {
    id: "r5",
    name: "Settembrin",
    tags: ["🍝 Italian", "€€"],
    url: "https://www.settembrin.it",
    location: "Val Graveglia",
    description: "Restaurant and local seafood.",
    images: [
      "/images/settmbrin-1.jpg",
      "/images/settmbrin-2.jpg",
      "/images/settmbrin-3.jpg",
    ], // put your real paths in /public/images
    specialties: [
      "Pansoti al sugo di noci",
      "Acciughe ripiene",
      "Fritto misto",
    ],
  },
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
    <main className="min-h-screen bg-slate-600 text-slate-50 flex justify-center">
      <div className="w-full max-w-md px-4 py-6 space-y-4">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-2xl font-bold mb-1 text-emerald-400">
            Dinner Poll 🍽️
          </h1>
          {/*  <div className="h-42 w-full rounded-xl bg-[radial-gradient(circle_at_center,_#d2d7dd_0%,_#c6ccd3_45%,_#003664_80%,_#001a33_100%)] shadow-lg flex items-center justify-center">
            <Image
              src="/images/VitoLogoCircle.png"
              alt="Vito Logo"
              className="h-30 w-30 rounded-xl"
              width={120}
              height={120}
            />
          </div>
          <br /> */}
          {/* <div className="h-35 w-70 rounded-xl bg-gradient-to-r from-[#003664] via-[#d2d7dd] to-[#003664] shadow-lg flex items-center justify-center">
            <Image
              src="/images/VitoLogoCircle.png"
              alt="Vito Logo"
              className="h-30 w-30 rounded-xl object-contain"
              width={120}
              height={120}
            />
          </div>
          <br />
          <div className="h-35 w-70 rounded-xl bg-gradient-to-r from-[#003664] via-[#d2d7dd] to-[#003664] shadow-lg flex items-center justify-left pl-8">
            <Image
              src="/images/VitoLogoCircle.png"
              alt="Vito Logo"
              className="h-30 w-30 rounded-xl object-contain"
              width={120}
              height={120}
            />
          </div>
          <br />
          <div
            className="
            h-40 w-80 rounded-xl
            bg-[radial-gradient(circle_at_30%_50%,rgba(245,160,80,0.28)_0,transparent_55%),radial-gradient(circle_at_70%_50%,rgba(40,120,100,0.28)_0,transparent_55%),linear-gradient(to_right,#001a33,#003664)]
            shadow-lg flex items-center justify-center
          "
          >
            <Image
              src="/images/VitoLogoCircle.png"
              alt="Vito Logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>
          <br /> */}
          {/* <div
            className="
        h-40 w-90 rounded-xl
        bg-[radial-gradient(circle_at_25%_50%,rgba(0,10,30,0.5)_0,transparent_80%),radial-gradient(circle_at_70%_50%,rgba(210,215,221,0.7)_0,rgba(198,204,211,0.6)_30%,transparent_60%),linear-gradient(to_right,#001021,#003664)]
        shadow-lg flex items-center justify-left pl-15
      "
          >
            <Image
              src="/images/VitoLogoCircle.png"
              alt="Vito Logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </div> */}
          <p className="text-s uppercase tracking-wide text-slate-200"></p>
          <p className="text-s uppercase tracking-wide text-slate-200">
            Round 1 Test — Top 5 choices
          </p>
          <p className="mt-1 text-xs text-red-500">
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
        <p className="text-sm font-medium">Step 1 — Join this poll</p>
        {/* Join card */}
        <section className="mt-2 rounded-2xl bg-slate-900/70 border border-slate-800 p-4 space-y-2">
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
            <>
              <p className="text-s text-zinc-200">
                You can now vote on each restaurant below.
              </p>
              <p className="text-s text-orange-300">
                No : 0 - OK : 1 - Top : 2 - (Points)
              </p>
            </>
          )}
        </section>

        {/* Progress info */}
        <section className="flex justify-between items-center text-s text-slate-200">
          <p className="text-sm font-medium">Step 2 — Vote on restaurants</p>
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
        <p className="text-sm font-medium">Step 3 — See results </p>

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
            className="px-4 py-2 rounded-xl text-xs font-medium border border-red-700 text-red-500 hover:bg-slate-600"
          >
            Reset my votes
          </button>
        </section>

        {/* Results */}
        <section className="mt-4 border-t border-slate-800 pt-4 pb-10">
          <h2 className="text-lg font-semibold mb-2">Results</h2>

          {/* While poll is open: no results here */}
          {!isClosed && (
            <p className="text-sm text-slate-200">
              Results will be revealed when the poll closes.{" "}
              <span className="text-slate-400 text-xs">
                (Only the organizer can see live votes.)
              </span>
            </p>
          )}

          {/* Poll closed but user hasn't pressed "See results" yet */}
          {isClosed && !showResults && (
            <p className="text-sm text-slate-200">
              The poll is closed. Tap{" "}
              <span className="font-semibold">See final results</span> to reveal
              the winner.
            </p>
          )}

          {/* Final results */}
          {isClosed && showResults && results && results.length > 0 && (
            <>
              {winner && (
                <div className="mb-3 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/60">
                  <p className="text-xs uppercase tracking-wide text-emerald-300 mb-1">
                    Final winner
                  </p>
                  <p className="text-base font-semibold">{winner.name} 🎉</p>
                  <p className="text-xs text-emerald-200 mt-1">
                    Total points: {winner.score} · Voters: {winner.votesCount}
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
