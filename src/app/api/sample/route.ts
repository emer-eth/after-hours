import { connection } from "next/server";
import { sampleAll } from "@/lib/sample";

// A snapshot of every stock token, as public JSON. Supabase's scheduler fetches this every 10 minutes and stores it.
// It only reads public onchain and API data, so it needs no secret.
export const maxDuration = 120;

export async function GET() {
  await connection();
  const rows = await sampleAll();
  return Response.json(rows, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=60" } });
}
