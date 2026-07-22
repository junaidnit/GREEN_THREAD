import { FIBRE_CLASS, oilDerivedPct } from "@/lib/materials";
import type { FabricPart, MaterialId } from "@/lib/types";

/**
 * WHAT A GARMENT IS MADE OF, drawn to scale. This replaces the 0-100 score
 * and the A-E letter grade.
 *
 * We are not an accredited ratings body, and a letter grade claims an
 * authority we have not earned: it compresses a judgement we invented into
 * something that looks certified. The composition is not a judgement at all.
 * It is the number the brand itself discloses, drawn in proportion, and it is
 * both more honest and more useful — "62% linen, 38% polyester" tells you
 * something a "C" never could.
 *
 * Colour encodes fibre class, not quality: one family per class, so a reader
 * learns the palette once. Nothing here says good or bad.
 */

const CLASS_COLOUR: Record<string, string> = {
  natural: "var(--grade-a)", // plant and animal fibres, grown
  regenerated: "var(--slate)", // cellulose, chemically processed (TENCEL, modal)
  synthetic: "var(--grade-e)", // oil-derived
};

function classOf(m: MaterialId): string {
  return FIBRE_CLASS[m] ?? "regenerated";
}

export function fibreColour(m: MaterialId): string {
  return CLASS_COLOUR[classOf(m)] ?? "var(--slate)";
}

/**
 * A single proportional bar. Segment widths are the disclosed percentages,
 * so the picture is the data rather than a decoration of it.
 */
export function FibreProfile({
  parts,
  size = "md",
  showLabels = true,
}: {
  parts: FabricPart[];
  size?: "sm" | "md";
  showLabels?: boolean;
}) {
  const sorted = [...parts].sort((a, b) => b.pct - a.pct);
  const total = sorted.reduce((s, p) => s + p.pct, 0) || 100;
  const plastic = oilDerivedPct(parts);
  const h = size === "sm" ? 6 : 10;

  return (
    <div data-testid="fibre-profile">
      <div
        className="flex w-full overflow-hidden rounded-full bg-surface-2"
        style={{ height: h }}
        role="img"
        aria-label={sorted.map((p) => `${p.pct}% ${p.label}`).join(", ")}
      >
        {sorted.map((p, i) => (
          <div
            key={`${p.material}-${i}`}
            style={{ width: `${(p.pct / total) * 100}%`, background: fibreColour(p.material) }}
            title={`${p.pct}% ${p.label}`}
          />
        ))}
      </div>

      {showLabels && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {sorted.map((p, i) => (
            <li
              key={`${p.material}-${i}`}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground"
            >
              <span
                aria-hidden
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ background: fibreColour(p.material) }}
              />
              <span className="tabular-nums text-foreground">{p.pct}%</span>
              <span>{p.label}</span>
            </li>
          ))}
        </ul>
      )}

      {plastic > 0 && (
        <p className="mt-2 text-[12px] font-semibold text-grade-e">
          {plastic}% of this garment is oil-derived plastic
        </p>
      )}
    </div>
  );
}

/**
 * The compact form for a product card: the bar plus the one fact that
 * matters at a glance. No number out of a hundred, no letter.
 */
export function FibreMarkChip({ parts }: { parts: FabricPart[] }) {
  const plastic = oilDerivedPct(parts);
  const pure = plastic === 0;
  return (
    <span
      data-testid="fibre-chip"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        pure ? "bg-grade-a/12 text-grade-a" : "bg-grade-e/12 text-grade-e"
      }`}
    >
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full"
        style={{ background: pure ? "var(--grade-a)" : "var(--grade-e)" }}
      />
      {pure ? "No plastic" : `${plastic}% plastic`}
    </span>
  );
}
