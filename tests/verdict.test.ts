import assert from "node:assert/strict";
import test from "node:test";
import { verdict } from "../src/lib/verdict";
import { nextOpen, sessionAt } from "../src/lib/session";

const base = { usd: 10_000, ref: 100, small: null } as const;

test("fair when the fill is within 0.3% of the last real price", () => {
  assert.equal(verdict({ ...base, side: "buy", session: "regular", fill: 100.1 }).call, "fair");
});

test("wait when Wall Street is closed and the trade costs 0.75%+", () => {
  const v = verdict({ ...base, side: "sell", session: "weekend", fill: 98.9, small: 98.95 });
  assert.equal(v.call, "wait");
  assert.ok(Math.abs(v.costUsd - 110) < 0.01);
});

test("the same cost during market hours asks for a limit instead", () => {
  assert.equal(verdict({ ...base, side: "sell", session: "regular", fill: 99.4, small: 99.45 }).call, "limit");
});

test("split when the trade's own size causes most of the cost", () => {
  assert.equal(verdict({ ...base, side: "buy", session: "regular", fill: 101, small: 100.05 }).call, "split");
});

test("thin pools: a buy never loses more than the money put in", () => {
  const v = verdict({ ...base, side: "buy", session: "weekend", fill: 400, small: 101, liquidityUsd: 14_000 });
  assert.equal(v.call, "thin");
  assert.ok(v.costUsd <= 10_000 && v.costUsd > 7_000);
});

test("bonus when the pool is better than the last real price", () => {
  assert.equal(verdict({ ...base, side: "buy", session: "overnight", fill: 99 }).call, "bonus");
});

test("sessions in New York time, including the weekend", () => {
  assert.equal(sessionAt(new Date("2026-11-08T05:00:00Z")), "weekend"); // Sun 00:00 ET
  assert.equal(sessionAt(new Date("2026-11-09T02:00:00Z")), "overnight"); // Sun 21:00 ET
  assert.equal(sessionAt(new Date("2026-11-09T12:00:00Z")), "pre"); // Mon 07:00 ET
  assert.equal(sessionAt(new Date("2026-11-09T15:00:00Z")), "regular"); // Mon 10:00 ET
  assert.equal(sessionAt(new Date("2026-11-09T22:00:00Z")), "after"); // Mon 17:00 ET
  assert.equal(nextOpen(new Date("2026-11-08T05:00:00Z")).toISOString(), "2026-11-09T14:30:00.000Z");
});
