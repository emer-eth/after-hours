import { parseAbi, parseUnits, formatUnits } from "viem";
import { client, USDG } from "../src/lib/chain";
import { chainlink } from "../src/lib/market";
const R = "0xcaf681a66d020601342297493863e78c959e5cb2";
console.log("router WETH9:", await client.readContract({ address: R, abi: parseAbi(["function WETH9() view returns (address)"]), functionName: "WETH9" }));
console.log("router factory:", await client.readContract({ address: R, abi: parseAbi(["function factoryV2() view returns (address)"]), functionName: "factoryV2" }).catch(() => "n/a"));
const NVDA = "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC";
const ref = (await chainlink("NVDA")).close!.price;
const q = parseAbi(["function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160, uint32, uint256)"]);
for (const tol of [0.003, 0.01, 0.02]) {
  const usd = 10000, amountIn = parseUnits((usd / ref).toFixed(18), 18);
  const minOut = parseUnits((usd * (1 - tol)).toFixed(6), 6);
  const { result } = await client.simulateContract({ address: "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7", abi: q, functionName: "quoteExactInputSingle", args: [{ tokenIn: NVDA, tokenOut: USDG, amountIn, fee: 500, sqrtPriceLimitX96: 0n }] });
  console.log(`sell $10k NVDA, allow ${tol * 100}%: quoted ${formatUnits(result[0], 6)} min ${formatUnits(minOut, 6)} ->`, result[0] < minOut ? "BLOCKED" : "would send");
}
