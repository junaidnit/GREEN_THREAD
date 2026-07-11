/**
 * The GreenThread mark: a single thread that draws itself into a leaf —
 * fibre becoming garment. Pure SVG stroke animation, inherits currentColor.
 */
export function LogoMark({ size = 28, animate = true }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* the thread: trails in from the left, curls, and rises into the stem */}
      <path
        className={animate ? "draw-path" : undefined}
        d="M3 40c6 2 10-2 9-6s-6-4-7-1 2 6 7 6c7 0 10-5 12-11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the leaf: grown from the thread */}
      <path
        className={animate ? "draw-path-slow" : undefined}
        d="M24 28C22 14 30 5 43 4c1 13-5 23-19 24Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* central vein */}
      <path
        className={animate ? "draw-path-slow" : undefined}
        d="M27 24c3-6 8-12 13-16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
