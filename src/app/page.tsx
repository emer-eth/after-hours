import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { cachedBoard, type BoardRow } from "@/lib/board";
import { sessionAt } from "@/lib/session";
import { pct, verdict, type Call } from "@/lib/verdict";
import { CheckForm } from "@/components/check-form";
import { Ago } from "@/components/ago";
import { NightPanel } from "@/components/night-panel";
import { Stats } from "@/components/stats";
import { Sky, Skyline } from "@/components/sky";
import { HeroCard, type HeroExample } from "@/components/hero-card";
import { GapDiagram } from "@/components/gap-diagram";
import { Faq, FinalCta, HowItWorks, VerdictKey } from "@/components/explainers";
import { CountUp } from "@/components/ui/count-up";
import { Term } from "@/components/ui/term";

const tone = (x: number) => (x >= 0.0075 ? "text-bad" : x >= 0.003 ? "text-warn" : "text-soft");
const signed = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${pct(Math.abs(x))}`;
const money = (x: number) => `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CALL: Record<Call, { label: string; tone: HeroExample["tone"] }> = {
  fair: { label: "Trade now", tone: "good" },
  bonus: { label: "Better than last price", tone: "cool" },
  limit: { label: "Set a limit", tone: "warn" },
  split: { label: "Split it", tone: "warn" },
  wait: { label: "Wait for the open", tone: "bad" },
  thin: { label: "Too thin", tone: "bad" },
};

export default function Home() {
  return (
    <>
      <Sky />

      {/* Hero */}
      <section className="grid items-center gap-12 pt-10 pb-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-xs text-soft backdrop-blur">
            <span className="size-1.5 rounded-full bg-lamp" aria-hidden /> For stock tokens on Robinhood Chain
          </p>
          <h1 className="rise mt-6 font-serif text-[3rem] leading-[0.98] tracking-tight sm:text-7xl" style={{ ["--d" as string]: ".08s" }}>
            Wall Street is asleep.
            <br />
            <em className="text-lamp">Its stocks aren&apos;t.</em>
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-soft" style={{ ["--d" as string]: ".16s" }}>
            Stock tokens trade all night and all weekend, in thin markets with no live price to check against. After Hours tells you what your trade will <em>really</em> cost before you make it, and whether to trade now or wait.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ ["--d" as string]: ".24s" }}>
            <Link href="#check" className="inline-flex items-center gap-2 rounded-xl bg-lamp px-5 py-3 font-medium text-night shadow-[0_10px_30px_-10px_#f5b544] transition hover:brightness-110">
              Check a trade <span aria-hidden>→</span>
            </Link>
            <Link href="#how" className="inline-flex items-center rounded-xl border border-line bg-panel/60 px-5 py-3 text-soft backdrop-blur transition-colors hover:text-ink">
              How it works
            </Link>
          </div>
          <ul className="rise mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-faint" style={{ ["--d" as string]: ".32s" }}>
            {["Real prices from Chainlink", "Every venue, best route", "Official tokens only", "Free, no account"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" className="size-3.5 text-good" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M3 8.5l3 3 7-7" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <Suspense fallback={<div className="panel shimmer h-[430px]" aria-hidden />}>
          <HeroExampleCard />
        </Suspense>
      </section>

      <Skyline />

      {/* The problem */}
      <section className="mt-10" aria-labelledby="problem">
        <p className="reveal text-sm font-medium tracking-wide text-lamp uppercase">The night problem</p>
        <h2 id="problem" className="reveal mt-2 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl" style={{ ["--d" as string]: ".05s" }}>
          When the bell rings, the price keeps moving. Nobody&apos;s checking it.
        </h2>
        <p className="reveal mt-5 max-w-2xl leading-relaxed text-soft" style={{ ["--d" as string]: ".1s" }}>
          At 4pm New York time the real market closes. The tokens don&apos;t. They keep trading in pools that are thinner than in the day, so prices <Term tip="When the onchain price wanders away from the stock's last real price, because there's no live market keeping it in line.">drift</Term>, and bigger orders pay more <Term tip="The extra you pay because your own order moves the price as it fills. Bigger orders in thinner pools move it more.">slippage</Term>. Most people trading at 2am never see what that costs them.
        </p>
        <div className="mt-10">
          <GapDiagram />
        </div>
        <Facts />
      </section>

      <HowItWorks />
      <VerdictKey />

      {/* Try it */}
      <section id="check" className="mt-28 scroll-mt-24" aria-labelledby="check-title">
        <p className="reveal text-sm font-medium tracking-wide text-lamp uppercase">Try it</p>
        <h2 id="check-title" className="reveal mt-2 font-serif text-4xl sm:text-5xl">Check a trade</h2>
        <p className="reveal mt-3 max-w-xl text-soft">Pick a stock, buy or sell, and how much. You&apos;ll get the real cost, one plain call, and a protected way to trade.</p>
        <div className="reveal mt-8">
          <Suspense fallback={<div className="panel shimmer h-[118px]" aria-hidden />}>
            <Form />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <Stats />
        </Suspense>
      </section>

      <Suspense fallback={<div className="panel shimmer mt-28 h-96" aria-hidden />}>
        <Board />
      </Suspense>

      <Suspense fallback={null}>
        <NightPanel />
      </Suspense>

      <Faq />
      <FinalCta />
    </>
  );
}

