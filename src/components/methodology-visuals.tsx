"use client";

import { motion } from "framer-motion";

/** Animated stacked bar: the four score components building toward 100. */
export function ScoreAnatomy() {
  const parts = [
    { label: "Fibre", max: 70, color: "var(--grade-a)" },
    { label: "Certs", max: 15, color: "var(--grade-b)" },
    { label: "Practices", max: 9, color: "var(--grade-c)" },
    { label: "Brand", max: 6, color: "var(--primary)" },
  ];
  return (
    <div className="mt-6">
      <div className="flex h-16 w-full overflow-hidden rounded-2xl border border-border">
        {parts.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: `${p.max}%`, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 + i * 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center text-white"
            style={{ background: p.color }}
          >
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-90">{p.label}</span>
            <span className="font-display text-sm font-bold">{p.max}</span>
          </motion.div>
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.4 }}
        className="mt-2 text-center font-display text-sm font-bold"
      >
        = 100 points, every one accounted for
      </motion.p>
    </div>
  );
}

/** Grade spectrum: a smooth gradient band with animated grade markers. */
export function GradeSpectrum() {
  const grades = [
    { g: "A", from: 80, color: "var(--grade-a)" },
    { g: "B", from: 65, color: "var(--grade-b)" },
    { g: "C", from: 50, color: "var(--grade-c)" },
    { g: "D", from: 35, color: "var(--grade-d)" },
    { g: "E", from: 0, color: "var(--grade-e)" },
  ];
  return (
    <div className="mt-4">
      <div
        className="h-3 w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--grade-e) 0%, var(--grade-d) 30%, var(--grade-c) 52%, var(--grade-b) 72%, var(--grade-a) 90%)",
        }}
      />
      <div className="mt-2 flex justify-between">
        {[...grades].reverse().map((x, i) => (
          <motion.div
            key={x.g}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center"
          >
            <span
              className="flex size-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: x.color }}
            >
              {x.g}
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground">{x.from}+</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Fibre ranking bars that fill on scroll. */
export function FibreRanking({
  materials,
  labels,
  notes,
}: {
  materials: Array<[string, number]>;
  labels: Record<string, string>;
  notes: Record<string, string>;
}) {
  return (
    <div className="mt-4 space-y-1.5">
      {materials.map(([m, score], i) => {
        const color =
          score >= 8 ? "var(--grade-a)" : score >= 6.5 ? "var(--grade-b)" : score >= 4.5 ? "var(--grade-c)" : score >= 3 ? "var(--grade-d)" : "var(--grade-e)";
        return (
          <motion.div
            key={m}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.5) }}
            className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2"
            title={notes[m]}
          >
            <span className="w-32 shrink-0 text-sm font-medium sm:w-40">{labels[m]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${score * 10}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.1 + Math.min(i * 0.04, 0.5), ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-display text-sm font-bold">{score}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
