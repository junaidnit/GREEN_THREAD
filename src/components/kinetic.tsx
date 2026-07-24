"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";

/** Vertical-roll word cycler for kinetic headlines. */
export function RollingWord({
  words,
  className,
  accentClass = "text-primary",
}: {
  words: string[];
  className?: string;
  accentClass?: string;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <span className={`relative inline-flex overflow-hidden align-bottom ${className ?? ""}`}>
      {/* widest word reserves the space so the layout never jumps */}
      <span className="invisible whitespace-nowrap">
        {words.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          initial={{ y: "105%", x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: "-105%", x: "-50%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute left-1/2 whitespace-nowrap ${accentClass}`}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t0 = performance.now();
    const dur = 1400;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // guarantee the final value even if the rAF loop is torn down mid-flight
    const settle = setTimeout(() => setN(to), dur + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("en-GB")}
      {suffix}
    </span>
  );
}

/** Scroll-triggered reveal with optional stagger index. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Infinite marquee strip (content duplicated for a seamless loop). */
export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`scrollbar-hide overflow-hidden ${className ?? ""}`}>
      <div className="marquee-track flex w-max items-center gap-10 pr-10">
        {children}
        {children}
      </div>
    </div>
  );
}

/** Two-line clamp with an elegant expand toggle, honesty behind a reveal. */
export function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <motion.p
        layout
        className={`text-sm leading-relaxed text-muted-foreground ${open ? "" : "line-clamp-2"}`}
      >
        {text}
      </motion.p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        {open ? "less" : "read →"}
      </button>
    </div>
  );
}
