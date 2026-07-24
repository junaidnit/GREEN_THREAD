"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * A compact, looping demo of what the extension does: it lands on a garment,
 * "reads" the label, and returns a plain verdict. Three samples cycle — two
 * synthetics hiding behind a natural-sounding name, one that is the real
 * thing — so the value reads in a glance without any copy. Purely decorative;
 * the real tool lives in /extension and /analyze.
 */
const SAMPLES = [
  { title: "“Linen-blend” shirt", reading: "62% polyester · 38% linen", verdict: "62% plastic", tone: "plastic" as const },
  { title: "Organic cotton tee", reading: "100% organic cotton", verdict: "100% natural", tone: "natural" as const },
  { title: "“Cashmere-feel” knit", reading: "80% acrylic · 20% nylon", verdict: "100% plastic", tone: "plastic" as const },
];

const TONE: Record<"natural" | "plastic", string> = {
  natural: "bg-grade-a text-white",
  plastic: "bg-[#4B2144] text-white",
};

export function LabelCheckDemo() {
  const [i, setI] = useState(0);
  // "scan" while the lens sweeps the label, "result" once the verdict lands
  const [phase, setPhase] = useState<"scan" | "result">("scan");

  useEffect(() => {
    // scan for ~1.1s, hold the result for ~2.2s, then advance to the next
    const toResult = setTimeout(() => setPhase("result"), 1100);
    const next = setTimeout(() => {
      setPhase("scan");
      setI((v) => (v + 1) % SAMPLES.length);
    }, 3300);
    return () => {
      clearTimeout(toResult);
      clearTimeout(next);
    };
  }, [i]);

  const s = SAMPLES[i];

  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-[380px] select-none rounded-2xl bg-background p-4 text-foreground shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)]"
    >
      {/* faux browser chrome */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[#E4C7C0]" />
        <span className="size-2.5 rounded-full bg-[#E7DEC9]" />
        <span className="size-2.5 rounded-full bg-[#C9D3C4]" />
        <span className="ml-2 truncate text-[11px] font-light text-muted-foreground">
          any-shop.com/product
        </span>
      </div>

      {/* the "label" being read */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface-2 px-4 py-3">
        <p className="text-[13px] font-medium text-foreground">{s.title}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={s.reading + i}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "result" ? 1 : 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-1 text-[12px] font-light tracking-wide text-muted-foreground"
          >
            Composition: {s.reading}
          </motion.p>
        </AnimatePresence>

        {/* the scanning sweep */}
        {phase === "scan" && (
          <motion.div
            key={"scan" + i}
            initial={{ x: "-110%" }}
            animate={{ x: "110%" }}
            transition={{ duration: 1.05, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(157,111,112,.28), transparent)",
            }}
          />
        )}
      </div>

      {/* the verdict */}
      <div className="mt-3 flex h-8 items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          The Fibre Set reads
        </span>
        <AnimatePresence mode="wait">
          {phase === "result" ? (
            <motion.span
              key={s.verdict + i}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold ${TONE[s.tone]}`}
            >
              {s.verdict}
            </motion.span>
          ) : (
            <motion.span
              key={"reading" + i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] font-light italic text-muted-foreground"
            >
              reading the label…
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
