// Turns the numbers into one plain call. Pure: no fetching, so it is easy to test.
import type { Session } from "./session";

export type Side = "buy" | "sell";
export type Call = "fair" | "limit" | "split" | "wait" | "bonus" | "thin";

export type VerdictInput = {
  side: Side;
  usd: number;
  session: Session;
  ref: number; // Chainlink's last real market price
  fill: number; // what this trade fills at, per token
  small: number | null; // what a $1,000 trade fills at: the pool's own price, without your size
  liquidityUsd?: number; // all the pools' liquidity together, as DexScreener reports it
};

export type Verdict = {
  call: Call;
  title: string;
  body: string;
  costPct: number; // + means you pay more (buy) or get less (sell) than the last real price
  costUsd: number;
  driftPct: number; // how far the pool itself sits from the last real price, against you if +
  impactPct: number; // how much your size alone moves the price
  limit: number; // a protective price: never pay above / sell below this
};

export const FAIR = 0.003; // 0.3%: about what a normal trade costs
export const WAIT = 0.0075; // 0.75%: worth waiting for Wall Street when it's closed
export const SPLIT = 0.005; // 0.5% of the cost coming from your size alone
export const THIN = 0.2; // 20%+: the pools simply can't take this trade

const pct = (x: number) => `${(x * 100).toFixed(x * 100 >= 10 ? 0 : x * 100 >= 1 ? 1 : 2)}%`;
const usdFmt = (x: number) => (x >= 100 ? `$${Math.round(x).toLocaleString("en-US")}` : `$${x.toFixed(2)}`);

export function verdict(v: VerdictInput): Verdict {
  const sign = v.side === "buy" ? 1 : -1;
  // Share of the money lost against trading at the last real price: a buy gets fewer shares, a sell gets fewer dollars.
  const costPct = v.side === "buy" ? 1 - v.ref / v.fill : (v.ref - v.fill) / v.ref;
  const small = v.small ?? v.fill;
  const driftPct = (sign * (small - v.ref)) / v.ref;
  const impactPct = Math.max(0, (sign * (v.fill - small)) / small);
  const costUsd = costPct * v.usd;
  const limit = v.side === "buy" ? v.ref * (1 + FAIR) : v.ref * (1 - FAIR);
  const closed = v.session !== "regular";
  const verb = v.side === "buy" ? "pay" : "get";
  const base = { costPct, costUsd, driftPct, impactPct, limit };

  if (costPct >= THIN)
    return {
      ...base,
      call: "thin",
      title: "The pools can't take a trade this size",
      body: `You'd lose ${usdFmt(Math.abs(costUsd))} (${pct(costPct)}) of a ${usdFmt(v.usd)} trade${v.liquidityUsd ? `, because the pools only hold about ${usdFmt(v.liquidityUsd)} in total` : ""}. Trade a much smaller amount, or wait for Wall Street, where the real stock trades.`,
    };
  if (costPct <= -FAIR)
    return {
      ...base,
      call: "bonus",
      title: v.side === "buy" ? "It's cheaper than the last real price" : "It's above the last real price",
      body: `You'd ${verb} ${pct(-costPct)} better than where the stock last traded on Wall Street. That usually means traders expect it to open ${v.side === "buy" ? "lower" : "higher"}. It may be right.`,
    };
  if (impactPct >= SPLIT && impactPct >= costPct / 2)
    return {
      ...base,
      call: "split",
      title: "Your size is moving the price",
      body: `${pct(impactPct)} of the cost comes from the size of this trade alone. Split it into smaller trades, or set a limit at ${usdFmt(limit)}.`,
    };
  if (closed && costPct >= WAIT)
    return {
      ...base,
      call: "wait",
      title: "Wait for Wall Street to open",
      body: `Right now you'd ${verb} ${usdFmt(Math.abs(costUsd))} (${pct(costPct)}) worse than the last real price, because the market is thin while Wall Street is closed. Prices usually line up again by the open.`,
    };
  if (costPct >= FAIR)
    return {
      ...base,
      call: "limit",
      title: "Use a limit, not a market order",
      body: `You'd ${verb} ${pct(costPct)} worse than the last real price. A limit at ${usdFmt(limit)} keeps you from overpaying if the pool moves.`,
    };
  return { ...base, call: "fair", title: "Fair price right now", body: `You'd ${verb} within ${pct(FAIR)} of the last real price. That's about what a normal trade costs.` };
}

export { pct, usdFmt };
