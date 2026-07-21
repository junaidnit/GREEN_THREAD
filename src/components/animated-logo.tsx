import { BRAND_LOGO } from "./brand-path";

/**
 * The Fibre Set mark — the heritage ribbon logo, and the business's
 * permanent mark (not a placeholder). Used as an EXACT vector trace of the
 * original artwork (public/brand/logo-original.jpeg → potrace via
 * scripts/trace-logo.mjs). Zero hand-drawn approximation, zero distortion:
 * the outline, weave gaps and cut ends are the original's, losslessly
 * scalable. Fills with currentColor so it themes automatically.
 *
 * Treat the traced path as the source of truth for the brand mark; if the
 * artwork is ever revised, re-run the trace script rather than editing it.
 */
export function LogoMark({ size = 28, animate = true }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={Math.round((size * BRAND_LOGO.width) / BRAND_LOGO.height)}
      height={size}
      viewBox={BRAND_LOGO.viewBox}
      aria-hidden="true"
      className={`shrink-0 ${animate ? "gt-logo-reveal" : ""}`}
    >
      <path d={BRAND_LOGO.d} fill="currentColor" />
    </svg>
  );
}

/** Full lockup: mark + wordmark, matching the header treatment. */
export function LogoLockup({ size = 28, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark size={size} animate={animate} />
      <span
        className="font-display font-semibold uppercase leading-none tracking-[0.2em]"
        style={{ fontSize: size * 0.5 }}
      >
        The&nbsp;Fibre&nbsp;Set
      </span>
    </span>
  );
}
