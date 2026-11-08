"use client";

import { useState } from "react";
import { pct } from "@/lib/verdict";

/** Share this check: a post on X (the card shows up as its image), the link itself, or the card as a PNG. */
export function ShareButtons({ symbol, side, usd, title, costPct }: { symbol: string; side: "buy" | "sell"; usd: number; title: string; costPct: number }) {
  const [copied, setCopied] = useState(false);
  const path = `/check/${symbol}?side=${side}&usd=${usd}`;
  const card = `/api/og?symbol=${symbol}&side=${side}&usd=${usd}`;
  const amount = `$${usd.toLocaleString("en-US")}`;
  const text =
    costPct >= 0.003
      ? `${side === "buy" ? "Buying" : "Selling"} ${amount} of $${symbol} on Robinhood Chain right now costs ${pct(costPct)} vs the last real price. After Hours says: ${title.toLowerCase()}.`
      : `Checked a ${amount} ${side} of $${symbol} on Robinhood Chain before trading. After Hours says: ${title.toLowerCase()}.`;

  const full = () => (typeof window !== "undefined" ? `${window.location.origin}${path}` : path);
  const btn = "rounded-lg border border-line bg-panel/60 px-3 py-1.5 text-sm text-soft transition-colors hover:border-faint hover:text-ink";

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <a className={btn} target="_blank" rel="noreferrer" href="#" onClick={(e) => { e.currentTarget.href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(full())}`; }}>
        Share on X
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
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
      <a className={btn} href={card} download={`after-hours-${symbol}-${side}.png`}>
        Download card
      </a>
    </div>
  );
}
