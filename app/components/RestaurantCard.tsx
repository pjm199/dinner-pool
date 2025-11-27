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
    <div
      className={`group rounded-2xl border p-4 shadow-lg transition-all duration-150
        bg-gradient-to-br from-slate-500 to-slate-800
        ${
          disabled
            ? "border-slate-700 opacity-80"
            : "border-slate-600/80 hover:border-emerald-400/70 hover:-translate-y-[1px]"
        }
      `}
    >
      {/* Top row: name + link */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-orange-500 truncate">
            {restaurant.name}
          </h2>
          <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-slate-100">
            {restaurant.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <a
          href={restaurant.url}
          className="text-[11px] underline text-sky-300 hover:text-sky-200 shrink-0"
          target="_blank"
          rel="noreferrer"
        >
          Open in Maps
        </a>
      </div>

      {/* Vote widget */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-slate-100">Your vote</p>
          {!disabled && (
            <span className="text-[11px] text-slate-400">Slide to choose</span>
          )}
        </div>

        <div className="flex justify-between text-[11px] mb-1 text-slate-300">
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
          className="w-full accent-emerald-400 cursor-pointer"
          disabled={disabled}
        />

        <p className="mt-2 text-xs text-slate-200">
          {disabled ? (
            <span className="text-slate-500">
              Join the poll above to vote on this place.
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
    </div>
  );
}
