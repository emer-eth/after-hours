"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CHAIN, CHAINS, type ChainKey } from "@/lib/chains";

const SIZES = [1_000, 10_000, 50_000];
type Item = { symbol: string; name: string };

/** Pick a chain, a token, a side and an amount; the check runs on its own page so the result can be shared. */
export function CheckForm({ symbols, initial }: { symbols: Partial<Record<ChainKey, Item[]>>; initial?: { symbol: string; side: "buy" | "sell"; usd: number; chain?: ChainKey } }) {
  const router = useRouter();
  const [chain, setChain] = useState<ChainKey>(initial?.chain ?? "robinhood");
  const list = symbols[chain] ?? [];
  const pickDefault = (l: Item[], want?: string) => (want && l.some((s) => s.symbol === want) ? want : l.some((s) => s.symbol === "NVDA") ? "NVDA" : l[0]?.symbol);
  const [symbol, setSymbol] = useState(pickDefault(list, initial?.symbol));
  const [side, setSide] = useState<"buy" | "sell">(initial?.side ?? "sell");
  const [amount, setAmount] = useState(String(initial?.usd ?? 10_000));
  const [busy, setBusy] = useState(false);
  const usd = Math.round(Number(amount.replace(/[^0-9.]/g, "")));
  const valid = usd >= 10 && usd <= 5_000_000;
  const available = CHAINS.filter((c) => (symbols[c]?.length ?? 0) > 0);

  return (
    <form
      className="panel grid gap-4 p-4 sm:p-5 lg:grid-cols-[auto_1.3fr_auto_1fr_auto] lg:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || !symbol) return;
        setBusy(true);
        router.push(`/check/${symbol}?side=${side}&usd=${usd}${chain === "base" ? "&chain=base" : ""}`);
      }}
    >
      <fieldset className="grid gap-1.5 text-sm text-soft">
        <legend className="mb-1.5">Chain</legend>
        <div className="flex border border-line bg-panel-2 p-1">
          {available.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={chain === c}
              onClick={() => {
                setChain(c);
                setSymbol(pickDefault(symbols[c] ?? [], symbol));
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${chain === c ? "bg-ink text-night" : "text-soft hover:text-ink"}`}
            >
              <ChainDot chain={c} />
              {CHAIN[c].short}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="grid gap-1.5 text-sm text-soft">
        Asset
        <select className="field" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {list.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} · {s.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-1.5 text-sm text-soft">
        <legend className="mb-1.5">I want to</legend>
        <div className="flex border border-line bg-panel-2 p-1">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
              className={`px-4 py-1.5 text-[13px] font-medium capitalize transition-colors ${side === s ? "bg-ink text-night" : "text-soft hover:text-ink"}`}
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
            <button key={s} type="button" onClick={() => setAmount(String(s))} className={`border px-2 py-0.5 font-mono text-[11px] tnum ${usd === s ? "border-lamp/60 text-lamp" : "border-line text-faint hover:text-soft"}`}>
              ${s / 1000}k
            </button>
          ))}
        </span>
      </label>

      <button type="submit" disabled={!valid || busy} className="h-[46px] self-start bg-lamp px-5 font-mono text-[12px] font-semibold tracking-[.12em] text-night uppercase transition hover:brightness-110 disabled:opacity-50 lg:mt-[26px]">
        {busy ? "Checking…" : "Check trade →"}
      </button>
    </form>
  );
}

/** A tiny chain badge: Robinhood's green feather-ish dot, Base's blue square. */
export function ChainDot({ chain }: { chain: ChainKey }) {
  return chain === "base" ? <span className="size-2.5 bg-[#2151f5]" aria-hidden /> : <span className="size-2.5 rounded-full bg-[#ccff00]" aria-hidden />;
}
