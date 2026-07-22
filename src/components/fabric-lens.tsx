"use client";

import { useRef, useState } from "react";

/**
 * "Inspect the weave", a magnifier lens over the hi-res product photo with a
 * soft specular sheen that follows the cursor, so the fabric reads as tactile.
 * Pure CSS/JS; no WebGL, no fake textures, just the real photo, closer.
 */
export function FabricLens({ imageUrl, children }: { imageUrl: string; children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number; bx: number; by: number } | null>(null);

  const hiRes = imageUrl.replace(/w=900/, "w=1800").replace(/h=1200/, "h=2400");
  const LENS = 190;
  const ZOOM = 2.4;

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLens({
      x,
      y,
      bx: (x / rect.width) * 100,
      by: (y / rect.height) * 100,
    });
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full cursor-crosshair"
      onMouseMove={onMove}
      onMouseLeave={() => setLens(null)}
      data-testid="fabric-lens"
    >
      {children}
      {lens && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-full border-2 border-white/80 shadow-2xl shadow-black/40"
            style={{
              width: LENS,
              height: LENS,
              left: lens.x - LENS / 2,
              top: lens.y - LENS / 2,
              backgroundImage: `url(${hiRes})`,
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: `${lens.bx}% ${lens.by}%`,
            }}
          >
            {/* dynamic sheen, light glides across the weave as you move */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle at ${100 - lens.bx}% ${100 - lens.by}%, rgba(255,255,255,0.22), transparent 55%)`,
              }}
            />
          </div>
          <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[12px] font-medium text-white backdrop-blur">
            Inspecting the weave · {Math.round(ZOOM * 100)}%
          </p>
        </>
      )}
    </div>
  );
}
