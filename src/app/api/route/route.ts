import { connection } from "next/server";
import { getAddress, isAddress } from "viem";
import { bestRoute, CLIENT_ID, kyberApi, KYBER_ROUTER, type RouteSummary } from "@/lib/aggregator";
import { chainOf } from "@/lib/chains";

// GET: the best route for a swap (for the protected swap's check). POST: build that route's transaction with a hard floor.
// The floor (minOut) comes from the browser, which derives it from Chainlink's last real price.

const bad = (message: string, status = 400) => Response.json({ error: message }, { status });

export async function GET(req: Request) {
  await connection();
  const q = new URL(req.url).searchParams;
  const chain = chainOf(q.get("chain"));
  const tokenIn = q.get("tokenIn") || "", tokenOut = q.get("tokenOut") || "", amountIn = q.get("amountIn") || "";
  if (!isAddress(tokenIn) || !isAddress(tokenOut) || !/^\d{1,40}$/.test(amountIn)) return bad("Bad swap details.");
  const r = await bestRoute(chain, tokenIn, tokenOut, BigInt(amountIn));
  if (!r) return bad("No route right now.", 404);
  return Response.json({ amountOut: r.amountOut.toString(), venues: r.venues, summary: r.summary });
}

export async function POST(req: Request) {
  await connection();
  const body = (await req.json().catch(() => null)) as { summary?: RouteSummary; sender?: string; minOut?: string; chain?: string } | null;
  const chain = chainOf(body?.chain);
  const summary = body?.summary, sender = body?.sender || "", minOut = body?.minOut || "";
  if (!summary || !isAddress(sender) || !/^\d{1,40}$/.test(minOut) || !/^\d+$/.test(summary.amountOut || "")) return bad("Bad swap details.");

  const quoted = BigInt(summary.amountOut), floor = BigInt(minOut);
  if (quoted < floor) return Response.json({ blocked: true, amountOut: summary.amountOut }, { status: 409 });
  // Kyber enforces amountOut × (1 − slippage) onchain; pick the slippage that lands exactly on (or just above) our floor.
  const bps = Number(((quoted - floor) * BigInt(10_000)) / quoted);
  const slippageTolerance = Math.min(2000, Math.max(0, bps));

  const r = await fetch(`${kyberApi(chain)}/route/build`, {
    method: "POST",
    headers: { "x-client-id": CLIENT_ID, "content-type": "application/json" },
    body: JSON.stringify({ routeSummary: summary, sender, recipient: sender, slippageTolerance, deadline: Math.floor(Date.now() / 1000) + 300, source: CLIENT_ID }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!r?.ok) return bad("The route expired. Check again.", 502);
  const d = (await r.json()) as { code: number; data?: { routerAddress: string; data: string; amountIn: string; amountOut: string; transactionValue?: string } };
  if (d.code !== 0 || !d.data) return bad("The route expired. Check again.", 502);
  if (getAddress(d.data.routerAddress) !== getAddress(KYBER_ROUTER)) return bad("Unexpected router; refusing to build this swap.", 502);
  return Response.json({ to: KYBER_ROUTER, data: d.data.data, value: d.data.transactionValue || "0", amountIn: d.data.amountIn, amountOut: d.data.amountOut, slippageTolerance });
}
