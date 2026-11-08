"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `value` once it scrolls into view. Renders the final value on the server and for reduced motion. */
export function CountUp({ value, prefix = "", suffix = "", decimals = 0, duration = 1100, className }: { value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number; className?: string }) {
  const format = (n: number) => `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / duration);
        setShown(value * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        run();
      }
    });
    setShown(0); // start from zero only once JS can animate it
    io.observe(el);
    // Whatever happens to animation frames (background tabs, headless renderers, screenshots), land on the real value.
    const settle = setTimeout(() => setShown(value), duration + 400);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [value, duration]);
  return (
    <span ref={ref} className={className}>
      {format(shown)}
    </span>
  );
}
