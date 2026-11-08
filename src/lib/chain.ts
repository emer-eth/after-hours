import { parseAbi } from "viem";
import { CHAIN, clientFor, robinhood } from "./chains";

// Robinhood Chain specifics (Uniswap v3), plus ABIs shared by both chains.
export { robinhood };
export const client = clientFor("robinhood");

export const USDG = CHAIN.robinhood.stable.address; // 6 decimals
export const USDG_DECIMALS = CHAIN.robinhood.stable.decimals;
export const V3_FACTORY = "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA" as const;
export const QUOTER_V2 = "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7" as const; // its factory() matches the pools' factory

export const feedAbi = parseAbi(["function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)"]);
export const poolAbi = parseAbi(["function token0() view returns (address)", "function token1() view returns (address)", "function fee() view returns (uint24)", "function factory() view returns (address)"]);
export const quoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]);
