"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/icons";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
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
