"use client";

import { useState } from "react";
import type { DemoReview, ReviewSummary } from "@/lib/demo-reviews";

function Stars({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex ${className}`} aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-4" aria-hidden>
          <path
            d="M10 1.6l2.47 5.006 5.525.803-3.998 3.897.944 5.503L10 14.21l-4.94 2.597.943-5.503L2.005 7.41l5.525-.803L10 1.6z"
            fill={i < n ? "#B8863B" : "none"}
            stroke={i < n ? "#B8863B" : "#C9C6BE"}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

function ReviewItem({ r }: { r: DemoReview }) {
  return (
    <li className="border-b border-border py-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mauve/15 text-[13px] font-semibold text-mauve">
          {r.initials}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            {r.name}
            {r.verified && (
              <span className="rounded-full bg-grade-a/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-grade-a">
                Verified
              </span>
            )}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <Stars n={r.rating} />
            <span className="text-[12px] font-light text-muted-foreground">{r.date}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[14px] font-semibold text-foreground">{r.title}</p>
      <p className="mt-1 text-[14px] font-light leading-relaxed text-muted-foreground">{r.body}</p>
    </li>
  );
}

/**
 * Customer reviews. Reads a ready-made summary (see lib/demo-reviews) and shows
 * an average, a rating breakdown, and the reviews themselves — the first few,
 * with the rest a click away. Sample content for the preview build, flagged as
 * such in the footnote.
 */
export function Reviews({ summary }: { summary: ReviewSummary }) {
  const [open, setOpen] = useState(false);
  const { reviews, count, average, distribution } = summary;
  const shown = open ? reviews : reviews.slice(0, 4);
  const max = Math.max(...distribution, 1);

  return (
    <section className="mt-12" data-testid="reviews" id="reviews">
      <p className="eyebrow">What people say</p>
      <h2 className="mb-6 mt-1 font-serif text-[28px] font-medium italic tracking-tight">Reviews</h2>

      <div className="grid gap-8 rounded-xl2 border border-border bg-surface p-6 sm:p-8 md:grid-cols-[minmax(0,220px)_1fr]">
        {/* summary */}
        <div className="flex flex-col items-center justify-center border-b border-border pb-6 text-center md:border-b-0 md:border-r md:pb-0 md:pr-8">
          <p className="font-display text-[52px] font-light leading-none text-foreground">{average.toFixed(1)}</p>
          <Stars n={Math.round(average)} className="mt-2" />
          <p className="mt-2 text-[13px] text-muted-foreground">Based on {count} reviews</p>
          <div className="mt-5 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="w-3 tabular-nums">{star}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-[#B8863B]"
                    style={{ width: `${(distribution[star - 1] / max) * 100}%` }}
                  />
                </span>
                <span className="w-4 text-right tabular-nums">{distribution[star - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* the reviews */}
        <div>
          <ul>
            {shown.map((r, i) => (
              <ReviewItem key={i} r={r} />
            ))}
          </ul>
          {count > 4 && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-5 rounded-full border border-border px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-slate"
            >
              {open ? "Show fewer" : `Show all ${count} reviews`}
            </button>
          )}
          <p className="mt-6 text-[12px] font-light italic text-muted-foreground/70">
            Illustrative reviews for this preview build — real customer reviews will replace these at launch.
          </p>
        </div>
      </div>
    </section>
  );
}
