// One snapshot of every stock token on Robinhood Chain and Base: Chainlink's last real price and 24/7 price, and what
// $1k/$10k/$50k buys and sells fill at ($10k through the best route; $1k and $50k through the deepest Uniswap v3 pool on
// Robinhood Chain, not sampled on Base).
// Used by the local logger (scripts/logger.mts) and by /api/sample, which Supabase's scheduler calls every 10 minutes.
import { chainlink, fills, liquidityOf, officialAssets, poolsFor, symbolsFor } from "./market";
import { CHAINS, type ChainKey } from "./chains";
import { sessionAt } from "./session";

export const SIZES = [1_000, 10_000, 50_000] as const;

export type SampleRow = {
  at: string;
  chain: ChainKey;
  symbol: string;
  session: string;
  ref: number;
  ref_at: string;
  h24: number | null;
  liq: number;
  buy1k: number | null;
  sell1k: number | null;
  buy10k: number | null;
  sell10k: number | null;
  buy50k: number | null;
  sell50k: number | null;
};

async function mapLimit<T, R>(items: readonly T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

async function sampleOne(chain: ChainKey, symbol: string, at: string, session: string): Promise<SampleRow | null> {
  const asset = (await officialAssets(chain)).get(symbol);
  if (!asset) return null;
  const [cl, pools, liq] = await Promise.all([
    chainlink(symbol, chain),
    poolsFor(asset.address, chain).catch(() => []),
    chain === "base" ? liquidityOf(asset.address, chain) : Promise.resolve(0),
  ]);
  if (!cl.close) return null;
  const ref = cl.close.price;
  // The best available fill (best route across all venues, or the Uniswap pool if that's better).
  // $10k (the size the app shows) goes through the best route; $1k and $50k use the Uniswap pool, to stay within the
  // aggregator's free rate limit.
  const all = await Promise.all(SIZES.flatMap((usd) => [fills(asset, "buy", usd, ref, pools, usd === 10_000), fills(asset, "sell", usd, ref, pools, usd === 10_000)]));
  if (all.every((f) => !f)) return null;
  const [buy1k, sell1k, buy10k, sell10k, buy50k, sell50k] = all.map((f) => f?.best.price ?? null);
  return {
    at,
    chain,
    symbol,
    session,
    ref,
    ref_at: new Date(cl.close.updatedAt).toISOString(),
    h24: cl.h24?.price ?? null,
    liq: Math.round(chain === "base" ? liq : pools.reduce((t, p) => t + p.liquidityUsd, 0)),
    buy1k, sell1k, buy10k, sell10k, buy50k, sell50k,
  };
}

/** Samples every token on both chains (5 at a time). Tokens with no price, or that fail, are left out. */
export async function sampleAll(now = new Date()): Promise<SampleRow[]> {
  const at = now.toISOString();
  const session = sessionAt(now);
  const jobs = CHAINS.flatMap((c) => symbolsFor(c).map((s) => [c, s] as const));
  const rows = await mapLimit(jobs, 5, ([c, s]) => sampleOne(c, s, at, session).catch(() => null));
  return rows.filter((r): r is SampleRow => !!r);
}
