"use client";

import { useEffect, useState } from "react";

/**
 * Global niceties: press "/" anywhere to focus search; a quiet
 * back-to-top pill appears after a long scroll.
 */
export function PageExtras() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      const box = document.querySelector<HTMLInputElement>(
        '[data-testid="search-input"], [data-testid="home-search-input"], [data-testid="analyze-input"]',
      );
      if (box) {
        e.preventDefault();
        box.focus();
      }
    };
    const onScroll = () => setShowTop(window.scrollY > 1500);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!showTop) return null;
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 left-5 z-40 flex size-10 items-center justify-center rounded-full border border-border bg-surface/90 text-[20px] shadow-lg backdrop-blur transition-transform hover:scale-105"
    >
      ↑
    </button>
  );
}
