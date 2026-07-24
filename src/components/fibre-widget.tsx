"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface FibreEntry {
  id: string;
  label: string;
  /** benefit one-liner, e.g. "cool & breathable" */
  tagline: string;
  /** how it feels and performs against skin — the buyer-facing benefits */
  benefits: string[];
  image: string | null;
  swatch: string;
}

/**
 * Interactive fibre widget. Pick a fibre and it steps into a spotlight — the
 * selected tile lifts and brightens while the rest recede — and its detail
 * opens right beneath, led by how the fibre FEELS and WEARS (not water or
 * carbon: this section is about the benefit to the person wearing it).
 */
export function FibreWidget({ fibres }: { fibres: FibreEntry[] }) {
  const [active, setActive] = useState(fibres[0]?.id ?? "");
  const sel = fibres.find((f) => f.id === active) ?? fibres[0];

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
        {fibres.map((f) => {
          const on = f.id === active;
          return (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              aria-pressed={on}
              className="group text-center outline-none"
            >
              <div
                className={`relative mx-auto aspect-square w-full overflow-hidden rounded-full border transition-all duration-500 ${
                  on
                    ? "scale-105 border-primary shadow-[0_16px_40px_-16px_rgba(75,33,68,.55)] ring-2 ring-primary/30"
                    : "border-border opacity-70 group-hover:opacity-100"
                }`}
                style={{ background: f.swatch }}
              >
                {f.image && (
                  <Image
                    src={f.image}
                    alt={f.label}
                    fill
                    sizes="120px"
                    className={`object-cover transition-transform duration-700 ${on ? "scale-100" : "scale-100 group-hover:scale-105"}`}
                  />
                )}
              </div>
              <p className={`mt-3 text-[14px] font-medium tracking-wide transition-colors ${on ? "text-primary" : "text-foreground"}`}>
                {f.label}
              </p>
              <p className="mt-0.5 text-[12px] font-light text-muted-foreground">{f.tagline}</p>
            </button>
          );
        })}
      </div>

      {sel && (
        <div
          key={sel.id}
          className="mt-10 grid animate-[fade-up_.4s_ease] gap-8 border-t border-border pt-10 md:grid-cols-[.85fr_1.15fr]"
        >
          {/* the spotlight: the selected fibre, shown large */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface-2 md:aspect-auto md:min-h-[280px]">
            {sel.image && (
              <Image
                src={sel.image}
                alt={sel.label}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            )}
            <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground backdrop-blur">
              {sel.label}
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <p className="eyebrow">The fibre</p>
            <h3 className="mt-2 font-display text-[28px] text-foreground">{sel.label}</h3>
            <p className="mt-1 text-[15px] font-light text-mauve">{sel.tagline}</p>

            {/* what it does for you, as scannable chips */}
            {sel.benefits.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {sel.benefits.map((b) => (
                  <li
                    key={b}
                    className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-medium text-foreground"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/fabric/${sel.id}`}
              className="mt-7 inline-block border-b border-slate pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate transition-colors hover:text-primary"
            >
              Explore {sel.label.toLowerCase()} &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