/** The most telling trade on the board right now: a real cost, but not a broken pool. */
async function pickExample(rows: BoardRow[]): Promise<HeroExample | null> {
  await connection();
  const session = sessionAt();
  const cands = rows.flatMap((r) => [
    { r, side: "sell" as const, cost: r.sellCostPct, fill: r.sell },
    { r, side: "buy" as const, cost: r.buyCostPct, fill: r.buy },
  ]);
  const good = cands.filter((c) => c.cost > 0.002 && c.cost < 0.2 && c.r.liquidityUsd > 100_000);
  const pick = (good.length ? good : cands).sort((a, b) => b.cost - a.cost)[0];
  if (!pick) return null;
  const v = verdict({ side: pick.side, usd: 10_000, session, ref: pick.r.ref, fill: pick.fill, small: null });
  return { symbol: pick.r.symbol, name: pick.r.name, logo: pick.r.logo, side: pick.side, ref: pick.r.ref, fill: pick.fill, costUsd: v.costUsd, costPct: v.costPct, label: CALL[v.call].label, tone: CALL[v.call].tone };
}

async function HeroExampleCard() {
  const rows = await cachedBoard().catch(() => []);
  const ex = await pickExample(rows);
  return ex ? <HeroCard ex={ex} /> : null;
}

async function Form() {
  const rows = await cachedBoard().catch(() => []);
  return <CheckForm symbols={rows.map((r) => ({ symbol: r.symbol, name: r.name }))} />;
}

