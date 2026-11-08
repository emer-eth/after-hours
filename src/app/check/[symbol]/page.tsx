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
    <div className="pt-6" aria-busy="true">
      <div className="h-5 w-32 rounded bg-panel" />
      <div className="mt-6 h-12 w-2/3 rounded-lg bg-panel" />
      <div className="mt-8 h-48 animate-pulse rounded-2xl bg-panel" />
      <p className="mt-4 text-sm text-soft">Quoting the pools on Robinhood Chain…</p>
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
      <Link href="/" className="text-sm text-faint hover:text-soft">← Tonight&apos;s board</Link>

      <h1 className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
        {side === "buy" ? "Buying" : "Selling"} {usdFmt(usd)} of <span className="text-lamp">{symbol}</span>
      </h1>

      {error && (
        <div className="panel mt-8 border-bad/40 p-6" role="alert">
          <p className="font-medium">{error.message}</p>
          <p className="mt-1 text-soft">{error.fix}</p>
        </div>
      )}

      {r && <Result r={r} />}

      <h2 className="mt-14 mb-4 font-serif text-2xl">Check another trade</h2>
      <CheckForm symbols={symbols} initial={{ symbol, side, usd }} />
    </div>
  );
}

function Result({ r }: { r: CheckResult }) {
  const v = r.verdict;
  const s = STYLE[v.call];
  const closed = r.session !== "regular";
  const verb = r.side === "buy" ? "pay" : "receive";
  return (
    <>
      <section className={`mt-8 rounded-2xl border p-6 sm:p-8 ${s.ring}`} aria-live="polite">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${s.chip}`}>{s.label}</span>
        <p className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">{v.title}</p>
        <p className="mt-3 max-w-2xl text-lg text-soft">{v.body}</p>
        {closed && (
          <p className="mt-5 text-sm text-soft">
            {r.session === "weekend" ? "Wall Street opens" : "The regular session opens"} in <Countdown to={r.nextOpen} />. Pre-market starts 5½ hours earlier.
          </p>
        )}
        <ShareButtons symbol={r.asset.symbol} side={r.side} usd={r.usd} title={v.title} costPct={v.costPct} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="The numbers">
        <Stat label="Last real price" value={money(r.last.price)} note={<>Chainlink · <Ago at={r.last.updatedAt} /></>} />
        <Stat label={`You'd ${verb} per share`} value={money(r.best.price)} note={`${r.best.tokens.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${r.asset.symbol} for ${usdFmt(r.best.usd)} · best route`} />
        <Stat
          label={v.costPct >= 0 ? "What this costs you" : "What you gain"}
          value={`${usdFmt(Math.abs(v.costUsd))}`}
          note={`${pct(Math.abs(v.costPct))} vs the last real price`}
          tone={v.costPct >= 0.0075 ? "text-bad" : v.costPct >= 0.003 ? "text-warn" : v.costPct < 0 ? "text-cool" : "text-good"}
        />
      </section>

      <section className="panel mt-6 divide-y divide-line text-sm" aria-label="Where the cost comes from">
        <Row k="The onchain price vs the last real price" v={`${v.driftPct >= 0 ? "" : "−"}${pct(Math.abs(v.driftPct))} ${v.driftPct >= 0 ? "against you" : "in your favour"}`} />
        <Row k="Your trade size moving the price" v={pct(v.impactPct)} />
        <Row k={r.side === "buy" ? "Protective limit: don't pay more than" : "Protective limit: don't sell for less than"} v={money(v.limit)} />
        {r.h24 && <Row k="Chainlink's 24/7 estimate" v={<>{money(r.h24.price)} <span className="text-faint">· <Ago at={r.h24.updatedAt} /></span></>} />}
        {r.robinhood && r.robinhood.bid > 0 && r.robinhood.ask / r.robinhood.bid < 1.2 && <Row k="Robinhood's own quote (bid / ask)" v={`${money(r.robinhood.bid)} / ${money(r.robinhood.ask)}`} />}
        <Row k="Session" v={SESSION_LABEL[r.session]} />
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

function Stat({ label, value, note, tone = "text-ink" }: { label: string; value: string; note: React.ReactNode; tone?: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-soft">{label}</p>
      <p className={`mt-1 text-3xl font-medium tracking-tight tnum ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-faint tnum">{note}</p>
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
