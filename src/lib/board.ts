import "server-only";
import { cacheLife } from "next/cache";
import { chainlink, fills, officialAssets, poolsFor, SYMBOLS } from "./market";

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

/** Every stock token with a deep enough pool: where it trades now against its last real price, and what $10k costs each way. */
export async function board(): Promise<BoardRow[]> {
  const assets = await officialAssets();
  const rows = await mapLimit(SYMBOLS, 6, async (symbol) => {
    try {
      const a = assets.get(symbol);
      if (!a) return null;
      const [cl, pools] = await Promise.all([chainlink(symbol), poolsFor(a.address).catch(() => [])]);
      if (!cl.close) return null;
      const ref = cl.close.price;
      const [fb, fs] = await Promise.all([fills(a.address, "buy", 10_000, ref, pools), fills(a.address, "sell", 10_000, ref, pools)]);
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
        buyCostPct: (b.price - ref) / ref,
        sellCostPct: (ref - s.price) / ref,
        liquidityUsd: pools.reduce((t, p) => t + p.liquidityUsd, 0),
      } satisfies BoardRow;
    } catch {
      return null;
    }
  });
  return rows.filter((r): r is BoardRow => !!r).sort((a, b) => b.liquidityUsd - a.liquidityUsd);
}

/** The board, cached for 5 minutes so every visitor doesn't re-quote 27 pools. */
export async function cachedBoard() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  return board();
}
