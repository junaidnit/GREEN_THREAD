"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface FibreEntry {
  id: string;
  label: string;
  tagline: string;
  note: string;
  stat: string;
  detail: string;
  source: string;
  image: string | null;
  swatch: string;
}

/**
 * Interactive fibre widget, the brief's "most commercially valuable element".
 * A calm grid of fibres; select one and its characteristics unfold in a
 * detail panel, with a route through to the full fibre guide.
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
              className="group text-center"
            >
              <div
                className={`relative mx-auto aspect-square w-full overflow-hidden rounded-full border transition-all ${
                  on ? "border-primary ring-2 ring-primary/25" : "border-border"
                }`}
                style={{ background: f.swatch }}
              >
                {f.image && (
                  <Image
                    src={f.image}
                    alt={f.label}
                    fill
                    sizes="120px"
                    className={`object-cover transition-opacity ${on ? "opacity-100" : "opacity-85 group-hover:opacity-100"}`}
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
        <div key={sel.id} className="mt-10 grid animate-[fade-up_.4s_ease] gap-8 border-t border-border pt-10 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">The fibre</p>
            <h3 className="mt-2 font-display text-[28px] text-foreground">{sel.label}</h3>
            <p className="mt-4 text-[16px] font-light leading-relaxed text-muted-foreground">{sel.note}</p>
            <Link
              href={`/fabric/${sel.id}`}
              className="mt-6 inline-block border-b border-slate pb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate transition-colors hover:text-primary"
            >
              Explore {sel.label.toLowerCase()} →
            </Link>
          </div>
          <div className="flex flex-col justify-center rounded-sm border-l-2 border-primary bg-surface p-7">
            <p className="font-display text-[28px] text-primary">{sel.stat}</p>
            <p className="mt-3 text-[16px] font-light leading-relaxed text-muted-foreground">{sel.detail}</p>
            <p className="mt-4 text-[12px] font-light italic text-muted-foreground/80">, {sel.source}</p>
          </div>
        </div>
      )}
    </div>
  );
}
