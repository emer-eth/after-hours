"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Reading the last real price from Chainlink",
  "Confirming the official Robinhood token",
  "Quoting your trade across every venue",
  "Working out what it costs you",
];

/** The check takes a couple of seconds; show what's happening instead of a blank skeleton. */
export function CheckLoading() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 650);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]" aria-busy="true" aria-live="polite">
      <div className="panel p-6 sm:p-8">
        <ol className="grid gap-4">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-sm transition-colors duration-300 ${i <= step ? "text-ink" : "text-faint"}`}>
              <span className={`grid size-6 place-items-center rounded-full border transition-all duration-300 ${i < step ? "border-good bg-good text-night" : i === step ? "border-lamp text-lamp" : "border-line"}`}>
                {i < step ? (
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M3 8.5l3 3 7-7" /></svg>
                ) : i === step ? (
                  <span className="live-dot size-1.5 rounded-full bg-lamp" />
                ) : null}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <div className="panel shimmer h-56" aria-hidden />
    </div>
  );
}
