"use client";

import { motion } from "framer-motion";
import type { ScoreFactor } from "@/lib/types";

/** Max points per factor group — turns numbers into visual fill levels. */
function maxFor(label: string): number {
  if (label === "Fibre composition") return 70;
  if (label === "Certifications") return 15;
  if (label === "Brand practices") return 6;
  return 6; // individual practice bonuses
}

/**
 * The "why this score" breakdown as animated fill bars instead of text rows —
 * each factor's weight is something you see, not read.
 */
export function ScoreFactors({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="mt-5 space-y-3" data-testid="score-factors">
      {factors.map((f, i) => {
        const pct = Math.max(4, Math.min(100, (f.points / maxFor(f.label)) * 100));
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group rounded-lg bg-surface-2 px-4 py-2.5"
            title={f.detail}
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium">{f.label}</p>
              <span className={`shrink-0 font-display text-sm font-bold ${f.points >= 0 ? "text-grade-a" : "text-grade-e"}`}>
                {f.points >= 0 ? "+" : ""}{f.points}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            {/* detail appears on hover — information on demand, not by default */}
            <p className="mt-1.5 hidden text-xs text-muted-foreground group-hover:block">{f.detail}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
