import "server-only";
import { chainlink, officialAssets, poolsFor, quote, robinhoodQuote } from "./market";
import { nextOpen, sessionAt } from "./session";
import { verdict, type Side } from "./verdict";

export class CheckError extends Error {
  constructor(message: string, public fix: string) {
    super(message);
  }
}

export async function checkTrade(symbol: string, side: Side, usd: number) {
  const now = new Date();
  const session = sessionAt(now);
  const assets = await officialAssets();
  const asset = assets.get(symbol);
  if (!asset) throw new CheckError(`${symbol} isn't an official Robinhood stock token.`, "Pick a token from the list.");

  const [cl, rh, pools] = await Promise.all([chainlink(symbol), robinhoodQuote(symbol).catch(() => null), poolsFor(asset.address)]);
  if (!cl.close) throw new CheckError(`Chainlink has no price for ${symbol} right now.`, "Try another token, or check again in a minute.");
  if (!pools.length) throw new CheckError(`There's no Uniswap pool deep enough to quote ${symbol}.`, "Try a bigger name like NVDA, TSLA or SPY.");

  const ref = cl.close.price;
  const [fill, small] = await Promise.all([quote(asset.address, side, usd, ref, pools), quote(asset.address, side, 1_000, ref, pools)]);
  if (!fill) throw new CheckError(`The pools can't fill a $${usd.toLocaleString("en-US")} ${side} of ${symbol}.`, "Try a smaller amount.");

  const v = verdict({ side, usd, session, ref, fill: fill.price, small: small?.price ?? null, liquidityUsd: pools.reduce((t, p) => t + p.liquidityUsd, 0) });
  return {
    asset,
    session,
    nextOpen: nextOpen(now).toISOString(),
    checkedAt: now.toISOString(),
    side,
    usd,
    last: cl.close,
    h24: cl.h24,
    robinhood: rh,
    fill: { price: fill.price, tokens: fill.tokens, usd: fill.usd, pool: fill.pool.address, fee: fill.pool.fee, ticksCrossed: fill.ticksCrossed },
    small: small?.price ?? null,
    pools: pools.map((p) => ({ address: p.address, fee: p.fee, liquidityUsd: p.liquidityUsd })),
    verdict: v,
  };
}

export type CheckResult = Awaited<ReturnType<typeof checkTrade>>;
