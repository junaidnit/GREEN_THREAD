import { ImageResponse } from "next/og";
import { BRAND_LOGO } from "@/components/brand-path";

/**
 * Every route previously shipped without og:image, so each share — and each
 * AI-generated preview card — rendered blank. Drawn from the heritage mark
 * and the brand palette so a shared link looks like the site it came from.
 */
export const runtime = "nodejs";
export const alt = "The Fibre Set — natural fibres, chosen well";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "#F5F3EF",
          fontFamily: "sans-serif",
        }}
      >
        <svg width={200} height={271} viewBox={BRAND_LOGO.viewBox}>
          <path d={BRAND_LOGO.d} fill="#141414" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 46,
              fontWeight: 600,
              letterSpacing: 12,
              color: "#141414",
              display: "flex",
            }}
          >
            THE FIBRE SET
          </div>
          <div style={{ fontSize: 36, color: "#4B2144", marginTop: 20, display: "flex" }}>
            Natural fibres, chosen well
          </div>
          <div
            style={{
              fontSize: 25,
              color: "#68685F",
              marginTop: 26,
              display: "flex",
              maxWidth: 620,
              lineHeight: 1.4,
            }}
          >
            We read the label and publish what it actually is.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
