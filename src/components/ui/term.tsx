"use client";

import { useId, useState } from "react";

/** A word with a small plain-language definition: tap or focus to open, Escape or tap away to close. */
export function Term({ children, tip }: { children: React.ReactNode; tip: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="cursor-help border-b border-dotted border-faint text-left hover:border-lamp hover:text-ink"
      >
        {children}
      </button>
      {open && (
        <span id={id} role="tooltip" className="rise absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-line bg-panel-2 p-3 text-xs leading-relaxed font-normal text-soft shadow-[0_20px_40px_-20px_#000]">
          {tip}
        </span>
      )}
    </span>
  );
}
