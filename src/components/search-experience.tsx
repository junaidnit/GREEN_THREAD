"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { CatalogCard, MaterialId } from "@/lib/types";
import {
  applyFilters,
  buildIndex,
  closestMatches,
  EMPTY_FILTERS,
  facetCounts,
  filtersToParams,
  paramsToFilters,
  type FacetCounts,
  type Filters,
} from "@/lib/search";
import { MATERIAL_LABELS } from "@/lib/scoring";
import { FIBRE_CLASS, MATERIAL_FACTS, type FibreClass } from "@/lib/materials";
import { titleCase } from "@/lib/format";
import { ProductCard } from "./product-card";
import { ChevronDown, Leaf, Search, SlidersHorizontal, X } from "./icons";

const FIBRE_GROUPS: Array<{ class: FibreClass; label: string; blurb: string }> = [
  { class: "natural", label: "Natural fibres", blurb: "grown, not made" },
  { class: "regenerated", label: "Regenerated", blurb: "wood & waste, reborn" },
  { class: "synthetic", label: "Synthetics", blurb: "incl. recycled" },
];

const COLOR_SWATCHES: Record<string, string> = {
  "Black": "#23231f",
  "White & Cream": "#f4efe4",
  "Grey": "#9aa0a0",
  "Blue": "#4a6fa5",
  "Green": "#5c7c5e",
  "Brown & Tan": "#a58a68",
  "Pink & Purple": "#c08bb2",
  "Red & Orange": "#c0563e",
  "Yellow": "#d9b23a",
  "Multi": "conic-gradient(#c0563e,#d9b23a,#5c7c5e,#4a6fa5,#c08bb2,#c0563e)",
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "W26", "W28", "W30", "W32", "W34", "W36", "One size"];
const FIT_ORDER = ["Regular", "Slim", "Relaxed", "Oversized", "Wide"];
const PAGE_SIZE = 24;

