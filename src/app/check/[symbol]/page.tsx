import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { after, connection } from "next/server";
import { track } from "@/lib/track";
import { checkTrade, CheckError, type CheckResult } from "@/lib/check";
import { officialAssets, SYMBOLS } from "@/lib/market";
import { SESSION_LABEL } from "@/lib/session";
import { pct, usdFmt, type Call } from "@/lib/verdict";
import { CheckForm } from "@/components/check-form";
import { Ago } from "@/components/ago";
import { Countdown } from "@/components/countdown";
import { History } from "@/components/history";
import { ProtectedSwap } from "@/components/protected-swap";
import { ShareButtons } from "@/components/share-buttons";
import { CostMeter, PriceLadder } from "@/components/check-visuals";
import { CheckLoading } from "@/components/check-loading";
import { CountUp } from "@/components/ui/count-up";
import { Term } from "@/components/ui/term";

type Props = { params: Promise<{ symbol: string }>; searchParams: Promise<{ side?: string; usd?: string }> };

function parse(sp: { side?: string; usd?: string }) {
  const side = sp.side === "buy" ? "buy" : "sell";
  const usd = Math.min(5_000_000, Math.max(10, Math.round(Number(sp.usd) || 10_000)));
  return { side, usd } as const;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const symbol = (await params).symbol.toUpperCase();
  const { side, usd } = parse(await searchParams);
  const title = `${side === "buy" ? "Buying" : "Selling"} ${usdFmt(usd)} of ${symbol}`;
  const image = `/api/og?symbol=${encodeURIComponent(symbol)}&side=${side}&usd=${usd}`;
  const description = "What this stock-token trade really costs on Robinhood Chain, against the last real price.";
  return { title, description, openGraph: { title, description, images: [image] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}

const STYLE: Record<Call, { ring: string; chip: string; label: string }> = {
  fair: { ring: "border-good/40 bg-good-soft", chip: "bg-good text-night", label: "Trade now" },
  bonus: { ring: "border-cool/40 bg-cool-soft", chip: "bg-cool text-night", label: "Better than last price" },
  limit: { ring: "border-warn/40 bg-warn-soft", chip: "bg-warn text-night", label: "Set a limit" },
  split: { ring: "border-warn/40 bg-warn-soft", chip: "bg-warn text-night", label: "Split it" },
  wait: { ring: "border-bad/40 bg-bad-soft", chip: "bg-bad text-night", label: "Wait for the open" },
  thin: { ring: "border-bad/40 bg-bad-soft", chip: "bg-bad text-night", label: "Pool too thin" },
};

const money = (x: number) => `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function CheckPage(props: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <CheckBody {...props} />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="pt-6">
      <div className="h-5 w-32 rounded bg-panel" />
      <div className="mt-5 h-12 w-2/3 max-w-xl rounded-lg bg-panel" />
      <CheckLoading />
    </div>
  );
}

async function CheckBody({ params, searchParams }: Props) {
  await connection(); // always live: a check is about this minute
  const symbol = (await params).symbol.toUpperCase();
  const { side, usd } = parse(await searchParams);
  const assets = await officialAssets().catch(() => new Map());
  const symbols = SYMBOLS.filter((s) => assets.has(s)).map((s) => ({ symbol: s, name: assets.get(s)!.name }));

  let r: CheckResult | null = null;
  let error: { message: string; fix: string } | null = null;
  try {
    r = await checkTrade(symbol, side, usd);
    const call = r.verdict.call;
    after(() => track("check", { symbol, side, usd, verdict: call }));
  } catch (e) {
    error = e instanceof CheckError ? { message: e.message, fix: e.fix } : { message: "Robinhood Chain didn't answer in time.", fix: "Refresh the page in a moment." };
  }

  return (
    <div className="pt-6">
      <Link href="/#board" className="inline-flex items-center gap-1 text-sm text-faint transition-colors hover:text-soft">← Tonight&apos;s board</Link>

      <div className="mt-5 flex items-center gap-4">
        {r && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.asset.logo} alt="" className="pop size-12 rounded-full bg-panel-2 sm:size-14" />
        )}
        <div>
          <p className="text-sm text-faint">{r ? r.asset.name : "Stock token"} · checked just now</p>
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            {side === "buy" ? "Buying" : "Selling"} {usdFmt(usd)} of <span className="text-lamp">{symbol}</span>
          </h1>
        </div>
      </div>

      {error && (
        <div className="panel mt-8 border-bad/40 p-6" role="alert">
          <p className="font-medium">{error.message}</p>
          <p className="mt-1 text-soft">{error.fix}</p>
        </div>
      )}

      {r && <Result r={r} />}

      <h2 className="mt-20 mb-2 font-serif text-3xl">Check another trade</h2>
      <p className="mb-5 text-sm text-soft">Try a different size or side. Smaller trades often cost far less at night.</p>
      <CheckForm symbols={symbols} initial={{ symbol, side, usd }} />
    </div>
  );
}

function Result({ r }: { r: CheckResult }) {
  const v = r.verdict;
  const s = STYLE[v.call];
  const closed = r.session !== "regular";
  const verb = r.side === "buy" ? "pay" : "receive";
  const costTone = v.costPct >= 0.0075 ? "text-bad" : v.costPct >= 0.003 ? "text-warn" : v.costPct < 0 ? "text-cool" : "text-good";
  return (
    <>
      <section className={`rise mt-8 grid gap-8 overflow-hidden rounded-3xl border p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:gap-10 ${s.ring}`} aria-live="polite">
        <div>
          <span className={`pop inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${s.chip}`} style={{ ["--d" as string]: ".15s" }}>{s.label}</span>
          <p className="mt-4 font-serif text-4xl leading-[1.05] sm:text-5xl">{v.title}</p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-soft">{v.body}</p>
          {closed && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-night/40 px-3 py-1.5 text-sm text-soft">
              <span className="live-dot size-1.5 rounded-full bg-lamp" aria-hidden />
              {r.session === "weekend" ? "Wall Street opens" : "The regular session opens"} in <Countdown to={r.nextOpen} />
            </p>
          )}
          <ShareButtons symbol={r.asset.symbol} side={r.side} usd={r.usd} title={v.title} costPct={v.costPct} />
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-night/40 p-5">
          <div>
            <p className="text-sm text-soft">{v.costPct >= 0 ? "What this trade costs you" : "What this trade gains you"}</p>
            <p className={`mt-1 font-serif text-6xl leading-none tracking-tight tnum sm:text-7xl ${costTone}`}>
              <CountUp value={Math.abs(v.costUsd)} prefix="$" decimals={Math.abs(v.costUsd) < 100 ? 2 : 0} />
            </p>
            <p className="mt-2 text-sm text-soft tnum">
              {pct(Math.abs(v.costPct))} {v.costPct >= 0 ? "worse" : "better"} than at the last real price
            </p>
          </div>
          <div className="mt-6">
            <CostMeter cost={v.costPct} />
          </div>
        </div>
      </section>

      <section className="panel rise mt-6 p-5 sm:p-6" style={{ ["--d" as string]: ".1s" }} aria-labelledby="ladder">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ladder" className="font-medium">Where your price sits</h2>
          <p className="text-xs text-faint">
            Last real price from Chainlink · <Ago at={r.last.updatedAt} />
          </p>
        </div>
        <div className="mt-6 px-2">
          <PriceLadder side={r.side} last={r.last.price} onchain={r.small} yours={r.best.price} limit={v.limit} />
        </div>
        <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-line bg-line text-sm sm:grid-cols-3">
          <Fact k={<Term tip="How far the onchain market sits from the stock's last real price before your trade, measured with a small $1k trade.">Drift</Term>} v={`${pct(Math.abs(v.driftPct))} ${v.driftPct >= 0 ? "against you" : "in your favour"}`} />
          <Fact k={<Term tip="How much your own order moves the price as it fills. Bigger orders in thinner markets move it more.">Your size</Term>} v={`${pct(v.impactPct)} extra`} />
          <Fact k={<Term tip="A price we'd never fill you worse than: 0.3% from the last real price. The protected swap below enforces it.">Protective limit</Term>} v={money(v.limit)} />
        </div>
        <details className="group mt-4 text-sm">
          <summary className="flex items-center gap-2 text-faint transition-colors hover:text-soft">
            <span className="chev inline-block">+</span> More detail
          </summary>
          <div className="mt-3 divide-y divide-line rounded-xl border border-line">
            <Row k={`You'd ${verb}`} v={`${money(r.best.price)} per share · ${r.best.tokens.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${r.asset.symbol} for ${usdFmt(r.best.usd)}`} />
            {r.h24 && <Row k="Chainlink's 24/7 estimate" v={<>{money(r.h24.price)} <span className="text-faint">· <Ago at={r.h24.updatedAt} /></span></>} />}
            {r.robinhood && r.robinhood.bid > 0 && r.robinhood.ask / r.robinhood.bid < 1.2 && <Row k="Robinhood's own quote (bid / ask)" v={`${money(r.robinhood.bid)} / ${money(r.robinhood.ask)}`} />}
            <Row k="Session" v={SESSION_LABEL[r.session]} />
          </div>
        </details>
      </section>

      <Routes r={r} />

      {v.call !== "thin" && <ProtectedSwap symbol={r.asset.symbol} token={r.asset.address} side={r.side} usd={r.usd} lastPrice={r.last.price} />}

      <section className="panel mt-6 p-5 text-sm" aria-label="Is this the real token?">
        <p className="flex items-center gap-2 font-medium">
          <span className="grid size-5 place-items-center rounded-full bg-good text-night" aria-hidden>✓</span>
          Official Robinhood token: {r.asset.name}
        </p>
        <p className="mt-2 text-soft">
          Contract{" "}
          <a className="font-mono text-ink underline decoration-line underline-offset-4 hover:decoration-lamp" href={`https://robinhoodchain.blockscout.com/token/${r.asset.address}`} target="_blank" rel="noreferrer">
            {short(r.asset.address)}
          </a>
          , from Robinhood&apos;s own asset list. Anyone can launch a token called {r.asset.symbol}; only this address is the real one.
        </p>
      </section>

      <History symbol={r.asset.symbol} side={r.side} />
    </>
  );
}

