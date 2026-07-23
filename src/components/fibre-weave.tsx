import { FIBRE_CLASS } from "@/lib/materials";
import type { FabricPart, MaterialId } from "@/lib/types";

/**
 * THE FIBRE VISUAL — replaces the 0–100 score and A–E grade.
 *
 * A garment's composition drawn as spun thread: each fibre becomes a bundle of
 * strands, the strand count in proportion to its percentage, grouped so a
 * blend reads as distinct coloured bundles laid side by side — the fibres in
 * combination, which is what the cloth actually is. Each strand carries a soft
 * highlight so it reads as spun yarn rather than a flat bar.
 *
 * This is not a judgement. It is the disclosed composition, made into the one
 * thing this brand is about: fibre. Colour evokes the real material; synthetic
 * is a muted grey, so plastic simply looks duller among the naturals without a
 * word of lecture. Deterministic — the same composition always draws the same
 * weave.
 */

/** Thread colours, chosen to look like the raw fibre. */
const THREAD: Partial<Record<MaterialId, string>> = {
  linen: "#C7B98F",
  hemp: "#A6AC82",
  organic_cotton: "#E6DFCE",
  conventional_cotton: "#E6DFCE",
  recycled_cotton: "#DAD2BE",
  bci_cotton: "#E6DFCE",
  peace_silk: "#E4CE99",
  merino_wool: "#C0A9AD",
  lambswool: "#C6B3A0",
  virgin_wool: "#BCA9A0",
  recycled_wool: "#B7A79C",
  tencel_lyocell: "#AEB8BE",
  modal: "#B4BCC0",
  viscose: "#B8BDBB",
  cupro: "#BEC4C6",
};
const CLASS_FALLBACK: Record<string, string> = {
  natural: "#C7B98F",
  regenerated: "#AEB8BE",
  synthetic: "#9A9A93", // oil-derived reads dull among the naturals
};
const threadColour = (m: MaterialId) =>
  THREAD[m] ?? CLASS_FALLBACK[FIBRE_CLASS[m] ?? "regenerated"] ?? "#B4BCC0";

/** Largest-remainder allocation of `total` strands across the fibres. */
function allocate(parts: FabricPart[], total: number): Array<{ colour: string; strands: number }> {
  const sorted = [...parts].sort((a, b) => b.pct - a.pct);
  const sum = sorted.reduce((s, p) => s + p.pct, 0) || 100;
  const raw = sorted.map((p) => ({ colour: threadColour(p.material), exact: (p.pct / sum) * total }));
  const out = raw.map((r) => ({ colour: r.colour, strands: Math.max(1, Math.floor(r.exact)) }));
  let used = out.reduce((s, o) => s + o.strands, 0);
  // hand out the leftover strands to the largest fractional remainders
  const order = raw
    .map((r, i) => ({ i, frac: r.exact - Math.floor(r.exact) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; used < total; k++, used++) out[order[k % order.length].i].strands++;
  return out;
}

export function FibreWeave({
  parts,
  height = 56,
  strands = 22,
  radius = 8,
  className = "",
}: {
  parts: FabricPart[];
  height?: number;
  strands?: number;
  radius?: number;
  className?: string;
}) {
  const groups = allocate(parts, strands);
  const flat = groups.flatMap((g) => Array.from({ length: g.strands }, () => g.colour));
  const n = flat.length;

  const slot = 6; // units per strand
  const W = n * slot;
  const vbH = 44;
  const amp = slot * 0.62;
  const sw = slot * 0.86;

  // one gentle S-curve per strand, alternating direction so the bundle plaits
  const strand = (cx: number, dir: number) =>
    `M${cx} 0 C ${cx + dir * amp} ${vbH * 0.34} ${cx - dir * amp} ${vbH * 0.66} ${cx} ${vbH}`;

  return (
    <div
      data-testid="fibre-weave"
      className={className}
      style={{ height, aspectRatio: `${W} / ${vbH}` }}
      role="img"
      aria-label={parts
        .slice()
        .sort((a, b) => b.pct - a.pct)
        .map((p) => `${p.pct}% ${p.label}`)
        .join(", ")}
    >
      <svg
        viewBox={`0 0 ${W} ${vbH}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: "block", borderRadius: radius, overflow: "hidden" }}
      >
        {flat.map((colour, i) => {
          const cx = i * slot + slot / 2;
          const dir = i % 2 === 0 ? 1 : -1;
          const d = strand(cx, dir);
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={colour} strokeWidth={sw} strokeLinecap="round" />
              {/* spun-yarn sheen: a thin light highlight nudged along the strand */}
              <path
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.28}
                strokeWidth={sw * 0.28}
                strokeLinecap="round"
                transform="translate(-0.7 0)"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
