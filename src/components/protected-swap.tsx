"use client";

import { useState } from "react";
import { createPublicClient, createWalletClient, custom, encodeFunctionData, formatUnits, http, parseAbi, parseUnits, type EIP1193Provider } from "viem";
import { robinhood } from "@/lib/chain";

// Uniswap v3 on Robinhood Chain (developers.uniswap.org, v3 Robinhood Chain deployments).
const ROUTER = "0xcaf681a66d020601342297493863e78c959e5cb2" as const; // SwapRouter02
const QUOTER = "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7" as const; // QuoterV2
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;
const USDG_DECIMALS = 6;

const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"]);
const router = parseAbi([
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
  "function multicall(uint256 deadline, bytes[] data) payable returns (bytes[] results)",
]);
const quoter = parseAbi(["function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160, uint32, uint256)"]);

const reader = createPublicClient({ chain: robinhood, transport: http() });
const TOLERANCES = [0.003, 0.01, 0.02];

type Props = { symbol: string; token: `0x${string}`; fee: number; side: "buy" | "sell"; usd: number; lastPrice: number };
type State =
  | { step: "idle" }
  | { step: "working"; note: string }
  | { step: "blocked"; quoted: number; min: number }
  | { step: "done"; hash: string }
  | { step: "error"; message: string };

function wallet(): EIP1193Provider | null {
  return typeof window !== "undefined" ? ((window as unknown as { ethereum?: EIP1193Provider }).ethereum ?? null) : null;
}

async function switchToRobinhood(eth: EIP1193Provider) {
  const id = `0x${robinhood.id.toString(16)}`;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: id }] });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: id, chainName: robinhood.name, nativeCurrency: robinhood.nativeCurrency, rpcUrls: robinhood.rpcUrls.default.http, blockExplorerUrls: [robinhood.blockExplorers.default.url] }],
    });
  }
}

/**
 * A swap whose worst acceptable fill is set from Chainlink's last real price, not from the pool's current price.
 * If the pool has drifted, the swap is stopped before it's sent and the money stays in the wallet.
 */
