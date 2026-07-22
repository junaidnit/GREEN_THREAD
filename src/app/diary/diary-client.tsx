"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { clearDiary, getDiary, type DiaryEntry } from "@/lib/diary";
import { formatPrice } from "@/lib/format";
import { LogoMark } from "@/components/animated-logo";

export function DiaryClient() {
  const [entries, setEntries] = useState<DiaryEntry[] | null>(null);

  useEffect(() => {
    const load = () => setEntries(getDiary());
    load();
    window.addEventListener("gt:diary", load);
    return () => window.removeEventListener("gt:diary", load);
  }, []);

  if (entries === null) return null;

  const total = entries.reduce((s, e) => s + e.price, 0);
  // spend attributed by composition: £30 tee at 70% natural = £21 natural
  const naturalSpend = entries.reduce((s, e) => s + (e.price * e.natural) / 100, 0);
  const plasticSpend = entries.reduce((s, e) => s + (e.price * e.plastic) / 100, 0);
  const otherSpend = Math.max(0, total - naturalSpend - plasticSpend); // regenerated cellulosics
  const naturalShare = total > 0 ? Math.round((naturalSpend / total) * 100) : 0;
  const plasticShare = total > 0 ? Math.round((plasticSpend / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Private · stored only on this device</p>
          <h1 className="mt-2 font-serif text-4xl font-medium italic tracking-tight sm:text-5xl">
            Your Fibre Diary
          </h1>
        </div>
        <LogoMark size={44} animate />
      </div>

      {entries.length === 0 ? (
        <div className="mt-12 rounded-xl2 border border-dashed border-border px-6 py-16 text-center">
          <p className="font-serif text-2xl font-medium italic">Nothing recorded yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Every time you buy through The Fibre Set, the fibres you paid for are logged here —
            privately, on your device — so you can watch your wardrobe go natural.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background"
          >
            Start browsing
          </Link>
        </div>
      ) : (
        <>
          {/* headline stats */}
          <div className="mt-10 grid grid-cols-3 gap-4" data-testid="diary-stats">
            {[
              { label: "spent in total", value: formatPrice(Math.round(total), "GBP") },
              { label: "went to natural fibre", value: formatPrice(Math.round(naturalSpend), "GBP"), accent: true },
              { label: "went to plastic", value: formatPrice(Math.round(plasticSpend), "GBP"), warn: true },
            ].map((s) => (
              <div key={s.label} className="border-t border-border pt-4">
                <p className={`font-serif text-3xl font-medium ${s.accent ? "text-grade-a" : s.warn ? "text-grade-d" : ""}`}>
                  {s.value}
                </p>
                <p className="eyebrow mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* the split bar */}
          <div className="mt-8">
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${naturalShare}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-grade-a"
                title={`${naturalShare}% natural`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - naturalShare - plasticShare}%` }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-grade-b"
                title="regenerated (plastic-free)"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${plasticShare}%` }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-grade-d"
                title={`${plasticShare}% plastic`}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>
                <b className="text-grade-a">{naturalShare}%</b> natural fibre
              </span>
              {otherSpend > 0.5 && <span>plastic-free regenerated</span>}
              <span>
                <b className="text-grade-d">{plasticShare}%</b> oil-derived plastic
              </span>
            </div>
          </div>

          {/* entries */}
          <div className="mt-10 space-y-0" data-testid="diary-entries">
            {[...entries].reverse().map((e) => (
              <Link
                key={`${e.id}-${e.date}`}
                href={`/product/${e.id}`}
                className="flex items-baseline justify-between gap-4 border-t border-border py-3.5 transition-colors hover:bg-surface-2/50 last:border-b"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.brand} · {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[12px] font-bold text-white ${
                      e.plastic === 0 ? "bg-grade-a" : "bg-grade-d"
                    }`}
                  >
                    {e.plastic === 0 ? `${e.natural === 100 ? "100% natural" : "plastic-free"}` : `${e.plastic}% plastic`}
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatPrice(e.price, "GBP")}</span>
                </div>
              </Link>
            ))}
          </div>

          <button
            onClick={() => clearDiary()}
            className="mt-8 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear diary
          </button>
        </>
      )}
    </div>
  );
}
