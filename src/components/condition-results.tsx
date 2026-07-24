"use client";

import { useMemo, useState } from "react";
import type { CatalogCard } from "@/lib/types";
import { ProductCard } from "./product-card";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "W26", "W28", "W30", "W32", "W34", "W36", "One size"];

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The results half of a condition page. The condition's exclusions are shown
 * as a LOCKED filter — visible, explained, and impossible to switch off,
 * because the whole point of the page is that these fibres are unsafe here.
 * On top of that the shopper gets ordinary size and gender filters to narrow
 * the safe set.
 */
export function ConditionResults({
  products,
  lockedFibres,
  conditionName,
}: {
  products: CatalogCard[];
  lockedFibres: string[];
  conditionName: string;
}) {
  const [gender, setGender] = useState<"women" | "men" | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);

  const availableSizes = useMemo(
    () => SIZE_ORDER.filter((s) => products.some((p) => p.sizes.includes(s))),
    [products],
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (gender && p.gender !== gender && p.gender !== "unisex") return false;
        if (sizes.length > 0 && !sizes.some((s) => p.sizes.includes(s))) return false;
        return true;
      }),
    [products, gender, sizes],
  );

  const toggleSize = (s: string) =>
    setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <div data-testid="condition-results">
      {/* LOCKED filter — the exclusions that define this edit, un-switchable */}
      {lockedFibres.length > 0 && (
        <div className="mb-6 rounded-xl2 border border-grade-d/25 bg-grade-d/[0.06] p-4 sm:p-5" data-testid="locked-filter">
          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-grade-d">
            <LockIcon className="size-3.5" />
            Locked for {conditionName}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            These fibres are excluded from every result on this page and can&apos;t be turned on.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lockedFibres.map((f) => (
              <span
                key={f}
                aria-disabled
                title={`${f} is excluded for ${conditionName} and cannot be enabled`}
                className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-grade-d/30 bg-surface px-3 py-1.5 text-[13px] font-semibold text-grade-d opacity-90"
              >
                <LockIcon className="size-3" />
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* adjustable filters: gender + size */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">For</span>
          <div className="flex gap-1.5">
            {([["All", null], ["Women", "women"], ["Men", "men"]] as const).map(([label, val]) => {
              const active = gender === val;
              return (
                <button
                  key={label}
                  data-testid={`cond-gender-${label.toLowerCase()}`}
                  onClick={() => setGender(val)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {availableSizes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Size</span>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((s) => {
                const active = sizes.includes(s);
                return (
                  <button
                    key={s}
                    data-testid={`cond-size-${s.replace(" ", "-")}`}
                    onClick={() => toggleSize(s)}
                    aria-pressed={active}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(gender || sizes.length > 0) && (
          <button
            onClick={() => {
              setGender(null);
              setSizes([]);
            }}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        <b className="text-foreground">{filtered.length}</b> {filtered.length === 1 ? "piece" : "pieces"} qualify
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {filtered.slice(0, 48).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl2 border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
          No pieces match those filters. Try clearing the size or gender.
        </p>
      )}
    </div>
  );
}
