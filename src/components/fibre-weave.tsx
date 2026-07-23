import { FIBRE_CLASS } from "@/lib/materials";
import type { FabricPart, MaterialId } from "@/lib/types";

/**
 * THE FIBRE MARK — a swatch of the cloth itself.
 *
 * Four passes to get here:
 *   1. a coloured percentage bar        — a chart, not a fabric
 *   2. parallel spun strands            — thread, but not cloth: nothing is woven
 *   3. a true plain weave               — warp and weft actually interlacing
 *   4. a SWATCH                         — what this is now
 *
 * The fourth is the one that means something. It is not a diagram of the
 * composition, it IS the cloth: warp and weft dyed in the garment's own fibre
 * proportions and woven over-under, as if a square had been snipped from the
 * piece and pinned to the page. The family this brand came from wove mohair on
 * hand looms from 1967; a swatch is how a weaver shows you what something is.
 *
 * Deliberately small. A swatch is a detail you lean in to, not a banner.
 *
 * Every thread colour is the real fibre's colour, and synthetic is a flat grey
 * that reads dull among them — the plastic shows itself without a word of
 * lecture. Deterministic: the same composition always weaves the same swatch.
 */

/** Thread colours, chosen to look like the raw fibre. */
const THREAD: Partial<Record<MaterialId, string>> = {
  linen: "#C9BC94",
  hemp: "#A8AE86",
  organic_cotton: "#EDE7D9",
  conventional_cotton: "#E7E1D2",
  recycled_cotton: "#DBD3C0",
  bci_cotton: "#E7E1D2",
  peace_silk: "#E8D5A6",
  merino_wool: "#C4AEB1",
  lambswool: "#CAB8A5",
  virgin_wool: "#C0AEA4",
  recycled_wool: "#BAAB9F",
  tencel_lyocell: "#B2BCC2",
  modal: "#B8C0C4",
  viscose: "#BCC1BF",
  cupro: "#C2C8CA",
};
const CLASS_FALLBACK: Record<string, string> = {
  natural: "#C9BC94",
  regenerated: "#B2BCC2",
  synthetic: "#9A9A93", // oil-derived reads dull among the naturals
};
const threadColour = (m: MaterialId) =>
  THREAD[m] ?? CLASS_FALLBACK[FIBRE_CLASS[m] ?? "regenerated"] ?? "#B8C0C4";

/**
 * Largest-remainder allocation: n threads shared out across the fibres in
 * proportion, so a 70/30 blend really is 70/30 of the threads.
 */
function allocate(parts: FabricPart[], n: number): string[] {
  const sorted = [...parts].sort((a, b) => b.pct - a.pct);
  const sum = sorted.reduce((s, p) => s + p.pct, 0) || 100;
  const exact = sorted.map((p) => ({ colour: threadColour(p.material), v: (p.pct / sum) * n }));
  const counts = exact.map((e) => Math.max(1, Math.floor(e.v)));
  let used = counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((e, i) => ({ i, frac: e.v - Math.floor(e.v) }))
    .sort((a, b) => b.frac - a.frac);
  // hand out leftovers to the biggest fractional remainders; trim if we overshot
  for (let k = 0; used < n; k++, used++) counts[byRemainder[k % byRemainder.length].i]++;
  for (let k = 0; used > n; k++, used--) {
    const idx = byRemainder[k % byRemainder.length].i;
    if (counts[idx] > 1) counts[idx]--;
    else used++; // can't go below one thread; stop shrinking this one
  }
  return exact.flatMap((e, i) => Array.from({ length: counts[i] }, () => e.colour));
}

export function FibreWeave({
  parts,
  size = 40,
  threads = 8,
  className = "",
}: {
  parts: FabricPart[];
  /** px. Small on purpose — a swatch, not a banner. */
  size?: number;
  threads?: number;
  className?: string;
}) {
  const n = threads;
  const warp = allocate(parts, n);
  // weft repeats the same proportions offset by one, so the two directions
  // read as the same cloth rather than two unrelated stripe sets
  const weft = warp.map((_, i) => warp[(i + Math.floor(n / 2)) % n]);

  const c = 10; // cell units
  const S = n * c;
  const tw = c * 0.82; // thread width; the small gap is what reads as weave
  const r = 1.2; // barely rounded — a spun thread, not a bead

  const label = parts
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .map((p) => `${p.pct}% ${p.label}`)
    .join(", ");

  return (
    <span
      data-testid="fibre-weave"
      className={className}
      style={{ display: "inline-block", width: size, height: size, lineHeight: 0 }}
      role="img"
      aria-label={`Woven from ${label}`}
      title={label}
    >
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id="fw-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.20" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#3A3A55" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* TRUE INTERLACE. Two flat layers cannot weave — whichever is drawn
            second always wins, and the result reads as beads on a grid. Real
            cloth alternates per crossing, so we walk the cells and draw the
            UNDER thread first, then the OVER one. (i + j) even = weft over.
            Threads are cell-length pieces that butt seamlessly, so each still
            reads as one continuous thread. */}
        {Array.from({ length: n }, (_, j) =>
          Array.from({ length: n }, (_, i) => {
            const warpPiece = (
              <rect
                key={`wa-${i}-${j}`}
                x={i * c + (c - tw) / 2}
                y={j * c}
                width={tw}
                height={c}
                rx={r}
                fill={warp[i]}
              />
            );
            const weftPiece = (
              <rect
                key={`we-${i}-${j}`}
                x={i * c}
                y={j * c + (c - tw) / 2}
                width={c}
                height={tw}
                rx={r}
                fill={weft[j]}
              />
            );
            return (i + j) % 2 === 0
              ? [warpPiece, weftPiece] // weft rides over
              : [weftPiece, warpPiece]; // warp rides over
          }),
        )}

        {/* the sheen a real swatch catches under light */}
        <rect width={S} height={S} fill="url(#fw-sheen)" />
      </svg>
    </span>
  );
}
