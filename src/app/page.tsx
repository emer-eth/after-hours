import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { cachedBoard, type BoardRow } from "@/lib/board";
import { officialAssets, symbolsFor } from "@/lib/market";
import { CHAIN, CHAINS, type ChainKey } from "@/lib/chains";
import { ChainTabs } from "@/components/chain-tabs";
import { nextOpen, sessionAt } from "@/lib/session";
import { pct, verdict, type Call } from "@/lib/verdict";
import { KIND_LABEL, kindOf } from "@/lib/kinds";
import { CheckForm } from "@/components/check-form";
import { Ago } from "@/components/ago";
import { Stats } from "@/components/stats";
import { GapDiagram } from "@/components/gap-diagram";
import { Chapter, Faq, FinalCta, HowItWorks, VerdictKey } from "@/components/explainers";
import { CountUp } from "@/components/ui/count-up";
import { Term } from "@/components/ui/term";
import { BoardFilter } from "@/components/board-filter";
import { FlapBoard, type FlapRow } from "@/components/flap-board";
import { DotField } from "@/components/dot-field";
import { ScrollWords } from "@/components/scroll-words";
import { ForBuilders, NotAnAggregator, WhereItsGoing } from "@/components/product-sections";

const tone = (x: number) => (x >= 0.0075 ? "text-bad" : x >= 0.003 ? "text-warn" : "text-soft");
const signed = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${pct(Math.abs(x))}`;
const money = (x: number) => `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SHORT: Record<Call, { text: string; tone: "good" | "warn" | "bad" | "lamp" }> = {
  fair: { text: "FAIR", tone: "good" },
  bonus: { text: "BONUS", tone: "good" },
  limit: { text: "LIMIT", tone: "warn" },
  split: { text: "SPLIT", tone: "warn" },
  wait: { text: "WAIT", tone: "bad" },
  thin: { text: "THIN", tone: "bad" },
};

