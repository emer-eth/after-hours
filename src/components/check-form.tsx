"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SIZES = [1_000, 10_000, 50_000];

/** Pick a token, a side and an amount; the check runs on its own page so the result can be shared. */
export function CheckForm({ symbols, initial }: { symbols: { symbol: string; name: string }[]; initial?: { symbol: string; side: "buy" | "sell"; usd: number } }) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(initial?.symbol ?? (symbols.find((s) => s.symbol === "NVDA") ? "NVDA" : symbols[0]?.symbol));
  const [side, setSide] = useState<"buy" | "sell">(initial?.side ?? "sell");
  const [amount, setAmount] = useState(String(initial?.usd ?? 10_000));
  const [busy, setBusy] = useState(false);
  const usd = Math.round(Number(amount.replace(/[^0-9.]/g, "")));
  const valid = usd >= 10 && usd <= 5_000_000;

  return (
    <form
      className="panel grid gap-4 p-4 sm:grid-cols-[1.3fr_auto_1fr_auto] sm:items-end sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || !symbol) return;
        setBusy(true);
        router.push(`/check/${symbol}?side=${side}&usd=${usd}`);
      }}
    >
      <label className="grid gap-1.5 text-sm text-soft">
        Asset
        <select className="field" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {symbols.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} · {s.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-1.5 text-sm text-soft">
        <legend className="mb-1.5">I want to</legend>
        <div className="flex rounded-xl border border-line bg-panel-2 p-1">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
              className={`rounded-lg px-4 py-1.5 font-medium capitalize transition-colors ${side === s ? "bg-ink text-night" : "text-soft hover:text-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1.5 text-sm text-soft">
        Amount (USD)
        <input className="field tnum" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!valid} />
        <span className="flex gap-1.5">
          {SIZES.map((s) => (
            <button key={s} type="button" onClick={() => setAmount(String(s))} className={`rounded-md border px-2 py-0.5 text-xs tnum ${usd === s ? "border-lamp text-lamp" : "border-line text-faint hover:text-soft"}`}>
              ${s / 1000}k
            </button>
          ))}
        </span>
      </label>

      <button type="submit" disabled={!valid || busy} className="h-[46px] self-start rounded-xl bg-lamp px-5 font-medium text-night transition hover:brightness-110 disabled:opacity-50 sm:mt-[26px]">
        {busy ? "Checking…" : "Check this trade"}
      </button>
    </form>
  );
}
