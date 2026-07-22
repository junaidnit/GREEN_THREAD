"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The homepage's primary action, search a fibre/garment, or paste a product
 * link to check its label. A pasted URL routes to Fabric Check; anything else
 * searches the catalogue.
 */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    if (/^https?:\/\//i.test(t)) router.push(`/analyze?url=${encodeURIComponent(t)}`);
    else router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex items-center gap-2 border-b border-foreground/25 pb-2 focus-within:border-primary">
        <svg viewBox="0 0 20 20" className="size-5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="home-search-input"
          placeholder="Search a fibre, or paste a product link"
          aria-label="Search or paste a product link"
          className="flex-1 bg-transparent py-1 text-[16px] font-light text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <button type="submit" className="rounded-full bg-primary px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-opacity hover:opacity-90">
          Search
        </button>
      </div>
      <p className="mt-2 text-[12px] font-light text-muted-foreground">
        Free to check any label, on our pieces or anywhere else you shop.
      </p>
    </form>
  );
}
