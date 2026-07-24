"use client";

import { useState } from "react";
import Image from "next/image";
import { FabricLens } from "./fabric-lens";

/**
 * Product image gallery: a large main image (with the fabric-inspect lens) and
 * a thumbnail strip of the merchant's other photos. Clicking a thumbnail swaps
 * the main image. Falls back to a single image when the feed only gave us one.
 */
export function ProductGallery({
  images,
  title,
  viewTransitionName,
}: {
  images: string[];
  title: string;
  viewTransitionName?: string;
}) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const main = gallery[active] ?? gallery[0];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl2 border border-border bg-surface-2"
        style={viewTransitionName ? { viewTransitionName } : undefined}
      >
        <FabricLens imageUrl={main}>
          <Image
            key={main}
            src={main}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </FabricLens>
        <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-surface/85 px-2.5 py-1 text-[12px] font-medium text-muted-foreground backdrop-blur">
          hover to inspect the weave
        </p>
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" data-testid="product-thumbnails">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1} of ${gallery.length}`}
              aria-pressed={i === active}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-surface-2 transition-all ${
                i === active
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