function Routes({ r }: { r: CheckResult }) {
  const buy = r.side === "buy";
  // When the best route is just the Uniswap pool, say so once instead of showing the same price twice.
  const same = !!(r.route && r.uniswap && Math.abs(r.route.price - r.uniswap.price) / r.uniswap.price < 0.0001);
  if (same && r.route)
    return (
      <section className="panel mt-6 p-5 text-sm" aria-labelledby="routes">
        <h2 id="routes" className="font-medium">Where it fills best</h2>
        <p className="mt-2 text-soft">
          We checked every venue on Robinhood Chain. The deepest Uniswap v3 pool is already the best route here, at <span className="text-ink tnum">{money(r.route.price)}</span> per share.
        </p>
      </section>
    );
  const rows = [
    r.route && { name: "Best route", detail: `KyberSwap across ${r.route.venues.length} venue${r.route.venues.length === 1 ? "" : "s"}: ${r.route.venues.slice(0, 5).join(", ")}${r.route.venues.length > 5 ? "…" : ""}`, price: r.route.price, usd: r.route.usd, tokens: r.route.tokens },
    r.uniswap && { name: "One Uniswap v3 pool", detail: `${short(r.uniswap.pool)} · ${r.uniswap.fee / 10_000}% fee`, price: r.uniswap.price, usd: r.uniswap.usd, tokens: r.uniswap.tokens, href: `https://robinhoodchain.blockscout.com/address/${r.uniswap.pool}` },
  ].filter((x): x is NonNullable<typeof x> => !!x);
  if (!rows.length) return null;
  // What the better venue saves against the other, in dollars of this trade.
  const saving = r.route && r.uniswap ? (buy ? r.usd * (1 / r.route.price - 1 / r.uniswap.price) * r.last.price : (r.route.price - r.uniswap.price) * r.route.tokens) : null;
  return (
    <section className="panel mt-6 p-5 text-sm" aria-labelledby="routes">
      <h2 id="routes" className="font-medium">Where it fills best</h2>
      <div className="mt-3 divide-y divide-line">
        {rows.map((x) => (
          <div key={x.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <span>
              <span className="text-ink">{x.name}</span>
              {x.price === r.best.price && <span className="ml-2 rounded-full bg-good-soft px-2 py-0.5 text-xs text-good">used</span>}
              <span className="block text-xs text-faint">{"href" in x && x.href ? <a className="font-mono underline underline-offset-4 hover:text-soft" href={x.href} target="_blank" rel="noreferrer">{x.detail}</a> : x.detail}</span>
            </span>
            <span className="tnum">{money(x.price)} <span className="text-faint">per share</span></span>
          </div>
        ))}
      </div>
      {saving !== null && Math.abs(saving) >= 1 && (
        <p className="mt-2 text-soft">
          {saving > 0 ? `The best route ${buy ? "saves" : "gets you"} ${usdFmt(saving)} ${buy ? "" : "more "}versus the single pool.` : `The single pool is ${usdFmt(-saving)} better right now.`}
        </p>
      )}
    </section>
  );
}

function Fact({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div className="bg-panel px-4 py-3">
      <p className="text-xs text-faint">{k}</p>
      <p className="mt-1 tnum">{v}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3">
      <span className="text-soft">{k}</span>
      <span className="tnum">{v}</span>
    </div>
  );
}
