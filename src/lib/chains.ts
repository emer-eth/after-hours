// The chains After Hours covers. Safe to import from the browser (no secrets, no server-only code).
import { createPublicClient, defineChain, fallback, http } from "viem";

export type ChainKey = "robinhood" | "base";
export const CHAINS: ChainKey[] = ["robinhood", "base"];

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});

export const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://base-rpc.publicnode.com", "https://mainnet.base.org", "https://base.drpc.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
});

export type ChainInfo = {
  key: ChainKey;
  chain: typeof robinhood | typeof base;
  label: string; // "Robinhood Chain"
  short: string; // "Robinhood"
  issuer: string; // who issues the official tokens
  stable: { address: `0x${string}`; symbol: string; decimals: number };
  kyber: string; // KyberSwap aggregator chain slug
  explorerToken: (a: string) => string;
  explorerTx: (h: string) => string;
};

export const CHAIN: Record<ChainKey, ChainInfo> = {
  robinhood: {
    key: "robinhood",
    chain: robinhood,
    label: "Robinhood Chain",
    short: "Robinhood",
    issuer: "Robinhood",
    stable: { address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168", symbol: "USDG", decimals: 6 },
    kyber: "robinhood",
    explorerToken: (a) => `https://robinhoodchain.blockscout.com/token/${a}`,
    explorerTx: (h) => `https://robinhoodchain.blockscout.com/tx/${h}`,
  },
  base: {
    key: "base",
    chain: base,
    label: "Base",
    short: "Base",
    issuer: "Coinbase",
    stable: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6 },
    kyber: "base",
    explorerToken: (a) => `https://basescan.org/token/${a}`,
    explorerTx: (h) => `https://basescan.org/tx/${h}`,
  },
};

export const chainOf = (v: unknown): ChainKey => (v === "base" ? "base" : "robinhood");

const clients = {
  robinhood: createPublicClient({ chain: robinhood, transport: http(undefined, { batch: true, retryCount: 2 }) }),
  base: createPublicClient({ chain: base, transport: fallback(base.rpcUrls.default.http.map((u) => http(u, { batch: true, retryCount: 1 }))) }),
};

export const clientFor = (c: ChainKey) => clients[c];
