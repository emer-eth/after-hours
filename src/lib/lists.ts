import "server-only";
import { cacheLife } from "next/cache";
import { officialAssets, symbolsFor } from "./market";
import { CHAINS, type ChainKey } from "./chains";

export type SymbolLists = Record<ChainKey, { symbol: string; name: string }[]>;

/** The assets the check form offers on each chain (official tokens with a Chainlink feed), cached for an hour. */
export async function symbolLists(): Promise<SymbolLists> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  const lists = await Promise.all(
    CHAINS.map(async (c) => {
      const assets = await officialAssets(c).catch(() => new Map());
      return [c, symbolsFor(c).filter((s) => assets.has(s)).map((s) => ({ symbol: s, name: assets.get(s)!.name }))] as const;
    }),
  );
  return Object.fromEntries(lists) as SymbolLists;
}
