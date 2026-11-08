import "server-only";
import { chainlink, fills, officialAssets, poolsFor, robinhoodQuote } from "./market";
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

  const [cl, rh, pools] = await Promise.all([chainlink(symbol), robinhoodQuote(symbol).catch(() => null), poolsFor(asset.address).catch(() => [])]);
  if (!cl.close) throw new CheckError(`Chainlink has no price for ${symbol} right now.`, "Try another token, or check again in a minute.");

  const ref = cl.close.price;
  const [f, small] = await Promise.all([fills(asset.address, side, usd, ref, pools), fills(asset.address, side, 1_000, ref, pools)]);
  if (!f) throw new CheckError(`Nothing on Robinhood Chain can fill a $${usd.toLocaleString("en-US")} ${side} of ${symbol} right now.`, "Try a smaller amount, or check again in a minute.");

  const liquidityUsd = pools.reduce((t, p) => t + p.liquidityUsd, 0);
  const v = verdict({ side, usd, session, ref, fill: f.best.price, small: small?.best.price ?? null, liquidityUsd: f.best.source === "uniswap" ? liquidityUsd : undefined });
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
    best: f.best,
    route: f.route,
    uniswap: f.uniswap && { price: f.uniswap.price, tokens: f.uniswap.tokens, usd: f.uniswap.usd, pool: f.uniswap.pool.address, fee: f.uniswap.pool.fee },
    pools: pools.map((p) => ({ address: p.address, fee: p.fee, liquidityUsd: p.liquidityUsd })),
    verdict: v,
  };
}

export type CheckResult = Awaited<ReturnType<typeof checkTrade>>;
