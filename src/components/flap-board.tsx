"use client";

import { useEffect, useState } from "react";

// A split-flap ("Solari") departures board: each character cell scrambles through letters, then settles on its
// target, left to right and row by row. The server renders the final text; the scramble only runs in the browser.

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.%$+-";

export type FlapRow = { cells: { text: string; width: number; tone?: "ink" | "soft" | "good" | "warn" | "bad" | "lamp" }[]; href?: string };

const TONE = { ink: "text-ink", soft: "text-soft", good: "text-good", warn: "text-warn", bad: "text-bad", lamp: "text-lamp" };

function useFlap(target: string, delay: number) {
  const [shown, setShown] = useState(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now() + delay;
    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      let done = true;
      const out = target.split("").map((ch, i) => {
        if (ch === " ") return " ";
        const settleAt = 260 + i * 55; // each cell lands a little after the one before
        if (elapsed >= settleAt) return ch;
        done = false;
        return CHARSET[Math.floor((elapsed / 45 + i * 7) % CHARSET.length)];
      });
      setShown(out.join(""));
      if (!done) raf = requestAnimationFrame(tick);
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- blank the board, then flip in (browser only)
    setShown(target.replace(/[^ ]/g, " "));
    raf = requestAnimationFrame(tick);
    // Whatever happens to animation frames (background tab, headless capture), land on the real text.
    const settle = setTimeout(() => setShown(target), delay + 260 + target.length * 55 + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [target, delay]);
  return shown;
}

function Cells({ text, width, tone = "ink", delay }: { text: string; width: number; tone?: keyof typeof TONE; delay: number }) {
  const padded = text.toUpperCase().slice(0, width).padEnd(width, " ");
  const shown = useFlap(padded, delay);
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {shown.split("").map((ch, i) => (
        <span key={i} className={`flap-cell ${TONE[tone]}`}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function FlapBoard({ title, status, rows, label }: { title: string; status: { text: string; tone: keyof typeof TONE }; rows: FlapRow[]; label: string }) {
  return (
    <div className="flap-board relative" role="table" aria-label={label}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="label flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span className="live-dot size-1.5 rounded-full bg-lamp" /> {title}
        </span>
        <Cells text={status.text} width={status.text.length} tone={status.tone} delay={150} />
      </div>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2 font-mono text-[10px] tracking-[.14em] text-faint uppercase sm:gap-4" role="row">
        {["Asset", "Side", "$10k cost", "Call"].map((h, i) => (
          <span key={h} role="columnheader" className="flap-col truncate" style={{ ["--n" as string]: rows[0]?.cells[i]?.width ?? 5 }}>
            {h}
          </span>
        ))}
      </div>
      <div className="divide-y divide-line/70">
        {rows.map((r, i) => {
          const content = (
            <span className="flex items-center gap-2 px-4 py-2.5 sm:gap-4" role="row">
              {r.cells.map((c, j) => (
                <span key={j} role="cell" className="sr-only">{c.text}</span>
              ))}
              {r.cells.map((c, j) => (
                <Cells key={`v${j}`} text={c.text} width={c.width} tone={c.tone} delay={400 + i * 260 + j * 90} />
              ))}
            </span>
          );
          return r.href ? (
            <a key={i} href={r.href} className="block transition-colors hover:bg-white/[0.025]">{content}</a>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