export default function Home() {
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="grid items-center gap-14 pt-16 pb-16 sm:pt-24 lg:grid-cols-[1.08fr_1fr] lg:gap-12">
        <div>
          <p className="label rise flex items-center gap-2.5">
            <span className="h-3 w-[3px] bg-lamp" aria-hidden />
            <b>After-hours trade check</b> <span className="hidden text-faint sm:inline">Robinhood Chain · Base</span>
          </p>
          <h1 className="display rise mt-8 text-[3.4rem] sm:text-[5.6rem]" style={{ ["--d" as string]: ".06s" }}>
            Wall Street
            <br />
            is asleep.
            <br />
            <span className="text-lamp">Its stocks aren&apos;t.</span>
          </h1>
          <p className="rise mt-8 max-w-[34rem] text-[17px] leading-relaxed text-soft" style={{ ["--d" as string]: ".14s" }}>
            Tokenized stocks, ETFs and commodity funds on Robinhood Chain and Base trade all night, in thin markets with nothing live to check against. After Hours shows what your trade really costs before you make it, and whether to trade now or wait.
          </p>
          <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ ["--d" as string]: ".22s" }}>
            <Link href="#check" className="group flex items-center border border-line-2 text-[12px] font-medium tracking-[.14em] uppercase transition-colors hover:border-lamp/60">
              <span className="grid size-12 place-items-center bg-ink text-night transition-colors group-hover:bg-lamp">→</span>
              <span className="px-5 font-mono">Check a trade</span>
            </Link>
            <Link href="#board" className="px-3 font-mono text-[12px] font-medium tracking-[.14em] text-soft uppercase transition-colors hover:text-ink">
              Tonight&apos;s board ▸
            </Link>
          </div>
          <p className="rise mt-8 font-mono text-[11px] tracking-[.08em] text-faint" style={{ ["--d" as string]: ".3s" }}>
            Live data from Robinhood Chain. Prices from Chainlink. Not financial advice.
          </p>
        </div>

        <div className="pop" style={{ ["--d" as string]: ".2s" }}>
          <Suspense fallback={<div className="flap-board shimmer h-[360px]" aria-hidden />}>
            <HeroBoard />
          </Suspense>
        </div>
      </section>

      <StatStrip />

      {/* ───────── 01 Why ───────── */}
      <section className="mt-36" aria-labelledby="problem-title">
        <Chapter n="01" id="problem">Why it exists</Chapter>
        <h2 id="problem-title" className="sr-only">Why After Hours exists</h2>
        <ScrollWords
          className="display mt-8 max-w-5xl text-[2.2rem] leading-[1.08] sm:text-[3.4rem]"
          text="At 4pm New York time the real market closes. The tokens don't. They keep trading in pools a third thinner than in the day, with no live price to anchor them. Most people trading at 2am never see what that costs them. We do the math before you sign."
        />
        <div className="mt-16">
          <GapDiagram />
        </div>
      </section>

      {/* ───────── 02 Last 48 hours ───────── */}
      <section className="mt-36" aria-labelledby="dots-title">
        <Chapter n="02">The last 48 hours</Chapter>
        <h2 id="dots-title" className="display reveal mt-6 max-w-3xl text-5xl sm:text-6xl">
          Not a theory. <span className="text-soft">A log.</span>
        </h2>
        <p className="reveal mt-5 max-w-xl text-soft">
          Every ten minutes we price a $10k trade in every tokenized asset, through the best route on Robinhood Chain, and keep the receipts.
        </p>
        <div className="mt-12">
          <Suspense fallback={<div className="panel shimmer h-72" aria-hidden />}>
            <DotField />
          </Suspense>
        </div>
      </section>

      <HowItWorks />
      <VerdictKey />
      <NotAnAggregator />

      {/* ───────── 04 Try it ───────── */}
      <section className="mt-36" aria-labelledby="check-title">
        <Chapter n="05" id="check">Try it</Chapter>
        <h2 id="check-title" className="display reveal mt-6 text-5xl sm:text-6xl">Check a trade.</h2>
        <p className="reveal mt-5 max-w-xl text-soft">Pick a chain, a stock, ETF or commodity fund, buy or sell, and how much. You&apos;ll get the real cost, one plain call, and a protected way to trade.</p>
        <div className="reveal mt-10">
          <Suspense fallback={<div className="panel shimmer h-[118px]" aria-hidden />}>
            <Form />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <Stats />
        </Suspense>
      </section>

      <Board />

      <ForBuilders />
      <WhereItsGoing />
      <Faq />
      <FinalCta />
    </>
  );
}

/* The hero's departures board: the costliest live trades right now, flipping in. */
async function HeroBoard() {
  await connection();
  const rows = await cachedBoard().catch(() => []);
  const now = new Date();
  const session = sessionAt(now);
  const closed = session !== "regular";
  const mins = Math.max(0, Math.round((+nextOpen(now) - +now) / 60_000));
  const opens = mins >= 1440 ? `${Math.floor(mins / 1440)}D ${String(Math.floor((mins % 1440) / 60)).padStart(2, "0")}H` : `${Math.floor(mins / 60)}H ${String(mins % 60).padStart(2, "0")}M`;

  const cands = rows
    .flatMap((r) => [
      { r, side: "sell" as const, cost: r.sellCostPct, fill: r.sell },
      { r, side: "buy" as const, cost: r.buyCostPct, fill: r.buy },
    ])
    .filter((c) => c.cost < 0.2 && c.r.liquidityUsd > 50_000)
    .sort((a, b) => b.cost - a.cost);
  const seen = new Set<string>();
  const top = cands.filter((c) => !seen.has(c.r.symbol) && seen.add(c.r.symbol)).slice(0, 6);
  const flap: FlapRow[] = top.map((c) => {
    const v = verdict({ side: c.side, usd: 10_000, session, ref: c.r.ref, fill: c.fill, small: null });
    return {
      href: `/check/${c.r.symbol}?side=${c.side}&usd=10000`,
      cells: [
        { text: c.r.symbol, width: 5, tone: "ink" },
        { text: c.side, width: 4, tone: "soft" },
        { text: `${(Math.max(0, v.costPct) * 100).toFixed(2)}%`, width: 6, tone: SHORT[v.call].tone },
        { text: SHORT[v.call].text, width: 5, tone: SHORT[v.call].tone },
      ],
    };
  });
  if (!flap.length) return null;
  return (
    <div>
      <FlapBoard
        title="Live"
        status={closed ? { text: `NYSE OPENS ${opens}`, tone: "lamp" } : { text: "NYSE OPEN", tone: "good" }}
        rows={flap}
        label="The costliest $10k trades on Robinhood Chain right now"
      />
      <p className="mt-3 flex items-center justify-between font-mono text-[10.5px] tracking-[.12em] text-faint uppercase">
        <span>Costliest $10k trades right now</span>
        <span>Tap a row ▸</span>
      </p>
    </div>
  );
}

