"use client";

import { useState } from "react";
import { pct } from "@/lib/verdict";
import { track } from "@/lib/track";

/** Share this check: a post on X (the card shows up as its image), the link itself, or the card as a PNG. */
export function ShareButtons({ symbol, side, usd, chain = "robinhood", title, costPct }: { symbol: string; side: "buy" | "sell"; usd: number; chain?: "robinhood" | "base"; title: string; costPct: number }) {
  const [copied, setCopied] = useState(false);
  const q = `side=${side}&usd=${usd}${chain === "base" ? "&chain=base" : ""}`;
  const path = `/check/${symbol}?${q}`;
  const card = `/api/og?symbol=${symbol}&${q}`;
  const where = chain === "base" ? "Base" : "Robinhood Chain";
  const amount = `$${usd.toLocaleString("en-US")}`;
  const text =
    costPct >= 0.003
      ? `${side === "buy" ? "Buying" : "Selling"} ${amount} of $${symbol} on ${where} right now costs ${pct(costPct)} vs the last real price. After Hours says: ${title.toLowerCase()}.`
      : `Checked a ${amount} ${side} of $${symbol} on ${where} before trading. After Hours says: ${title.toLowerCase()}.`;

  const full = () => (typeof window !== "undefined" ? `${window.location.origin}${path}` : path);
  const btn = "rounded-lg border border-line bg-panel/60 px-3 py-1.5 text-sm text-soft transition-colors hover:border-faint hover:text-ink";

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <a className={btn} target="_blank" rel="noreferrer" href="#" onClick={(e) => { void track("share_x", { symbol, side, usd }); e.currentTarget.href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(full())}`; }}>
        Share on X
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            void track("share_copy", { symbol, side, usd });
            await navigator.clipboard.writeText(full());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link:", full());
          }
        }}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a className={btn} href={card} onClick={() => void track("share_card", { symbol, side, usd })} download={`after-hours-${symbol}-${side}.png`}>
        Download card
      </a>
    </div>
  );
}
