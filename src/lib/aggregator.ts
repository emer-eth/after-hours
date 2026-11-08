// Best route across every venue on the chain (Uniswap, Aerodrome, Ramses, Ekubo, market-maker pools…),
// via KyberSwap's public aggregator API. No key needed; a client id identifies us.
import { CHAIN, type ChainKey } from "./chains";

export const kyberApi = (chain: ChainKey) => `https://aggregator-api.kyberswap.com/${CHAIN[chain].kyber}/api/v1`;
export const KYBER_ROUTER = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5"; // MetaAggregationRouterV2, same address on every chain
export const CLIENT_ID = "after-hours";

export type RouteSummary = Record<string, unknown> & { amountIn: string; amountOut: string; route?: { exchange: string }[][] };
export type Route = { amountOut: bigint; venues: string[]; summary: RouteSummary };

const NAMES: Record<string, string> = {
  "uniswapv3": "Uniswap v3", "uniswap-v4": "Uniswap v4", "aero-cl": "Aerodrome", "ramses-v3": "Ramses", "ekubo-v3": "Ekubo",
  "metric-propamm": "Metric", "tidefi-prop": "Tidefi", "up-v3": "Up", "rialto": "Rialto", "nami-v4": "Nami", "aerodrome": "Aerodrome", "uniswap": "Uniswap", "pancake-v3": "PancakeSwap",
};
const one = (x: string) => NAMES[x] ?? x.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^Pmm \d+$/, "Market maker").replace(/ Prop(amm)?$/, "");
const pretty = (x: string) => x.split("/").map(one).join(" + ");

// KyberSwap's free API blocks bursts (429 after ~18 quick calls) but is happy with about one call a second.
// So calls from this server queue up at least GAP ms apart, and a 429 waits and tries again.
const GAP = 600;
let nextSlot = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function slot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + GAP;
  if (at > now) await sleep(at - now);
}

/** The best route for swapping `amountIn` of `tokenIn` into `tokenOut`, or null if there's none. */
export async function bestRoute(chain: ChainKey, tokenIn: string, tokenOut: string, amountIn: bigint): Promise<Route | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await tryRoute(chain, tokenIn, tokenOut, amountIn);
    if (r !== "retry") return r;
    await sleep(1500 * (attempt + 1));
  }
  return null;
}

async function tryRoute(chain: ChainKey, tokenIn: string, tokenOut: string, amountIn: bigint): Promise<Route | null | "retry"> {
  await slot();
  try {
    const r = await fetch(`${kyberApi(chain)}/routes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}`, {
      headers: { "x-client-id": CLIENT_ID, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status === 429 || r.status >= 500) return "retry";
    if (!r.ok) return null;
    const d = (await r.json()) as { code: number; data?: { routeSummary?: RouteSummary } };
    const s = d.data?.routeSummary;
    if (d.code !== 0 || !s || !/^\d+$/.test(s.amountOut) || s.amountOut === "0") return null;
    const venues = [...new Set((s.route || []).flat().map((h) => pretty(h.exchange)))];
    return { amountOut: BigInt(s.amountOut), venues, summary: s };
  } catch {
    return "retry"; // timeout or network error
  }
}