function StatStrip() {
  const stats = [
    { icon: "◐", label: "Traded after hours", n: 59, suf: "%", note: "of stock-token volume, Sep 24 – Oct 23", href: "https://cryptobriefing.com/robinhood-chain-stock-tokens-after-hours-trading/" },
    { icon: "▤", label: "Thinner at night", n: 33, pre: "up to ", suf: "%", note: "less liquidity near the price after the close", href: "https://www.techflowpost.com/en-US/article/35095" },
    { icon: "◇", label: "Weekend as a signal", n: 54, pre: "~", suf: "%", note: "of Mondays called right: a coin flip", href: "https://cryptoslate.com/weekend-stock-tokens-predict-monday-open-but-guessing-up-scores-55/" },
    { icon: "◉", label: "Assets watched", n: 48, note: "on Robinhood Chain and Base, with a Chainlink real price" },
  ];
  return (
    <section className="reveal grid grid-cols-2 border-y border-line lg:grid-cols-4 lg:divide-x lg:divide-line" aria-label="Key numbers">
      {stats.map((s, i) => (
        <div key={s.label} className={`py-7 lg:px-6 lg:first:pl-0 ${i % 2 ? "pl-5" : "pr-5"} ${i < 2 ? "border-b border-line lg:border-b-0" : ""}`}>
          <p className="flex items-center gap-2.5 text-[13px] text-soft">
            <span className="grid size-6 place-items-center bg-ink text-[11px] text-night" aria-hidden>{s.icon}</span>
            {s.label}
          </p>
          <p className="display mt-5 text-4xl tnum sm:text-5xl">
            <CountUp value={s.n} prefix={s.pre} suffix={s.suf} />
          </p>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {s.note}
            {s.href && (
              <>
                {" · "}
                <a href={s.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-soft">source</a>
              </>
            )}
          </p>
        </div>
      ))}
    </section>
  );
}

async function Form() {
  const lists = await Promise.all(
    CHAINS.map(async (c) => {
      const assets = await officialAssets(c).catch(() => new Map());
      return [c, symbolsFor(c).filter((s) => assets.has(s)).map((s) => ({ symbol: s, name: assets.get(s)!.name }))] as const;
    }),
  );
  return <CheckForm symbols={Object.fromEntries(lists) as Record<ChainKey, { symbol: string; name: string }[]>} />;
}

function Board() {
  return (
    <section className="mt-36" aria-labelledby="board-title">
      <Chapter n="06" id="board">Live board</Chapter>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <h2 id="board-title" className="display reveal text-5xl sm:text-6xl">Tonight&apos;s board.</h2>
        <p className="label reveal flex items-center gap-2">
          <span className="live-dot size-1.5 rounded-full bg-good" aria-hidden /> Best route · refreshed every few minutes
        </p>
      </div>
      <p className="reveal mt-5 max-w-2xl text-soft">
        What a $10,000 trade costs right now, against each asset&apos;s <Term tip="The stock's most recent price on the real market, published onchain by Chainlink.">last real price</Term>. Robinhood Chain and Base, side by side. Tap a row for the full check.
      </p>
      <ChainTabs
        panes={{
          robinhood: (
            <Suspense fallback={<div className="panel shimmer mt-6 h-96" aria-hidden />}>
              <BoardTable chain="robinhood" />
            </Suspense>
          ),
          base: (
            <Suspense fallback={<div className="panel shimmer mt-6 h-96" aria-hidden />}>
              <BoardTable chain="base" />
            </Suspense>
          ),
        }}
      />
    </section>
  );
}

async function BoardTable({ chain }: { chain: ChainKey }) {
  const all = await cachedBoard(chain).catch(() => []);
  const q = chain === "base" ? "&chain=base" : "";
  // Tokens where a $10k trade would lose 20%+ either way aren't really tradeable; list them apart instead of as numbers.
  const isThin = (r: BoardRow) => Math.max(r.buyCostPct, r.sellCostPct) >= 0.2;
  const rows = all.filter((r) => !isThin(r));
  const thin = all.filter(isThin);
  const maxCost = Math.max(0.01, ...rows.map((r) => Math.min(0.05, Math.max(r.buyCostPct, r.sellCostPct))));
  const counts = rows.reduce<Record<string, number>>((c, r) => ((c[kindOf(r.symbol)] = (c[kindOf(r.symbol)] || 0) + 1), c), {});
  return (
    <div>
      {rows.length === 0 ? (
        <p className="panel mt-8 p-6 text-soft">{CHAIN[chain].label} didn&apos;t answer just now. Refresh in a minute.</p>
      ) : (
        <BoardFilter counts={counts}>
          <div className="reveal mt-5 overflow-x-auto border-y border-line">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="text-left font-mono text-[10.5px] tracking-[.14em] text-faint uppercase">
                <tr className="border-b border-line">
                  <th className="py-3.5 pr-4 font-normal">Asset</th>
                  <th className="px-4 py-3.5 text-right font-normal">Last real price</th>
                  <th className="px-4 py-3.5 text-right font-normal">Drift</th>
                  <th className="px-4 py-3.5 font-normal">Buy $10k</th>
                  <th className="py-3.5 pl-4 font-normal">Sell $10k</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {rows.map((r) => (
                  <tr key={r.symbol} data-kind={kindOf(r.symbol)} className="group border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.02]">
                    <td className="py-3.5 pr-4">
                      <Link href={`/check/${r.symbol}?side=${r.sellCostPct > r.buyCostPct ? "sell" : "buy"}&usd=10000${q}`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.logo} alt="" className="size-8 rounded-full bg-panel-2" loading="lazy" />
                        <span>
                          <span className="flex items-center gap-2 font-medium text-ink transition-colors group-hover:text-lamp">
                            {r.symbol}
                            {kindOf(r.symbol) !== "stock" && <span className="border border-line px-1.5 py-px font-mono text-[9.5px] font-normal tracking-[.12em] text-faint uppercase">{KIND_LABEL[kindOf(r.symbol)]}</span>}
                          </span>
                          <span className="block max-w-[200px] truncate text-xs text-faint">{r.name}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[13px]">
                      <span className="block">{money(r.ref)}</span>
                      <span className="block font-sans text-xs text-faint"><Ago at={r.refAt} /></span>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono text-[13px] ${Math.abs(r.driftPct) >= 0.0075 ? "text-ink" : "text-soft"}`}>{signed(r.driftPct)}</td>
                    <td className="px-4 py-3.5"><CostBar x={r.buyCostPct} max={maxCost} /></td>
                    <td className="py-3.5 pl-4"><CostBar x={r.sellCostPct} max={maxCost} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BoardFilter>
      )}

      {thin.length > 0 && (
        <p className="reveal mt-5 text-sm text-faint">
          <span className="text-soft">Too thin to trade $10k right now</span> (it would lose 20% or more):{" "}
          {thin.map((r, i) => (
            <span key={r.symbol}>
              <Link href={`/check/${r.symbol}?side=sell&usd=1000${q}`} className="underline decoration-line underline-offset-4 hover:text-soft">{r.symbol}</Link>
              {i < thin.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function CostBar({ x, max }: { x: number; max: number }) {
  if (x <= 0) return <span className="font-mono text-[13px] text-faint">—</span>;
  const color = x >= 0.0075 ? "bg-bad" : x >= 0.003 ? "bg-warn" : "bg-good";
  return (
    <span className="flex items-center gap-3">
      <span className="h-[3px] w-20 overflow-hidden bg-line" aria-hidden>
        <span className={`grow block h-full ${color}`} style={{ width: `${Math.min(100, (x / max) * 100)}%` }} />
      </span>
      <span className={`font-mono text-[13px] ${tone(x)}`}>{pct(x)}</span>
    </span>
  );
}
