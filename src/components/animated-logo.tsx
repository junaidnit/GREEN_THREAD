import { useId } from "react";

/**
 * The GreenThread mark — the business logo, recreated as vector: a single
 * ribbon of thread loops into a needle's-eye teardrop and ties itself into
 * an open knot, weaving over-and-under like cloth.
 *
 * Geometry (viewBox 120×168): strand A (back) runs apex → right flank →
 * pinch → SW sweep → elbow → bar east; strand B (front) runs apex → left
 * flank → pinch → SE to the cut end. The two crossings (pinch + bar) are
 * carved out of strand A with a mask, so the over-under weave reads on any
 * surface. Pure currentColor strokes; the thread draws itself on load.
 * (Bezier flanks, not circle arcs — arcs read padlock, not teardrop.)
 */
export function LogoMark({ size = 28, animate = true }: { size?: number; animate?: boolean }) {
  const maskId = useId();
  return (
    <svg
      width={Math.round((size * 120) / 168)}
      height={size}
      viewBox="0 0 120 168"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="168">
          <rect width="120" height="168" fill="white" />
          {/* gaps where the front strand weaves over: pinch + bar */}
          <path d="M 50 73 L 59 92" stroke="black" strokeWidth="24" />
          <path d="M 63.5 124 L 67.5 148" stroke="black" strokeWidth="24" />
        </mask>
      </defs>
      {/* strand A (back): right flank → pinch → SW sweep → elbow → bar */}
      <path
        className={animate ? "draw-path" : undefined}
        mask={`url(#${maskId})`}
        d="M 58 13
           C 86 13, 94 44, 74 64
           C 68 71, 62 77, 55 85
           C 42 100, 30 110, 22 116
           C 8 126, 10 138, 26 139
           L 76 141"
        stroke="currentColor"
        strokeWidth="17"
        strokeLinejoin="round"
      />
      {/* strand B (front): left flank → pinch → down to the cut end */}
      <path
        className={animate ? "draw-path-slow" : undefined}
        d="M 58 13
           C 30 13, 22 44, 42 64
           C 48 70, 53 77, 57 86
           C 62 100, 64 112, 65 124
           C 66 136, 68 146, 71 158"
        stroke="currentColor"
        strokeWidth="17"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full lockup: mark + serif italic wordmark. */
export function LogoLockup({ size = 28, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} animate={animate} />
      <span className="font-serif font-semibold italic leading-none tracking-tight" style={{ fontSize: size * 0.82 }}>
        greenthread
      </span>
    </span>
  );
}
