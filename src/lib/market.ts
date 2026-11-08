import { formatUnits, parseUnits, getAddress } from "viem";
import { client, feedAbi, poolAbi, quoterAbi, QUOTER_V2, USDG, USDG_DECIMALS, V3_FACTORY } from "./chain";
import { CHAIN, clientFor, type ChainKey } from "./chains";
import FEEDS from "./feeds.json";
import FEEDS_BASE from "./feeds-base.json";
import { bestRoute } from "./aggregator";

export type Asset = { chain: ChainKey; symbol: string; name: string; address: `0x${string}`; decimals: number; logo: string; active: boolean };
export type Feed = { price: number; updatedAt: number } | null;
export type Pool = { address: `0x${string}`; fee: number; liquidityUsd: number; priceUsd: number; tokenIsToken0: boolean };

const FEED_MAP: Record<ChainKey, Record<string, { close?: string; h24?: string }>> = {
  robinhood: FEEDS as Record<string, { close?: string; h24?: string }>,
  base: FEEDS_BASE as Record<string, { close?: string; h24?: string }>,
};

/** The assets we can measure on a chain: the ones with a Chainlink "last real price" feed. */
export const symbolsFor = (chain: ChainKey) => Object.keys(FEED_MAP[chain]).sort();
export const SYMBOLS = symbolsFor("robinhood");

const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && performance.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  cache.set(key, { at: performance.now(), value });
  return value;
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`${new URL(url).host} answered ${r.status}`);
  return r.json() as Promise<T>;
}

/**
 * The issuer's official list of stock tokens: the only addresses that are the real thing.
 * Robinhood Chain: Robinhood's public asset API. Base: Coinbase's public tokenized-stocks API (symbols like "NVDAc").
 */
export function officialAssets(chain: ChainKey = "robinhood") {
  return cached(`assets:${chain}`, 60 * 60_000, async () => {
    const out = new Map<string, Asset>();
    if (chain === "robinhood") {
      type Raw = { tokenSymbol: string; tokenName: string; status: string; logoUrl: string; tokenDecimals?: number; deployments: { contractAddress: string; chainId: number }[] };
      const { assets } = await getJson<{ assets: Raw[] }>("https://api.robinhood.com/rhj/assets");
      for (const a of assets) {
        const d = a.deployments.find((x) => x.chainId === 4663);
        if (!d) continue;
        out.set(a.tokenSymbol, {
          chain,
          symbol: a.tokenSymbol,
          name: a.tokenName.replace(/\s*•\s*Robinhood Token$/, ""),
          address: getAddress(d.contractAddress),
          decimals: a.tokenDecimals ?? 18,
          logo: a.logoUrl,
          active: a.status === "ASSET_STATUS_ACTIVE",
        });
      }
    } else {
      type Raw = { contract_address: string; symbol: string; name: string; decimals?: number; icon_url?: string };
      const { tokens } = await getJson<{ tokens: Raw[] }>("https://api.coinbase.com/v1/tokenized-stocks?page_size=500");
      for (const t of tokens) {
        if (!/^0xb200/i.test(t.contract_address)) continue; // every Coinbase-issued stock token starts with 0xb200
        const symbol = t.symbol.replace(/c$/, "");
        out.set(symbol, { chain, symbol, name: t.name.replace(/,? Inc\.?$|,? Corporation$|,? Corp\.?$/, ""), address: getAddress(t.contract_address), decimals: t.decimals ?? 8, logo: t.icon_url ?? "", active: true });
      }
    }
    return out;
  });
}

/** Robinhood's own bid/ask for the token (multiplier-adjusted), from its public prices API. Robinhood Chain only. */
export async function robinhoodQuote(symbol: string) {
  type Q = { quotes: { tokenBid: string; tokenAsk: string; isTradingHalt: boolean; generatedAt: string }[] };
  const { quotes } = await getJson<Q>(`https://api.robinhood.com/rhj/prices/${encodeURIComponent(symbol)}`);
  const q = quotes[0];
  if (!q) return null;
  const bid = Number(q.tokenBid), ask = Number(q.tokenAsk);
  return { bid, ask, mid: (bid + ask) / 2, halted: q.isTradingHalt, at: q.generatedAt };
}

async function readFeed(chain: ChainKey, address?: string): Promise<Feed> {
  if (!address) return null;
  const r = await clientFor(chain).readContract({ address: address as `0x${string}`, abi: feedAbi, functionName: "latestRoundData" });
  const price = Number(r[1]) / 1e8;
  return price > 0 ? { price, updatedAt: Number(r[3]) * 1000 } : null;
}

/** Chainlink: "close" is the last real market price; "h24" is Chainlink's around-the-clock estimate (only some tokens have one). */
export async function chainlink(symbol: string, chain: ChainKey = "robinhood") {
  const f = FEED_MAP[chain][symbol] || {};
  const [close, h24] = await Promise.all([readFeed(chain, f.close), readFeed(chain, f.h24)]);
  return { close, h24 };
}