export function SearchExperience({ products }: { products: CatalogCard[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => paramsToFilters(new URLSearchParams(searchParams)));
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const brandNames = useMemo(
    () => new Map(products.map((p) => [p.brand.slug, p.brand.name])),
    [products],
  );

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  /* infinite scroll: render PAGE_SIZE at a time, grow when sentinel is visible */
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const filterKey = filtersToParams(filters).toString();
  useEffect(() => setVisible(PAGE_SIZE), [filterKey]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible((v) => v + PAGE_SIZE);
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [results.length]);
  /* never show the same photo twice in a row — swap forward when adjacent
     cards share an image (demo pools repeat; real feeds won't) */
  const shown = useMemo(() => {
    const list = results.slice(0, visible);
    for (let i = 1; i < list.length; i++) {
      if (list[i].image_url === list[i - 1].image_url) {
        const j = list.findIndex((p, k) => k > i && p.image_url !== list[i - 1].image_url);
        if (j > i) [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }, [results, visible]);
  const animate = results.length <= 60; // keep motion silky on small sets, instant on big ones

  const avgScore = useMemo(
    () =>
      results.length
        ? Math.round(results.reduce((s, p) => s + p.sustainability.score, 0) / results.length)
        : 0,
    [results],
  );

  const [copied, setCopied] = useState(false);
  const nearMisses = useMemo(
    () => (results.length === 0 && filters.q.trim() ? closestMatches(products, filters.q, index) : []),
    [results.length, filters.q, products, index],
  );

  const activeCount =
    filters.fabrics.length + filters.brands.length + filters.sizes.length +
    filters.colors.length + filters.fits.length + filters.certs.length + filters.categories.length +
    (filters.gender ? 1 : 0) + (filters.maxPrice != null ? 1 : 0) + (filters.minScore != null ? 1 : 0);

  /* refinement banner: invite (not force) narrowing after a broad search */
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showBanner =
    !bannerDismissed &&
    results.length > 30 &&
    (filters.q.trim().length > 0 || filters.categories.length > 0) &&
    !filters.gender && filters.fits.length === 0 &&
    filters.sizes.length === 0 && filters.colors.length === 0;

  const clearAll = () => setFilters({ ...EMPTY_FILTERS, q: filters.q, sort: filters.sort });

  const sidebar = (
    <FilterSidebar
      filters={filters}
      counts={counts}
      brandNames={brandNames}
      set={set}
      activeCount={activeCount}
      clearAll={clearAll}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* search bar row */}
      <div className="sticky top-16 z-30 -mx-4 bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-full border border-border bg-surface px-4 shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              data-testid="search-input"
              value={filters.q}
              onChange={(e) => {
                const v = e.target.value;
                // pasted a product link? hand off to Fabric Check
                if (/^https?:\/\/\S+\.\S+/i.test(v.trim())) {
                  router.push(`/analyze?url=${encodeURIComponent(v.trim())}`);
                  return;
                }
                set("q", v);
              }}
              placeholder="Search tops, linen shirts — or paste a product link…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
            {filters.q && (
              <button aria-label="Clear search" onClick={() => set("q", "")}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </label>
          {/* mobile filter drawer trigger */}
          <button
            data-testid="filters-toggle"
            onClick={() => setDrawerOpen(true)}
            className={`flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors lg:hidden ${
              activeCount > 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface hover:bg-surface-2"
            }`}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
        {/* desktop sidebar */}
        <aside className="hidden lg:block" data-testid="filter-sidebar">
          <div className="sticky top-[7.5rem] max-h-[calc(100vh-8.5rem)] space-y-5 overflow-y-auto pb-8 pr-1">
            {sidebar}
          </div>
        </aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] overflow-y-auto bg-background p-5 shadow-2xl lg:hidden"
                data-testid="filter-drawer"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display font-bold">Filters</p>
                  <button aria-label="Close filters" onClick={() => setDrawerOpen(false)}>
                    <X className="size-5" />
                  </button>
                </div>
                <div className="space-y-5 pb-10">{sidebar}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* results */}
        <div>
          <AnimatePresence>
            {showBanner && (
              <RefinementBanner
                counts={counts}
                onPick={set}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}
          </AnimatePresence>
          <div className="flex items-center justify-between py-4">
            <p className="text-sm text-muted-foreground" data-testid="results-count">
              <b className="text-foreground">{results.length}</b> {results.length === 1 ? "item" : "items"}
              {filters.q && <> for “{filters.q}”</>}
              {results.length > 1 && (
                <span className="ml-2 hidden text-xs sm:inline" title="Average sustainability score of everything matching your filters">
                  · avg score <b className="text-foreground">{avgScore}</b>
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {(activeCount > 0 || filters.q) && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    });
                  }}
                  className="hidden text-xs font-medium text-muted-foreground underline-offset-2 hover:underline sm:block"
                  title="Copy a link to exactly this search + filters"
                >
                  {copied ? "Copied ✓" : "Share this search"}
                </button>
              )}
              {activeCount > 0 && (
                <button
                  onClick={clearAll}
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

          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {shown.map((p, i) =>
                  animate ? (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i * 0.02, 0.2), ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ProductCard product={p} priority={i < 6} />
                    </motion.div>
                  ) : (
                    <ProductCard key={p.id} product={p} priority={i < 6} />
                  ),
                )}
              </div>
              {visible < results.length && (
                <div ref={sentinelRef} className="grid grid-cols-2 gap-3 py-6 sm:gap-5 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton aspect-[3/4] rounded-xl2" />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl2 border border-dashed border-border px-4 py-14 text-center" data-testid="empty-state">
              <p className="font-display text-lg font-semibold">Nothing matches — yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Try fewer filters, or ask the concierge for something specific — it knows the whole catalog.
              </p>
              {nearMisses.length > 0 && (
                <div className="mt-8 text-left">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Closest matches
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="closest-matches">
                    {nearMisses.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ sidebar ═══════════════ */

function FilterSidebar({
  filters,
  counts,
  brandNames,
  set,
  activeCount,
  clearAll,
}: {
  filters: Filters;
  counts: FacetCounts;
  brandNames: Map<string, string>;
  set: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  activeCount: number;
  clearAll: () => void;
}) {
  const toggleIn = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <>
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="w-full rounded-full border border-border py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-2"
        >
          Clear all filters ({activeCount})
        </button>
      )}

      {/* ── NATURAL FABRIC — the top-most, hero filter ── */}
      <section
        data-testid="fabric-filter"
        className="rounded-xl2 border border-primary/25 bg-accent/40 p-4"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="size-3.5" />
          </span>
          <h3 className="font-display text-sm font-bold">Fabric first</h3>
        </div>
        <p className="mb-3 text-[11px] text-muted-foreground">What it&apos;s made of is everything.</p>

        {FIBRE_GROUPS.map((group) => {
          const materials = (Object.keys(MATERIAL_LABELS) as MaterialId[]).filter(
            (m) =>
              FIBRE_CLASS[m] === group.class &&
              ((counts.fabrics.get(m) ?? 0) > 0 || filters.fabrics.includes(m)),
          );
          if (materials.length === 0) return null;
          return (
            <div key={group.class} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {group.label} <span className="font-normal normal-case text-muted-foreground">— {group.blurb}</span>
              </p>
              <div className="space-y-1">
                {materials.map((m) => (
                  <FabricRow
                    key={m}
                    material={m}
                    count={counts.fabrics.get(m) ?? 0}
                    checked={filters.fabrics.includes(m)}
                    onToggle={() => set("fabrics", toggleIn(filters.fabrics, m))}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Brand ── */}
      <FilterGroup title="Brand" testId="brand-filter">
        {[...counts.brands.entries()]
          .sort((a, b) => (brandNames.get(a[0]) ?? "").localeCompare(brandNames.get(b[0]) ?? ""))
          .map(([slug, n]) => (
            <FacetCheck
              key={slug}
              testId={`brand-${slug}`}
              label={brandNames.get(slug) ?? slug}
              count={n}
              checked={filters.brands.includes(slug)}
              onChange={() => set("brands", toggleIn(filters.brands, slug))}
            />
          ))}
      </FilterGroup>

      {/* ── Category ── */}
      <FilterGroup title="Category">
        {[...counts.categories.entries()].sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
          <FacetCheck
            key={cat}
            label={titleCase(cat)}
            count={n}
            checked={filters.categories.includes(cat)}
            onChange={() => set("categories", toggleIn(filters.categories, cat))}
          />
        ))}
      </FilterGroup>

      {/* ── Size ── */}
      <FilterGroup title="Size" testId="size-filter">
        <div className="flex flex-wrap gap-1.5">
          {SIZE_ORDER.filter((s) => (counts.sizes.get(s) ?? 0) > 0 || filters.sizes.includes(s)).map((s) => {
            const active = filters.sizes.includes(s);
            return (
              <button
                key={s}
                data-testid={`size-${s.replace(" ", "-")}`}
                onClick={() => set("sizes", toggleIn(filters.sizes, s))}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                {s} <span className={active ? "opacity-75" : "text-muted-foreground"}>{counts.sizes.get(s) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* ── Fit ── */}
      <FilterGroup title="Fit" testId="fit-filter">
        <div className="flex flex-wrap gap-1.5">
          {FIT_ORDER.filter((f) => (counts.fits.get(f) ?? 0) > 0 || filters.fits.includes(f)).map((f) => {
            const active = filters.fits.includes(f);
            return (
              <button
                key={f}
                data-testid={`fit-${f}`}
                onClick={() => set("fits", toggleIn(filters.fits, f))}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface hover:border-primary/40"
                }`}
              >
                {f} <span className={active ? "opacity-75" : "text-muted-foreground"}>{counts.fits.get(f) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* ── Colour ── */}
      <FilterGroup title="Colour" testId="color-filter">
        {[...counts.colors.entries()].sort((a, b) => b[1] - a[1]).map(([fam, n]) => {
          const sw = COLOR_SWATCHES[fam] ?? "#999";
          return (
            <label key={fam} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.colors.includes(fam)}
                onChange={() => set("colors", toggleIn(filters.colors, fam))}
                className="size-4 rounded accent-(--primary)"
              />
              <span
                aria-hidden
                className="inline-block size-3.5 rounded-full border border-black/10"
                style={{ background: sw }}
              />
              <span className="flex-1">{fam}</span>
              <span className="text-xs text-muted-foreground">{n}</span>
            </label>
          );
        })}
      </FilterGroup>

      {/* ── Price ── */}
      <FilterGroup title="Price">
        <label className="block text-xs text-muted-foreground">
          Up to: <b className="text-foreground">{filters.maxPrice ? `£${filters.maxPrice}` : "any"}</b>
          <input
            type="range"
            data-testid="max-price-slider"
            min={10}
            max={150}
            step={5}
            value={filters.maxPrice ?? 150}
            onChange={(e) => set("maxPrice", Number(e.target.value) >= 150 ? null : Number(e.target.value))}
            className="mt-1 w-full accent-(--primary)"
          />
        </label>
      </FilterGroup>

      {/* ── Sustainability ── */}
      <FilterGroup title="Sustainability score">
        <label className="block text-xs text-muted-foreground">
          Minimum: <b className="text-foreground">{filters.minScore ?? 0}</b>/100
          <input
            type="range"
            data-testid="min-score-slider"
            min={0}
            max={90}
            step={5}
            value={filters.minScore ?? 0}
            onChange={(e) => set("minScore", Number(e.target.value) || null)}
            className="mt-1 w-full accent-(--primary)"
          />
        </label>
        <div className="space-y-1.5 pt-2">
          {[...counts.certs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([cert, n]) => (
            <FacetCheck
              key={cert}
              label={cert}
              count={n}
              checked={filters.certs.includes(cert)}
              onChange={() => set("certs", toggleIn(filters.certs, cert))}
            />
          ))}
        </div>
      </FilterGroup>

      {/* ── Shopping for ── */}
      <FilterGroup title="Shopping for">
        {["women", "men", "unisex"].map((g) => (
          <FacetCheck
            key={g}
            label={titleCase(g)}
            checked={filters.gender === g}
            onChange={() => set("gender", filters.gender === g ? null : g)}
          />
        ))}
      </FilterGroup>
    </>
  );
}

function FabricRow({
  material,
  count,
  checked,
  onToggle,
}: {
  material: MaterialId;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  const [factOpen, setFactOpen] = useState(false);
  const fact = MATERIAL_FACTS[material];
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            data-testid={`fabric-${material}`}
            checked={checked}
            onChange={onToggle}
            className="size-4 rounded accent-(--primary)"
          />
          <span className="flex-1">{MATERIAL_LABELS[material]}</span>
          <span className="text-xs text-muted-foreground">{count}</span>
        </label>
        {fact && (
          <button
            aria-label={`About ${MATERIAL_LABELS[material]}`}
            onClick={() => setFactOpen((o) => !o)}
            className={`flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
              factOpen ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-primary"
            }`}
          >
            i
          </button>
        )}
      </div>
      <AnimatePresence>
        {factOpen && fact && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-1.5 rounded-lg border-l-2 border-primary bg-surface p-2.5">
              <p className="font-display text-xs font-bold text-primary">{fact.stat}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{fact.detail}</p>
              <p className="mt-1 text-[10px] italic text-muted-foreground">— {fact.source}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Post-search refinement strip — an invitation, never a gate. Results stay
 * visible underneath; one tap applies a filter and the strip slides away.
 */
function RefinementBanner({
  counts,
  onPick,
  onDismiss,
}: {
  counts: FacetCounts;
  onPick: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onDismiss: () => void;
}) {
  const topColors = [...counts.colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const fits = FIT_ORDER.filter((f) => (counts.fits.get(f) ?? 0) > 0);
  const sizes = SIZE_ORDER.filter((s) => (counts.sizes.get(s) ?? 0) > 0).slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      data-testid="refine-banner"
      className="mt-4 overflow-hidden rounded-xl2 border border-primary/20 bg-[linear-gradient(120deg,var(--accent),var(--surface))] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold">Lots of great matches — make it yours</p>
          <p className="mt-0.5 text-xs text-muted-foreground">One tap to narrow down. Or just keep scrolling.</p>
        </div>
        <button aria-label="Dismiss refinements" onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="scrollbar-hide mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {/* gender */}
        {(["women", "men"] as const).map((g) => (
          <button
            key={g}
            data-testid={`refine-${g}`}
            onClick={() => onPick("gender", g)}
            className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all hover:border-primary hover:text-primary"
          >
            {g === "women" ? "For her" : "For him"}
          </button>
        ))}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        {/* fit */}
        {fits.map((f) => (
          <button
            key={f}
            data-testid={`refine-fit-${f}`}
            onClick={() => onPick("fits", [f])}
            className="shrink-0 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-primary hover:text-primary"
          >
            {f} fit
          </button>
        ))}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        {/* sizes */}
        {sizes.map((s) => (
          <button
            key={s}
            data-testid={`refine-size-${s.replace(" ", "-")}`}
            onClick={() => onPick("sizes", [s])}
            className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-primary hover:text-primary"
          >
            {s}
          </button>
        ))}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        {/* colours */}
        {topColors.map(([fam]) => {
          const sw = COLOR_SWATCHES[fam] ?? "#999";
          return (
            <button
              key={fam}
              data-testid={`refine-color-${fam.replaceAll(" ", "-")}`}
              onClick={() => onPick("colors", [fam])}
              title={fam}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-primary hover:text-primary"
            >
              <span className="inline-block size-3 rounded-full border border-black/10" style={{ background: sw }} />
              {fam}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function FilterGroup({
  title,
  children,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section data-testid={testId} className="rounded-xl2 border border-border bg-surface p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function FacetCheck({
  label,
  count,
  checked,
  onChange,
  testId,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  testId?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        data-testid={testId}
        checked={checked}
        onChange={onChange}
        className="size-4 rounded accent-(--primary)"
      />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-xs text-muted-foreground">{count}</span>}
    </label>
  );
}