async function Board() {
  const all = await cachedBoard().catch(() => []);
  // Tokens where a $10k trade would lose 20%+ either way aren't really tradeable; list them apart instead of as numbers.
  const isThin = (r: BoardRow) => Math.max(r.buyCostPct, r.sellCostPct) >= 0.2;
  const rows = all.filter((r) => !isThin(r));
  const thin = all.filter(isThin);
  const maxCost = Math.max(0.01, ...rows.map((r) => Math.min(0.05, Math.max(r.buyCostPct, r.sellCostPct))));
  return (
    <section id="board" className="mt-28 scroll-mt-24" aria-labelledby="board-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="reveal text-sm font-medium tracking-wide text-lamp uppercase">Live</p>
          <h2 id="board-title" className="reveal mt-2 font-serif text-4xl sm:text-5xl">Tonight&apos;s board</h2>
        </div>
        <p className="reveal flex items-center gap-2 text-sm text-faint">
          <span className="live-dot size-1.5 rounded-full bg-good" aria-hidden /> Every stock token · best route · updated every 10 minutes
        </p>
      </div>
      <p className="reveal mt-3 max-w-2xl text-sm text-soft">
        What a $10,000 trade costs right now, against each stock&apos;s <Term tip="The stock's most recent price on the real market, published onchain by Chainlink.">last real price</Term>. Tap a row for the full check.
      </p>

      {rows.length === 0 ? (
        <p className="panel mt-6 p-6 text-soft">Robinhood Chain didn&apos;t answer just now. Refresh in a minute.</p>
      ) : (
        <div className="panel reveal mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-xs tracking-wide text-faint uppercase">
              <tr className="border-b border-line">
                <th className="px-4 py-3 font-normal">Stock</th>
                <th className="px-4 py-3 text-right font-normal">Last real price</th>
                <th className="px-4 py-3 text-right font-normal">Drift</th>
                <th className="px-4 py-3 font-normal">Buying $10k costs</th>
                <th className="px-4 py-3 font-normal">Selling $10k costs</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {rows.map((r) => (
                <tr key={r.symbol} className="group border-b border-line/60 transition-colors last:border-0 hover:bg-panel-2">
                  <td className="px-4 py-3">
                    <Link href={`/check/${r.symbol}?side=${r.sellCostPct > r.buyCostPct ? "sell" : "buy"}&usd=10000`} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.logo} alt="" className="size-8 rounded-full bg-panel-2" loading="lazy" />
                      <span>
                        <span className="block font-medium text-ink group-hover:text-lamp">{r.symbol}</span>
                        <span className="block max-w-[180px] truncate text-xs text-faint">{r.name}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="block">{money(r.ref)}</span>
                    <span className="block text-xs text-faint"><Ago at={r.refAt} /></span>
                  </td>
                  <td className={`px-4 py-3 text-right ${Math.abs(r.driftPct) >= 0.0075 ? "text-ink" : "text-soft"}`}>{signed(r.driftPct)}</td>
                  <td className="px-4 py-3"><CostBar x={r.buyCostPct} max={maxCost} /></td>
                  <td className="px-4 py-3"><CostBar x={r.sellCostPct} max={maxCost} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {thin.length > 0 && (
        <p className="reveal mt-4 text-sm text-faint">
          <span className="text-soft">Too thin to trade $10k right now</span> (it would lose 20% or more):{" "}
          {thin.map((r, i) => (
            <span key={r.symbol}>
              <Link href={`/check/${r.symbol}?side=sell&usd=1000`} className="underline decoration-line underline-offset-4 hover:text-soft">{r.symbol}</Link>
              {i < thin.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

function CostBar({ x, max }: { x: number; max: number }) {
  if (x <= 0) return <span className="text-faint">none</span>;
  const color = x >= 0.0075 ? "bg-bad" : x >= 0.003 ? "bg-warn" : "bg-good";
  return (
    <span className="flex items-center gap-3">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-panel-2" aria-hidden>
        <span className={`grow block h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (x / max) * 100)}%` }} />
      </span>
      <span className={tone(x)}>{pct(x)}</span>
    </span>
  );
}

function Facts() {
  const facts = [
    { n: 59, pre: "", suf: "%", t: "of stock-token trading on Robinhood Chain happened outside US market hours, Sep 24 – Oct 23.", href: "https://cryptobriefing.com/robinhood-chain-stock-tokens-after-hours-trading/", src: "Crypto Briefing" },
    { n: 33, pre: "up to ", suf: "%", t: "less liquidity near the price once US markets close, so the same order moves the price more.", href: "https://www.techflowpost.com/en-US/article/35095", src: "TechFlow" },
    { n: 54, pre: "~", suf: "%", t: "is how often weekend token prices called Monday's opening direction. A coin flip, not a signal.", href: "https://cryptoslate.com/weekend-stock-tokens-predict-monday-open-but-guessing-up-scores-55/", src: "CryptoSlate / Bitquery" },
  ];
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {facts.map((x, i) => (
        <div key={x.src} className="panel card-hover reveal p-6" style={{ ["--d" as string]: `${i * 0.1}s` }}>
          <p className="font-serif text-5xl text-lamp tnum">
            <CountUp value={x.n} prefix={x.pre} suffix={x.suf} />
          </p>
          <p className="mt-3 text-sm leading-relaxed text-soft">{x.t}</p>
          <a href={x.href} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs text-faint underline underline-offset-4 hover:text-soft">
            Source: {x.src}
          </a>
        </div>
      ))}
    </div>
  );
}
