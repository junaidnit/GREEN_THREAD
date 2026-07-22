"use client";

import { motion } from "framer-motion";

const GRADE_VAR: Record<string, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  E: "var(--grade-e)",
};

export function ScoreDial({ score, grade }: { score: number; grade: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const target = c * (1 - score / 100);
  const color = GRADE_VAR[grade] ?? "var(--primary)";

  return (
    <div className="relative size-36" data-testid="score-dial" aria-label={`Sustainability score ${score} out of 100, grade ${grade}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: target }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[28px] font-bold leading-none">{score}</span>
        <span className="mt-1 text-xs font-medium text-muted-foreground">grade {grade}</span>
      </div>
    </div>
  );
}
