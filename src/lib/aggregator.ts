// Best route across every venue on Robinhood Chain (Uniswap v3/v4, Aerodrome, Ramses, Ekubo, market-maker pools…),
// via KyberSwap's public aggregator API. No key needed; a client id identifies us.

export const KYBER_API = "https://aggregator-api.kyberswap.com/robinhood/api/v1";
export const KYBER_ROUTER = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"; // MetaAggregationRouterV2, same address on every chain
export const CLIENT_ID = "after-hours";

export type RouteSummary = Record<string, unknown> & { amountIn: string; amountOut: string; route?: { exchange: string }[][] };
export type Route = { amountOut: bigint; venues: string[]; summary: RouteSummary };

const NAMES: Record<string, string> = {
  "uniswapv3": "Uniswap v3", "uniswap-v4": "Uniswap v4", "aero-cl": "Aerodrome", "ramses-v3": "Ramses", "ekubo-v3": "Ekubo",
  "metric-propamm": "Metric", "tidefi-prop": "Tidefi", "up-v3": "Up", "rialto": "Rialto",
};
const pretty = (x: string) => NAMES[x] ?? x.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^Pmm \d+$/, "Market maker");

/** The best route for swapping `amountIn` of `tokenIn` into `tokenOut`, or null if there's none. */
export async function bestRoute(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<Route | null> {
  try {
    const r = await fetch(`${KYBER_API}/routes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}`, {
      headers: { "x-client-id": CLIENT_ID, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { code: number; data?: { routeSummary?: RouteSummary } };
    const s = d.data?.routeSummary;
    if (d.code !== 0 || !s || !/^\d+$/.test(s.amountOut) || s.amountOut === "0") return null;
    const venues = [...new Set((s.route || []).flat().map((h) => pretty(h.exchange)))];
    return { amountOut: BigInt(s.amountOut), venues, summary: s };
  } catch {
    return null;
  }
}
