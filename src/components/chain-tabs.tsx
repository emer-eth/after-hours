"use client";

import { useState } from "react";
import { CHAIN, CHAINS, type ChainKey } from "@/lib/chains";
import { ChainDot } from "./check-form";

/** Switch the board between chains. Both panes are server-rendered; only the chosen one is shown. */
export function ChainTabs({ panes, counts }: { panes: Record<ChainKey, React.ReactNode>; counts?: Partial<Record<ChainKey, string>> }) {
  const [chain, setChain] = useState<ChainKey>("robinhood");
  return (
    <div>
      <div className="mt-8 inline-flex border border-line bg-panel/60 p-1" role="tablist" aria-label="Chain">
        {CHAINS.map((c) => (
          <button
            key={c}
            role="tab"
            type="button"
            aria-selected={chain === c}
            onClick={() => setChain(c)}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors ${chain === c ? "bg-ink text-night" : "text-soft hover:text-ink"}`}
          >
            <ChainDot chain={c} />
            {CHAIN[c].label}
            {counts?.[c] && <span className={`font-mono text-[11px] ${chain === c ? "text-night/60" : "text-faint"}`}>{counts[c]}</span>}
          </button>
        ))}
      </div>
      {CHAINS.map((c) => (
        <div key={c} role="tabpanel" hidden={chain !== c}>
          {panes[c]}
        </div>
      ))}
    </div>
  );
}
