"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { id: "problem", label: "Why" },
  { id: "how", label: "How" },
  { id: "board", label: "Board" },
  { id: "api", label: "API" },
  { id: "faq", label: "FAQ" },
];

/** Section links with index numbers; on the home page the section you're reading lights up. */
export function NavLinks() {
  const path = usePathname();
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (path !== "/") return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // The last section whose heading has passed 40% of the way down the screen.
      let best: string | null = null;
      for (const l of LINKS) {
        const el = document.getElementById(l.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) best = l.id;
      }
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [path]);

  return (
    <nav className="hidden items-center md:flex" aria-label="Sections">
      {LINKS.map((l, i) => {
        const on = active === l.id;
        return (
          <Link
            key={l.id}
            href={`/#${l.id}`}
            aria-current={on ? "location" : undefined}
            className={`group relative flex items-baseline gap-1.5 px-3 py-2 font-mono text-[11.5px] tracking-[.14em] uppercase transition-colors ${on ? "text-ink" : "text-soft hover:text-ink"}`}
          >
            <span className={`text-[9.5px] transition-colors ${on ? "text-lamp" : "text-faint group-hover:text-lamp"}`}>{String(i + 1).padStart(2, "0")}</span>
            {l.label}
            <span className={`absolute inset-x-3 -bottom-[15px] h-px origin-left bg-lamp transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
