// Samples every stock token every 10 minutes: Chainlink's last real price and 24/7 price, Robinhood's quote,
// the deepest Uniswap v3 pools, and what $1k/$10k/$50k buys and sells would really fill at.
// Appends one JSON line per token per sample to data/log.jsonl. Run: npx tsx scripts/logger.mts
import { appendFileSync, mkdirSync } from "node:fs";
import { chainlink, officialAssets, poolsFor, quote, robinhoodQuote, SYMBOLS } from "../src/lib/market";
import { sessionAt } from "../src/lib/session";

const OUT = new URL("../data/log.jsonl", import.meta.url);
const SIZES = [1_000, 10_000, 50_000];
const EVERY = Number(process.env.EVERY_MIN || 10) * 60_000;
mkdirSync(new URL("../data/", import.meta.url), { recursive: true });

async function sampleOne(symbol: string, at: string, session: string) {
  const assets = await officialAssets();
  const asset = assets.get(symbol);
  if (!asset) return null;
  const [cl, rh, pools] = await Promise.all([chainlink(symbol), robinhoodQuote(symbol).catch(() => null), poolsFor(asset.address).catch(() => [])]);
  const ref = cl.close?.price;
  if (!ref || !pools.length) return { at, session, symbol, ref: ref ?? null, note: pools.length ? "no reference" : "no v3 USDG pool" };
  const fills: Record<string, number | null> = {};
  for (const usd of SIZES) {
    const [b, s] = await Promise.all([quote(asset.address, "buy", usd, ref, pools), quote(asset.address, "sell", usd, ref, pools)]);
    fills[`buy${usd}`] = b?.price ?? null;
    fills[`sell${usd}`] = s?.price ?? null;
  }
  return {
    at, session, symbol,
    close: cl.close, h24: cl.h24,
    rh: rh && { bid: rh.bid, ask: rh.ask, halted: rh.halted },
    pools: pools.map((p) => ({ address: p.address, fee: p.fee, liq: Math.round(p.liquidityUsd), px: p.priceUsd })),
    fills,
  };
}

async function sampleAll() {
  const at = new Date().toISOString();
  const session = sessionAt();
  let ok = 0;
  for (const symbol of SYMBOLS) {
    try {
      const row = await sampleOne(symbol, at, session);
      if (row) { appendFileSync(OUT, JSON.stringify(row) + "\n"); ok++; }
    } catch (e) {
      appendFileSync(OUT, JSON.stringify({ at, session, symbol, error: String((e as Error).message).slice(0, 200) }) + "\n");
    }
  }
  console.log(`${at} ${session}: logged ${ok}/${SYMBOLS.length}`);
}

for (;;) {
  const started = Date.now();
  await sampleAll().catch((e) => console.error(new Date().toISOString(), "sample failed:", e));
  await new Promise((r) => setTimeout(r, Math.max(10_000, EVERY - (Date.now() - started))));
}
