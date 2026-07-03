"use client";

import { motion } from "framer-motion";
import type { FabricPart } from "@/lib/types";
import { MATERIAL_NOTES, MATERIAL_SCORES } from "@/lib/scoring";

function barColor(material: FabricPart["material"]): string {
  const s = MATERIAL_SCORES[material] ?? 4;
  if (s >= 8) return "var(--grade-a)";
  if (s >= 6.5) return "var(--grade-b)";
  if (s >= 4.5) return "var(--grade-c)";
  if (s >= 3) return "var(--grade-d)";
  return "var(--grade-e)";
}

export function CompositionBars({ parts }: { parts: FabricPart[] }) {
  const sorted = [...parts].sort((a, b) => b.pct - a.pct);
  return (
    <div className="space-y-3" data-testid="composition-bars">
      {sorted.map((part, i) => (
        <div key={`${part.material}-${i}`} className="group">
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{part.label}</span>
            <span className="font-display font-semibold">{part.pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${part.pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: barColor(part.material) }}
            />
          </div>
          <p className="mt-1 hidden text-xs leading-relaxed text-muted-foreground group-hover:block">
            {MATERIAL_NOTES[part.material]}
          </p>
        </div>
      ))}
    </div>
  );
}
