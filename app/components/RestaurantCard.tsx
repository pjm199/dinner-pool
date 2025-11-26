import React from "react";

export type Restaurant = {
  id: string;
  name: string;
  tags: string[];
  url: string;
};

type RestaurantCardProps = {
  restaurant: Restaurant;
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function RestaurantCard({
  restaurant,
  value,
  onChange,
  disabled = false,
}: RestaurantCardProps) {
  const numericValue = value ?? 1; // default middle
  const labels = ["No", "OK", "Top choice"];
  const currentLabel = labels[numericValue];

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 shadow-md">
      {/* Restaurant info */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-lg font-semibold">{restaurant.name}</h2>
          <div className="flex flex-wrap gap-1 mt-1 text-xs text-slate-300">
            {restaurant.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-slate-800"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <a
          href={restaurant.url}
          className="text-xs underline text-sky-400"
          target="_blank"
          rel="noreferrer"
        >
          Open in Maps
        </a>
      </div>

      {/* Vote widget */}
      <div className="mt-4 opacity-100">
        <p className="text-sm mb-2">Your vote:</p>
        <div className="flex justify-between text-xs mb-1">
          <span>No</span>
          <span>OK</span>
          <span>Top choice</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={numericValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-slate-300">
          {disabled ? (
            <span className="text-slate-500">
              Join the poll above to vote.
            </span>
          ) : (
            <>
              You chose:{" "}
              <span className="font-semibold text-emerald-300">
                {currentLabel}
              </span>
            </>
          )}
        </p>
      </div>

      {disabled && (
        <div className="mt-2 text-[10px] text-slate-500">
          Voting is locked until you join this poll.
        </div>
      )}
    </div>
  );
}
