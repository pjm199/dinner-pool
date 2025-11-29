import React, { useState } from "react";

export type Restaurant = {
  id: string;
  name: string;
  tags: string[];
  url: string;
  location: string;
  description: string;
  images?: string[];
  specialties?: string[];
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
  const [expanded, setExpanded] = useState(false);

  const numericValue = value ?? 1; // default middle
  const labels = ["No", "OK", "Top choice"];
  const currentLabel = labels[numericValue];

  return (
    <div
      className={`group rounded-2xl border-emerald-400/100 p-6 shadow-lg
        bg-gradient-to-br from-blue-600 to-zinc-900
        ${
          disabled
            ? "border-orange-300"
            : "border-orange-300 hover:border-emerald-400/70 hover:-translate-y-[5px]"
        }`}
    >
      {/* Top: name + location + link */}
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-amber-500 truncate">
              {restaurant.name}
            </h2>
          </div>
          <p className="mt-0.5 text-[12px] text-slate-100 flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">{restaurant.location}</span>
          </p>

          <div className="flex flex-wrap gap-1 mt-1 text-[12px] text-slate-100">
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
          className="text-[12px] underline text-sky-100 hover:text-sky-200 shrink-0"
          target="_blank"
          rel="noreferrer"
        >
          Website
        </a>
      </div>

      {/* Short description */}
      <p className="mt-3 text-s text-slate-100">{restaurant.description}</p>

      {/* Vote widget */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-slate-100">Your vote -</p>
          {!disabled && (
            <span className="text-[12px] text-slate-100">Slide to choose</span>
          )}
        </div>

        <div className="flex justify-between text-[14px] mb-1 text-amber-300">
          <span>No</span>
          <span>OK</span>
          <span>Top</span>
        </div>

        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={numericValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-emerald-300 cursor-pointer"
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

      {/* Toggle details */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1 text-[12px] text-sky-300 hover:text-sky-200"
      >
        {expanded ? "Hide details" : "Show details"}
        <span
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* Expanded details: images + specialties */}
      {expanded && (
        <div className="mt-3 border-t border-slate-700 pt-3 space-y-3">
          {restaurant.images && restaurant.images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {restaurant.images.map((src, idx) => (
                <img
                  key={src + idx}
                  src={src}
                  alt={`${restaurant.name} ${idx + 1}`}
                  className="h-24 w-32 rounded-lg object-cover flex-shrink-0"
                />
              ))}
            </div>
          )}

          {restaurant.specialties && restaurant.specialties.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-slate-100 mb-1">
                Specialties
              </p>
              <ul className="text-[12px] text-slate-200 list-disc list-inside space-y-0.5">
                {restaurant.specialties.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
