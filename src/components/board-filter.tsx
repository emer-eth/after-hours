"use client";

import { useState } from "react";

const OPTIONS = [
  { key: "all", label: "All" },
  { key: "stock", label: "Stocks" },
  { key: "etf", label: "ETFs" },
  { key: "commodity", label: "Commodities" },
] as const;

/**
 * Filter chips for the board. Rows are server-rendered with data-kind; this only sets data-filter on the wrapper,
 * and CSS hides the rows that don't match. So the table stays a server component and works without JS.
 */
export function BoardFilter({ counts, children }: { counts: Record<string, number>; children: React.ReactNode }) {
  const [filter, setFilter] = useState<(typeof OPTIONS)[number]["key"]>("all");
  return (
    <div data-filter={filter} className="board-filter">
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Show">
        {OPTIONS.filter((o) => o.key === "all" || counts[o.key]).map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={filter === o.key}
            onClick={() => setFilter(o.key)}
            className={`border px-3.5 py-1.5 font-mono text-[11.5px] tracking-[.12em] uppercase transition-colors ${filter === o.key ? "border-lamp/60 bg-lamp-soft text-lamp" : "border-line text-soft hover:text-ink"}`}
          >
            {o.label}
            <span className="ml-1.5 text-xs opacity-70 tnum">{o.key === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[o.key]}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
