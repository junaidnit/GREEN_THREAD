"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { MaterialId, Product } from "@/lib/types";
import {
  applyFilters,
  buildIndex,
  EMPTY_FILTERS,
  facetCounts,
  filtersToParams,
  paramsToFilters,
  type Filters,
} from "@/lib/search";
import { MATERIAL_LABELS } from "@/lib/scoring";
import { titleCase } from "@/lib/format";
import { ProductCard } from "./product-card";
import { ChevronDown, Search, SlidersHorizontal, X } from "./icons";

const FABRIC_ORDER: MaterialId[] = [
  "organic_cotton", "linen", "hemp", "tencel_lyocell", "modal",
  "recycled_cotton", "recycled_polyester", "recycled_polyamide",
  "merino_wool", "recycled_wool", "cupro", "peace_silk", "viscose",
  "bci_cotton", "conventional_cotton", "polyester", "elastane",
];

export function SearchExperience({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => paramsToFilters(new URLSearchParams(searchParams)));
  const [panelOpen, setPanelOpen] = useState(false);
  const index = useMemo(() => buildIndex(products), [products]);

  // Debounced URL sync (shareable links + back button, no history spam).
  // Skips when the URL already matches — a redundant replace can race and
  // cancel an in-flight navigation (e.g. clicking through to a product).
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const qs = filtersToParams(filters).toString();
    const current = new URLSearchParams(window.location.search);
    current.sort();
    const next = new URLSearchParams(qs);
    next.sort();
    if (next.toString() === current.toString()) return;

    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, [filters, pathname, router]);

  const results = useMemo(() => applyFilters(products, filters, index), [products, filters, index]);
  const counts = useMemo(() => facetCounts(products, filters, index), [products, filters, index]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const toggleIn = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const activeCount =
    filters.fabrics.length + filters.certs.length + filters.categories.length +
    (filters.gender ? 1 : 0) + (filters.maxPrice != null ? 1 : 0) + (filters.minScore != null ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* search bar */}
      <div className="sticky top-16 z-30 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-full border border-border bg-surface px-4 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              data-testid="search-input"
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search linen shirts, hemp jackets, organic tees…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {filters.q && (
              <button aria-label="Clear search" onClick={() => set("q", "")}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </label>
          <button
            data-testid="filters-toggle"
            onClick={() => setPanelOpen((o) => !o)}
            className={`flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
              panelOpen || activeCount > 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface hover:bg-surface-2"
            }`}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{activeCount}</span>
            )}
          </button>
        </div>

        {/* fabric chips — the first-class filter */}
        <div className="scrollbar-hide -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1" data-testid="fabric-chips">
          {FABRIC_ORDER.filter((m) => (counts.fabrics.get(m) ?? 0) > 0 || filters.fabrics.includes(m)).map((m) => {
            const active = filters.fabrics.includes(m);
            return (
              <button
                key={m}
                data-testid={`fabric-chip-${m}`}
                onClick={() => set("fabrics", toggleIn(filters.fabrics, m))}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
              >
                {MATERIAL_LABELS[m]}
                <span className={active ? "opacity-80" : "text-muted-foreground"}>
                  {counts.fabrics.get(m) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* expandable facet panel */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid gap-5 rounded-xl2 border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
                <FacetGroup title="Certification">
                  {[...counts.certs.entries()].sort((a, b) => b[1] - a[1]).map(([cert, n]) => (
                    <FacetCheck
                      key={cert}
                      label={cert}
                      count={n}
                      checked={filters.certs.includes(cert)}
                      onChange={() => set("certs", toggleIn(filters.certs, cert))}
                    />
                  ))}
                </FacetGroup>
                <FacetGroup title="Category">
                  {[...counts.categories.entries()].sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
                    <FacetCheck
                      key={cat}
                      label={titleCase(cat)}
                      count={n}
                      checked={filters.categories.includes(cat)}
                      onChange={() => set("categories", toggleIn(filters.categories, cat))}
                    />
                  ))}
                </FacetGroup>
                <FacetGroup title="Shopping for">
                  {["women", "men", "unisex"].map((g) => (
                    <FacetCheck
                      key={g}
                      label={titleCase(g)}
                      checked={filters.gender === g}
                      onChange={() => set("gender", filters.gender === g ? null : g)}
                    />
                  ))}
                </FacetGroup>
                <FacetGroup title="Score & price">
                  <label className="block text-xs text-muted-foreground">
                    Minimum score: <b className="text-foreground">{filters.minScore ?? 0}</b>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={5}
                      value={filters.minScore ?? 0}
                      onChange={(e) => set("minScore", Number(e.target.value) || null)}
                      className="mt-1 w-full accent-(--primary)"
                    />
                  </label>
                  <label className="block text-xs text-muted-foreground">
                    Max price: <b className="text-foreground">{filters.maxPrice ? `₹${filters.maxPrice}` : "any"}</b>
                    <input
                      type="range"
                      min={1000}
                      max={14000}
                      step={500}
                      value={filters.maxPrice ?? 14000}
                      onChange={(e) => set("maxPrice", Number(e.target.value) >= 14000 ? null : Number(e.target.value))}
                      className="mt-1 w-full accent-(--primary)"
                    />
                  </label>
                </FacetGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* results header */}
      <div className="flex items-center justify-between py-4">
        <p className="text-sm text-muted-foreground" data-testid="results-count">
          <b className="text-foreground">{results.length}</b> {results.length === 1 ? "item" : "items"}
          {filters.q && <> for “{filters.q}”</>}
        </p>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort })}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
          <label className="relative">
            <select
              data-testid="sort-select"
              value={filters.sort}
              onChange={(e) => set("sort", e.target.value as Filters["sort"])}
              className="appearance-none rounded-full border border-border bg-surface py-1.5 pl-3 pr-8 text-xs font-medium outline-none hover:bg-surface-2"
            >
              <option value="relevance">Most relevant</option>
              <option value="score">Highest sustainability</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          </label>
        </div>
      </div>

      {/* results grid */}
      {results.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {results.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.02, 0.2), ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard product={p} priority={i < 4} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-xl2 border border-dashed border-border py-20 text-center" data-testid="empty-state">
          <p className="font-display text-lg font-semibold">Nothing matches — yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Try fewer filters, or ask the concierge for something specific — it knows the whole catalog.
          </p>
        </div>
      )}
    </div>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FacetCheck({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded accent-(--primary)"
      />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-xs text-muted-foreground">{count}</span>}
    </label>
  );
}