export function ProtectedSwap({ symbol, token, fee, side, usd, lastPrice: ref }: Props) {
  const [tol, setTol] = useState(TOLERANCES[0]);
  const [state, setState] = useState<State>({ step: "idle" });
  const [account, setAccount] = useState<`0x${string}` | null>(null);

  const tokenIn = side === "buy" ? USDG : token;
  const tokenOut = side === "buy" ? token : USDG;
  const inDecimals = side === "buy" ? USDG_DECIMALS : 18;
  const outDecimals = side === "buy" ? 18 : USDG_DECIMALS;
  const amountIn = side === "buy" ? parseUnits(usd.toFixed(USDG_DECIMALS), USDG_DECIMALS) : parseUnits((usd / ref).toFixed(18), 18);
  // The protection: at worst pay ref × (1 + tol) per share when buying, get ref × (1 − tol) when selling.
  const minOut = side === "buy" ? parseUnits((usd / (ref * (1 + tol))).toFixed(18), 18) : parseUnits(((usd / ref) * ref * (1 - tol)).toFixed(USDG_DECIMALS), USDG_DECIMALS);
  const limitPrice = side === "buy" ? ref * (1 + tol) : ref * (1 - tol);
  const outLabel = side === "buy" ? `${Number(formatUnits(minOut, 18)).toFixed(4)} ${symbol}` : `$${Number(formatUnits(minOut, USDG_DECIMALS)).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  async function connect() {
    const eth = wallet();
    if (!eth) return setState({ step: "error", message: "No browser wallet found. Open this page in a wallet's browser, or install one." });
    try {
      const [a] = (await eth.request({ method: "eth_requestAccounts" })) as `0x${string}`[];
      setAccount(a);
      setState({ step: "idle" });
    } catch {
      setState({ step: "error", message: "The wallet didn't connect." });
    }
  }

  async function swap() {
    try {
      setState({ step: "working", note: "Checking the pool against the last real price…" });
      const { result } = await reader.simulateContract({ address: QUOTER, abi: quoter, functionName: "quoteExactInputSingle", args: [{ tokenIn, tokenOut, amountIn, fee, sqrtPriceLimitX96: BigInt(0) }] });
      const quotedOut = result[0];
      if (quotedOut < minOut) {
        const q = Number(formatUnits(quotedOut, outDecimals));
        const quoted = side === "buy" ? usd / q : q / (usd / ref);
        return setState({ step: "blocked", quoted, min: limitPrice });
      }

      // The pool can meet the limit: only now does a wallet come into it.
      const eth = wallet();
      if (!eth) return setState({ step: "error", message: "The pool can fill within your limit right now. To trade, open this page in a wallet's browser, or install one." });
      if (!account) {
        setState({ step: "idle" });
        return connect();
      }

      const balance = await reader.readContract({ address: tokenIn, abi: erc20, functionName: "balanceOf", args: [account] });
      if (balance < amountIn) return setState({ step: "error", message: `Not enough ${side === "buy" ? "USDG" : symbol}: this needs ${Number(formatUnits(amountIn, inDecimals)).toLocaleString("en-US", { maximumFractionDigits: 4 })}.` });

      await switchToRobinhood(eth);
      const signer = createWalletClient({ account, chain: robinhood, transport: custom(eth) });
      const allowance = await reader.readContract({ address: tokenIn, abi: erc20, functionName: "allowance", args: [account, ROUTER] });
      if (allowance < amountIn) {
        setState({ step: "working", note: `Approve exactly this amount of ${side === "buy" ? "USDG" : symbol} in your wallet…` });
        const h = await signer.writeContract({ address: tokenIn, abi: erc20, functionName: "approve", args: [ROUTER, amountIn] });
        await reader.waitForTransactionReceipt({ hash: h });
      }

      setState({ step: "working", note: "Confirm the protected swap in your wallet…" });
      const call = encodeFunctionData({ abi: router, functionName: "exactInputSingle", args: [{ tokenIn, tokenOut, fee, recipient: account, amountIn, amountOutMinimum: minOut, sqrtPriceLimitX96: BigInt(0) }] });
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
      const hash = await signer.writeContract({ address: ROUTER, abi: router, functionName: "multicall", args: [deadline, [call]] });
      setState({ step: "working", note: "Waiting for Robinhood Chain…" });
      const receipt = await reader.waitForTransactionReceipt({ hash });
      setState(receipt.status === "success" ? { step: "done", hash } : { step: "error", message: "The swap reverted onchain, so nothing was traded. The pool probably moved past your limit." });
    } catch (e) {
      const msg = (e as { shortMessage?: string; message?: string }).shortMessage || (e as Error).message || "";
      setState({ step: "error", message: /reject|denied/i.test(msg) ? "You cancelled it in your wallet. Nothing was sent." : msg.slice(0, 180) });
    }
  }

  const busy = state.step === "working";
  return (
    <section className="panel mt-6 p-5 sm:p-6" aria-labelledby="pswap">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="pswap" className="font-serif text-2xl">Protected {side}</h2>
        <span className="text-xs text-faint">Onchain · Uniswap v3 on Robinhood Chain</span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-soft">
        A normal swap only protects you against the pool&apos;s own price, which may already have drifted. This one sets your worst fill from Chainlink&apos;s last real price. If the pool can&apos;t meet it, nothing is sent.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-soft">Allow up to</span>
        {TOLERANCES.map((t) => (
          <button key={t} type="button" aria-pressed={tol === t} disabled={busy} onClick={() => { setTol(t); setState({ step: "idle" }); }} className={`rounded-lg border px-3 py-1 tnum ${tol === t ? "border-lamp bg-lamp-soft text-lamp" : "border-line text-soft hover:text-ink"}`}>
            {(t * 100).toFixed(t < 0.01 ? 1 : 0)}%
          </button>
        ))}
        <span className="text-soft">from the last real price</span>
      </div>

      <p className="mt-4 text-sm tnum">
        {side === "buy" ? "Never pay more than" : "Never sell for less than"} <b className="font-medium">${limitPrice.toFixed(2)}</b> per share · you get at least <b className="font-medium">{outLabel}</b>
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={swap} disabled={busy} className="rounded-xl bg-ink px-5 py-2.5 font-medium text-night transition hover:brightness-95 disabled:opacity-50">
          {busy ? state.note : `Protected ${side} · $${usd.toLocaleString("en-US")}`}
        </button>
        {account ? <span className="font-mono text-xs text-faint">{account.slice(0, 6)}…{account.slice(-4)}</span> : <span className="text-xs text-faint">Checks the pool first. A wallet is only needed if it passes.</span>}
      </div>

      {state.step === "blocked" && (
        <p className="mt-4 rounded-xl border border-bad/40 bg-bad-soft p-4 text-sm" role="status">
          <b className="font-medium">Stopped. Nothing was sent.</b> The pool would {side === "buy" ? "charge" : "pay"} ${state.quoted.toFixed(2)} per share, past your limit of ${state.min.toFixed(2)}. Wait for the open, allow more, or trade less.
        </p>
      )}
      {state.step === "done" && (
        <p className="mt-4 rounded-xl border border-good/40 bg-good-soft p-4 text-sm" role="status">
          Done, within your limit.{" "}
          <a className="underline underline-offset-4" href={`${robinhood.blockExplorers.default.url}/tx/${state.hash}`} target="_blank" rel="noreferrer">
            See it on Blockscout
          </a>
        </p>
      )}
      {state.step === "error" && <p className="mt-4 text-sm text-bad" role="alert">{state.message}</p>}

      <p className="mt-4 text-xs text-faint">Stock tokens are only offered where Robinhood allows them, and not to US persons. Checking works anywhere; trading is your responsibility.</p>
    </section>
  );
}
