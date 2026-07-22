"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@/components/icons";

/**
 * Reads the current theme straight from the <html> class via
 * useSyncExternalStore, the React-blessed way to consume client-only
 * external state. No setState-in-effect, and the server snapshot (light)
 * matches the pre-hydration markup, so there's no hydration flash.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDark = () => document.documentElement.classList.contains("dark");
const noopSubscribe = () => () => {};

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  // true only after client hydration; keeps SSR/CSR markup identical
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("gt-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className="ml-1 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {mounted && dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
