import { BRAND_LOGO } from "./brand-path";

/**
 * The GreenThread mark — the business logo, used as an EXACT vector trace
 * of the original artwork (public/brand/logo-original.jpeg → potrace via
 * scripts/trace-logo.mjs). Zero hand-drawn approximation, zero distortion:
 * the outline, weave gaps and cut ends are the original's, losslessly
 * scalable. Fills with currentColor so it themes automatically.
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
