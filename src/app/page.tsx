import Link from "next/link";
import { Suspense } from "react";
import { cachedBoard } from "@/lib/board";
import { pct } from "@/lib/verdict";
import { CheckForm } from "@/components/check-form";
import { Ago } from "@/components/ago";
import { NightPanel } from "@/components/night-panel";

const tone = (x: number) => (x >= 0.2 ? "text-bad font-medium" : x >= 0.0075 ? "text-bad" : x >= 0.003 ? "text-warn" : "text-soft");
const signed = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${pct(Math.abs(x))}`;
const cost = (x: number) => (x <= 0 ? "none" : x >= 0.2 ? `${pct(x)} · too thin` : pct(x));
const money = (x: number) => `$${x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Home() {
  return (
    <>
      <section className="pt-8 pb-10 sm:pt-14">
        <h1 className="max-w-3xl font-serif text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl">
          Wall Street is asleep. <em className="text-lamp">Its stocks aren&apos;t.</em>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-soft">
          Most stock-token trading on Robinhood Chain happens after the bell, when the pools are thin and there&apos;s no live market to check against. Before you trade, see what it will really cost, compared with the last real price.
        </p>
      </section>
      <Suspense fallback={<BoardLoading />}>
        <Live />
      </Suspense>
      <Suspense fallback={null}>
        <NightPanel />
      </Suspense>
      <Facts />
    </>
  );
}

function BoardLoading() {
  return (
    <div aria-busy="true">
      <div className="panel h-[106px] animate-pulse" />
      <p className="mt-4 text-sm text-soft">Quoting 27 stock tokens on Robinhood Chain…</p>
      <div className="panel mt-14 h-96 animate-pulse" />
    </div>
  );
}

async function Live() {
  const rows = await cachedBoard().catch(() => []);
  const worst = [...rows].sort((a, b) => Math.max(b.buyCostPct, b.sellCostPct) - Math.max(a.buyCostPct, a.sellCostPct))[0];

  return (
    <>
      <CheckForm symbols={rows.map((r) => ({ symbol: r.symbol, name: r.name }))} />

      {worst && (
        <p className="mt-4 text-sm text-soft">
          Right now the worst spot is <Link className="text-ink underline decoration-line underline-offset-4 hover:decoration-lamp" href={`/check/${worst.symbol}?side=${worst.sellCostPct > worst.buyCostPct ? "sell" : "buy"}&usd=10000`}>{worst.symbol}</Link>:{" "}
          {Math.max(worst.sellCostPct, worst.buyCostPct) >= 0.2
            ? `its pools hold only about $${Math.round(worst.liquidityUsd / 1000)}k, so ${worst.sellCostPct > worst.buyCostPct ? `selling $10k would lose ${pct(worst.sellCostPct)}` : `buying $10k would cost ${pct(worst.buyCostPct)} extra`}.`
            : worst.sellCostPct > worst.buyCostPct
              ? `selling $10k gets you ${pct(worst.sellCostPct)} less than its last real price.`
              : `buying $10k costs ${pct(worst.buyCostPct)} more than its last real price.`}
        </p>
      )}

      <section className="mt-14" aria-labelledby="board">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="board" className="font-serif text-3xl">Tonight&apos;s board</h2>
          <p className="text-sm text-faint">Live from Robinhood Chain · refreshes every 5 minutes</p>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-soft">
          <b className="font-medium text-ink">Last real price</b> is Chainlink&apos;s feed of the actual stock. <b className="font-medium text-ink">Pool drift</b> is where the token trades onchain against it. The cost columns are what a $10k trade loses to drift and slippage together.
        </p>

        {rows.length === 0 ? (
          <p className="panel mt-6 p-6 text-soft">Robinhood Chain didn&apos;t answer just now. Refresh in a minute.</p>
        ) : (
          <div className="panel mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-faint">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-normal">Stock</th>
                  <th className="px-4 py-3 text-right font-normal">Last real price</th>
                  <th className="px-4 py-3 text-right font-normal">Pool drift</th>
                  <th className="px-4 py-3 text-right font-normal">Buying $10k costs</th>
                  <th className="px-4 py-3 text-right font-normal">Selling $10k costs</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {rows.map((r) => (
                  <tr key={r.symbol} className="border-b border-line/60 last:border-0 hover:bg-panel-2">
                    <td className="px-4 py-3">
                      <Link href={`/check/${r.symbol}?side=${r.sellCostPct > r.buyCostPct ? "sell" : "buy"}&usd=10000`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.logo} alt="" className="size-7 rounded-full bg-panel-2" loading="lazy" />
                        <span>
                          <span className="block font-medium text-ink">{r.symbol}</span>
                          <span className="block text-xs text-faint">{r.name}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="block">{money(r.ref)}</span>
                      <span className="block text-xs text-faint"><Ago at={r.refAt} /></span>
                    </td>
                    <td className={`px-4 py-3 text-right ${Math.abs(r.driftPct) >= 0.0075 ? "text-ink" : "text-soft"}`}>{signed(r.driftPct)}</td>
                    <td className={`px-4 py-3 text-right ${tone(r.buyCostPct)}`}>{cost(r.buyCostPct)}</td>
                    <td className={`px-4 py-3 text-right ${tone(r.sellCostPct)}`}>{cost(r.sellCostPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </>
  );
}

function Facts() {
  return (
    <section className="mt-16 grid gap-4 sm:grid-cols-3" aria-label="Why this exists">
        {[
          ["59%", "of stock-token trading on Robinhood Chain happened outside US market hours, Sep 24 – Oct 23.", "https://cryptobriefing.com/robinhood-chain-stock-tokens-after-hours-trading/", "Crypto Briefing"],
          ["19–33%", "less liquidity near the price once US markets close, so the same order moves the price more.", "https://www.techflowpost.com/en-US/article/35095", "TechFlow"],
          ["~54%", "is how often weekend token prices called Monday's open direction. A coin flip, not a signal.", "https://cryptoslate.com/weekend-stock-tokens-predict-monday-open-but-guessing-up-scores-55/", "CryptoSlate / Bitquery"],
        ].map(([n, t, href, src]) => (
          <div key={n} className="panel p-5">
            <p className="font-serif text-4xl text-lamp">{n}</p>
            <p className="mt-2 text-sm text-soft">{t}</p>
            <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-faint underline underline-offset-4 hover:text-soft">
              {src}
            </a>
          </div>
        ))}
      </section>
  );
}