/** The deepest Uniswap v3 pools pairing the token with USDG on Robinhood Chain (found through DexScreener, checked onchain). */
export function poolsFor(token: `0x${string}`, chain: ChainKey = "robinhood") {
  if (chain !== "robinhood") return Promise.resolve([] as Pool[]); // on Base we rely on the best route alone
  return cached(`pools:${token}`, 30 * 60_000, async () => {
    type P = { chainId: string; dexId: string; labels?: string[]; pairAddress: string; baseToken: { address: string }; quoteToken: { address: string }; priceUsd?: string; liquidity?: { usd?: number } };
    const { pairs } = await getJson<{ pairs: P[] | null }>(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
    const candidates = (pairs || [])
      .filter((p) => p.chainId === "robinhood" && p.dexId === "uniswap" && p.labels?.includes("v3") && /^0x[0-9a-fA-F]{40}$/.test(p.pairAddress))
      .filter((p) => [p.baseToken.address, p.quoteToken.address].map((a) => a.toLowerCase()).includes(USDG.toLowerCase()))
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
      .slice(0, 3);
    const pools: Pool[] = [];
    for (const p of candidates) {
      const address = getAddress(p.pairAddress);
      const [t0, fee, factory] = await Promise.all([
        client.readContract({ address, abi: poolAbi, functionName: "token0" }),
        client.readContract({ address, abi: poolAbi, functionName: "fee" }),
        client.readContract({ address, abi: poolAbi, functionName: "factory" }),
      ]);
      if (getAddress(factory) !== V3_FACTORY) continue; // only real Uniswap v3 pools
      pools.push({ address, fee: Number(fee), liquidityUsd: p.liquidity?.usd || 0, priceUsd: Number(p.priceUsd || 0), tokenIsToken0: getAddress(t0) === token });
    }
    return pools;
  });
}

/** DexScreener's total liquidity for a token on a chain (used to rank the board where there are no Uniswap pools to read). */
export function liquidityOf(token: `0x${string}`, chain: ChainKey) {
  return cached(`liq:${chain}:${token}`, 30 * 60_000, async () => {
    type P = { chainId: string; liquidity?: { usd?: number } };
    const { pairs } = await getJson<{ pairs: P[] | null }>(`https://api.dexscreener.com/latest/dex/tokens/${token}`).catch(() => ({ pairs: null }));
    return (pairs || []).filter((p) => p.chainId === chain).reduce((t, p) => t + (p.liquidity?.usd || 0), 0);
  });
}

export type Fill = { pool: Pool; tokens: number; usd: number; price: number; ticksCrossed: number };

/**
 * What a trade of `usd` dollars would actually fill at, quoted onchain by Uniswap's QuoterV2 against each pool; the best fill wins.
 * Robinhood Chain only. Buy: spend `usd` USDG. Sell: sell the number of tokens worth `usd` at `refPrice`.
 */
export async function quote(token: `0x${string}`, side: "buy" | "sell", usd: number, refPrice: number, pools: Pool[]): Promise<Fill | null> {
  const fills = await Promise.all(
    pools.map(async (pool) => {
      try {
        const amountIn = side === "buy" ? parseUnits(usd.toFixed(USDG_DECIMALS), USDG_DECIMALS) : parseUnits((usd / refPrice).toFixed(18), 18);
        const { result } = await client.simulateContract({
          address: QUOTER_V2,
          abi: quoterAbi,
          functionName: "quoteExactInputSingle",
          args: [{ tokenIn: side === "buy" ? USDG : token, tokenOut: side === "buy" ? token : USDG, amountIn, fee: pool.fee, sqrtPriceLimitX96: BigInt(0) }],
        });
        const out = Number(formatUnits(result[0], side === "buy" ? 18 : USDG_DECIMALS));
        if (!(out > 0)) return null;
        const tokens = side === "buy" ? out : usd / refPrice;
        const dollars = side === "buy" ? usd : out;
        return { pool, tokens, usd: dollars, price: dollars / tokens, ticksCrossed: Number(result[2]) } satisfies Fill;
      } catch {
        return null; // too big for this pool, or the pool is empty
      }
    }),
  );
  const ok = fills.filter((f): f is Fill => !!f);
  if (!ok.length) return null;
  return ok.reduce((best, f) => (side === "buy" ? (f.price < best.price ? f : best) : f.price > best.price ? f : best));
}

export type Fills = {
  best: { price: number; tokens: number; usd: number; source: "route" | "uniswap" };
  uniswap: Fill | null;
  route: { price: number; tokens: number; usd: number; venues: string[] } | null;
};

/** Uniswap v3 alone (Robinhood Chain) and the best route across all venues, side by side; `best` is whichever fills better. */
export async function fills(asset: Pick<Asset, "address" | "decimals" | "chain">, side: "buy" | "sell", usd: number, refPrice: number, pools: Pool[], useRoute = true): Promise<Fills | null> {
  const { address: token, decimals, chain } = asset;
  const stable = CHAIN[chain].stable;
  const amountIn = side === "buy" ? parseUnits(usd.toFixed(stable.decimals), stable.decimals) : parseUnits((usd / refPrice).toFixed(decimals), decimals);
  const [uni, r] = await Promise.all([
    chain === "robinhood" && pools.length ? quote(token, side, usd, refPrice, pools) : Promise.resolve(null),
    useRoute ? bestRoute(chain, side === "buy" ? stable.address : token, side === "buy" ? token : stable.address, amountIn) : Promise.resolve(null),
  ]);
  let route: Fills["route"] = null;
  if (r) {
    const out = Number(formatUnits(r.amountOut, side === "buy" ? decimals : stable.decimals));
    const tokens = side === "buy" ? out : usd / refPrice;
    const dollars = side === "buy" ? usd : out;
    route = { price: dollars / tokens, tokens, usd: dollars, venues: r.venues };
  }
  const better = (a: number, b: number) => (side === "buy" ? a < b : a > b);
  const pick = route && (!uni || better(route.price, uni.price)) ? { ...route, source: "route" as const } : uni ? { price: uni.price, tokens: uni.tokens, usd: uni.usd, source: "uniswap" as const } : null;
  return pick ? { best: pick, uniswap: uni, route } : null;
}
