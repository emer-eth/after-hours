import "server-only";
import { chainlink, fills, officialAssets, poolsFor, robinhoodQuote } from "./market";
import { nextOpen, sessionAt } from "./session";
import { verdict, type Side } from "./verdict";
import { CHAIN, type ChainKey } from "./chains";

export class CheckError extends Error {
  constructor(message: string, public fix: string) {
    super(message);
  }
}

export async function checkTrade(symbol: string, side: Side, usd: number, chain: ChainKey = "robinhood") {
  const now = new Date();
  const session = sessionAt(now);
  const assets = await officialAssets(chain);
  const asset = assets.get(symbol);
  if (!asset) throw new CheckError(`${symbol} isn't an official ${CHAIN[chain].issuer} stock token on ${CHAIN[chain].label}.`, "Pick a token from the list.");

  const [cl, rh, pools] = await Promise.all([chainlink(symbol, chain), chain === "robinhood" ? robinhoodQuote(symbol).catch(() => null) : Promise.resolve(null), poolsFor(asset.address, chain).catch(() => [])]);
  if (!cl.close) throw new CheckError(`Chainlink has no price for ${symbol} on ${CHAIN[chain].label}.`, "Try another token, or check again in a minute.");

  const ref = cl.close.price;
  const [f, small] = await Promise.all([fills(asset, side, usd, ref, pools), fills(asset, side, 1_000, ref, pools)]);
  if (!f) throw new CheckError(`Nothing on ${CHAIN[chain].label} can fill a $${usd.toLocaleString("en-US")} ${side} of ${symbol} right now.`, "Try a smaller amount, or check again in a minute.");

  const liquidityUsd = pools.reduce((t, p) => t + p.liquidityUsd, 0);
  const v = verdict({ side, usd, session, ref, fill: f.best.price, small: small?.best.price ?? null, liquidityUsd: f.best.source === "uniswap" ? liquidityUsd : undefined });
  return {
    chain,
    asset,
    session,
    nextOpen: nextOpen(now).toISOString(),
    checkedAt: now.toISOString(),
    side,
    usd,
    last: cl.close,
    h24: cl.h24,
    robinhood: rh,
    best: f.best,
    small: small?.best.price ?? null, // what a $1k trade fills at: the market's own price, without your size
    route: f.route,
    uniswap: f.uniswap && { price: f.uniswap.price, tokens: f.uniswap.tokens, usd: f.uniswap.usd, pool: f.uniswap.pool.address, fee: f.uniswap.pool.fee },
    pools: pools.map((p) => ({ address: p.address, fee: p.fee, liquidityUsd: p.liquidityUsd })),
    verdict: v,
  };
}

export type CheckResult = Awaited<ReturnType<typeof checkTrade>>;
