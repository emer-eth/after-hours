import "server-only";
import { cacheLife } from "next/cache";
import { chainlink, fills, liquidityOf, officialAssets, poolsFor, symbolsFor } from "./market";
import type { ChainKey } from "./chains";
import { latestSnapshot } from "./history";

export type BoardRow = {
  symbol: string;
  name: string;
  logo: string;
  ref: number;
  refAt: number;
  buy: number; // fill price for a $10k buy
  sell: number; // fill price for a $10k sell
  driftPct: number; // pool mid vs last real price
  buyCostPct: number;
  sellCostPct: number;
  liquidityUsd: number;
};

async function mapLimit<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
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

/** Every stock token on a chain: where it trades now against its last real price, and what $10k costs each way.
 *  Robinhood Chain: read from the cloud logger's latest snapshot (best route), quoted live if there isn't a recent one.
 *  Base: quoted live through the best route. */
export async function board(chain: ChainKey = "robinhood"): Promise<BoardRow[]> {
  const assets = await officialAssets(chain);
  {
    // Both chains are logged every 10 minutes; read the latest snapshot and only quote live if there isn't one.
    const snap = await latestSnapshot(chain);
    if (snap.length >= (chain === "base" ? 5 : 10)) {
      return snap
        .filter((r) => r.buy10k && r.sell10k && assets.has(r.symbol))
        .map((r) => {
          const a = assets.get(r.symbol)!, b = r.buy10k!, s = r.sell10k!;
          return { symbol: r.symbol, name: a.name, logo: a.logo, ref: r.ref, refAt: Date.parse(r.ref_at), buy: b, sell: s, driftPct: ((b + s) / 2 - r.ref) / r.ref, buyCostPct: 1 - r.ref / b, sellCostPct: (r.ref - s) / r.ref, liquidityUsd: r.liq };
        })
        .sort((a, b) => b.liquidityUsd - a.liquidityUsd);
    }
  }
  const live = chain === "base"; // Base has no logger yet, so use the best route live; Robinhood's fallback stays Uniswap-only
  const rows = await mapLimit(symbolsFor(chain), live ? 3 : 6, async (symbol) => {
    try {
      const a = assets.get(symbol);
      if (!a) return null;
      const [cl, pools, liq] = await Promise.all([chainlink(symbol, chain), poolsFor(a.address, chain).catch(() => []), live ? liquidityOf(a.address, chain) : Promise.resolve(0)]);
      if (!cl.close) return null;
      const ref = cl.close.price;
      const [fb, fs] = await Promise.all([fills(a, "buy", 10_000, ref, pools, live), fills(a, "sell", 10_000, ref, pools, live)]);
      if (!fb || !fs) return null;
      const b = fb.best, s = fs.best;
      return {
        symbol,
        name: a.name,
        logo: a.logo,
        ref,
        refAt: cl.close.updatedAt,
        buy: b.price,
        sell: s.price,
        driftPct: ((b.price + s.price) / 2 - ref) / ref,
        buyCostPct: 1 - ref / b.price,
        sellCostPct: (ref - s.price) / ref,
        liquidityUsd: live ? liq : pools.reduce((t, p) => t + p.liquidityUsd, 0),
      } satisfies BoardRow;
    } catch {
      return null;
    }
  });
  return rows.filter((r): r is BoardRow => !!r).sort((a, b) => b.liquidityUsd - a.liquidityUsd);
}

/** A chain's board, cached for 5 minutes so every visitor doesn't re-quote every asset. */
export async function cachedBoard(chain: ChainKey = "robinhood") {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const rows = await board(chain);
  if (!rows.length) throw new Error("empty board"); // never cache a failure; callers fall back
  return rows;
}
