"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "./icons";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        // pasted a product link? send it to Fabric Check instead of search
        if (/^https?:\/\//i.test(t)) {
          router.push(`/analyze?url=${encodeURIComponent(t)}`);
          return;
        }
        router.push(t ? `/search?q=${encodeURIComponent(t)}` : "/search");
      }}
      className="mx-auto flex h-14 max-w-xl items-center gap-3 rounded-full border border-border bg-surface px-5 shadow-lg shadow-black/[0.04] transition-shadow focus-within:ring-2 focus-within:ring-ring"
    >
      <Search className="size-5 shrink-0 text-muted-foreground" />
      <input
        data-testid="home-search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Try “linen shirt”, or paste any product link…"
        className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        autoComplete="off"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95"
      >
        Search
      </button>
    </form>
  );
}
