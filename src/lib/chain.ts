import { createPublicClient, defineChain, http, parseAbi } from "viem";

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: { default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" } },
});

export const client = createPublicClient({ chain: robinhood, transport: http(undefined, { batch: true, retryCount: 2 }) });

export const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const; // 6 decimals
export const USDG_DECIMALS = 6;
export const V3_FACTORY = "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA" as const;
export const QUOTER_V2 = "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7" as const; // its factory() matches the pools' factory
export const SWAP_ROUTER_02 = "" as const; // not used yet

export const feedAbi = parseAbi(["function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"]);
export const poolAbi = parseAbi(["function token0() view returns (address)", "function token1() view returns (address)", "function fee() view returns (uint24)", "function factory() view returns (address)"]);
export const quoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]);
