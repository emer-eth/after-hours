import type { Metadata } from "next";
import Link from "next/link";
import { Chapter } from "@/components/explainers";

export const metadata: Metadata = {
  title: "Sources & methodology",
  description: "Where After Hours' numbers come from, how the cost of a trade is worked out, and what it can't tell you.",
};

const SOURCES = [
  {
    id: "after-hours-volume",
    stat: "59% of stock-token trading after hours",
    detail: "59% of stock-token DEX volume on Robinhood Chain happened outside regular US market hours, and $532M traded on weekends, between Sep 24 and Oct 23, 2026.",
    outlet: "Crypto Briefing",
    url: "https://cryptobriefing.com/robinhood-chain-stock-tokens-after-hours-trading/",
  },
  {
    id: "thinner-at-night",
    stat: "Up to 33% less liquidity after the close",
    detail: "Order-book depth within 1% of the price fell about 19% on Bybit and MEXC and about 33% on Hyperliquid once US markets closed; cross-venue arbitrage didn't pay after costs.",
    outlet: "TechFlow",
    url: "https://www.techflowpost.com/en-US/article/35095",
  },
  {
    id: "weekend-signal",
    stat: "Weekend prices called Monday right ~54% of the time",
    detail: "A Bitquery study of 17 weekends found Sunday token moves called the direction of Monday's open in 54% of cases (balanced accuracy 53%).",
    outlet: "Bitquery, reported by CryptoSlate",
    url: "https://cryptonews.net/news/finance/33705325/",
  },
  {
    id: "base-stocks",
    stat: "Coinbase tokenized stocks on Base",
    detail: "Coinbase launched B20 tokenized US stocks on Base on 24 August 2026, priced by Chainlink, traded mostly on Aerodrome.",
    outlet: "CoinDesk",
    url: "https://www.coindesk.com/business/2026/08/24/coinbase-debuts-tokenized-stocks-on-base-network-joining-race-to-bring-equities-on-blockchain",
  },
];

const DATA = [
  ["Last real price", "Chainlink price feeds for each stock token, read onchain (Robinhood Chain and Base). They update 24/5 with the market and hold the last price when it's closed."],
  ["Official tokens", "Robinhood's public asset API (Robinhood Chain) and Coinbase's public tokenized-stocks API (Base; every official token's address starts 0xb200)."],
  ["Your fill", "KyberSwap's public aggregator: the best route across every venue on the chain, for your exact size. On Robinhood Chain we also quote the deepest Uniswap v3 pool with its QuoterV2 contract and show both."],
  ["The log", "Every 10 minutes a Supabase scheduled job asks this app for a snapshot of every asset on both chains and stores it. The board, history chart and dot field read from it."],
];

export default function Sources() {
  return (
    <div className="pt-16">
      <Link href="/" className="font-mono text-[11.5px] tracking-[.14em] text-faint uppercase hover:text-soft">← After Hours</Link>
      <h1 className="display mt-8 text-5xl sm:text-7xl">Sources & methodology.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-soft">Where every number on the site comes from, how the cost of a trade is worked out, and what it can&apos;t tell you.</p>

      <section className="mt-20" aria-labelledby="src">
        <Chapter n="01">Research we cite</Chapter>
        <h2 id="src" className="sr-only">Research we cite</h2>
        <ol className="mt-8 border-t border-line">
          {SOURCES.map((s, i) => (
            <li key={s.id} id={s.id} className="grid scroll-mt-28 gap-3 border-b border-line py-7 sm:grid-cols-[48px_1fr_auto] sm:gap-8">
              <span className="font-mono text-[11px] tracking-[.14em] text-faint">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-medium text-ink">{s.stat}</p>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-soft">{s.detail}</p>
              </div>
              <a href={s.url} target="_blank" rel="noreferrer" className="self-start font-mono text-[11.5px] tracking-[.12em] whitespace-nowrap text-soft uppercase underline decoration-line underline-offset-4 hover:text-lamp">
                {s.outlet} ↗
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20" aria-labelledby="data">
        <Chapter n="02">Live data</Chapter>
        <h2 id="data" className="sr-only">Live data</h2>
        <dl className="mt-8 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
          {DATA.map(([k, v]) => (
            <div key={k} className="bg-night p-6">
              <dt className="label"><b>{k}</b></dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-soft">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2" aria-labelledby="method">
        <div>
          <Chapter n="03">How the cost is worked out</Chapter>
          <h2 id="method" className="sr-only">How the cost is worked out</h2>
          <ul className="mt-8 grid gap-4 text-[15px] leading-relaxed text-soft">
            <li><b className="font-medium text-ink">Selling:</b> cost = (last real price − your fill price) ÷ last real price. It&apos;s the share of your money you&apos;d get back less.</li>
            <li><b className="font-medium text-ink">Buying:</b> cost = 1 − last real price ÷ your fill price. It&apos;s how many fewer shares you&apos;d get.</li>
            <li><b className="font-medium text-ink">Drift</b> is the same measure for a $1,000 trade; <b className="font-medium text-ink">your size</b> is the extra on top for your amount.</li>
            <li><b className="font-medium text-ink">The call:</b> under 0.3% is fair; 0.3%+ suggests a limit; 0.75%+ while Wall Street is closed suggests waiting; when your size causes most of the cost, split it; 20%+ means the market can&apos;t take the trade.</li>
            <li><b className="font-medium text-ink">Protected swap:</b> your worst fill is set at 0.3%, 1% or 2% from the last real price, and KyberSwap&apos;s router enforces it onchain. If the route can&apos;t meet it, nothing is built or sent.</li>
          </ul>
        </div>
        <div>
          <Chapter n="04">Limits</Chapter>
          <ul className="mt-8 grid gap-4 text-[15px] leading-relaxed text-soft">
            <li>The last real price can be a day or more old on a weekend. Overnight news can move the stock before the open: a gap can be right.</li>
            <li>Quotes are a moment in time; pools move. The protected swap exists for that reason.</li>
            <li>Only assets with a Chainlink feed are covered (35 on Robinhood Chain, 13 on Base). Exchange holidays aren&apos;t modelled.</li>
            <li>The weekend dollar estimate multiplies reported weekend volume by our logged average $10k cost. Real trade sizes vary, so treat it as an order of magnitude.</li>
            <li>Not financial advice. Stock tokens aren&apos;t offered to US persons.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
