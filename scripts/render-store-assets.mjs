// Chrome Web Store promo tile, drawn from the heritage mark.
// Screenshots are NOT generated here — Google requires those to show the real
// extension in use, so they must be captured from a live page.
// Usage: node scripts/render-store-assets.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const here = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:");
const OUT_DIR = here("../extension/store/");

const src = readFileSync(here("../src/components/brand-path.ts"), "utf8");
const d = src.match(/d:\s*"([^"]+)"/)?.[1];
const viewBox = src.match(/viewBox:\s*"([^"]+)"/)?.[1];
if (!d || !viewBox) throw new Error("could not read BRAND_LOGO from brand-path.ts");
const [, , MARK_W, MARK_H] = viewBox.split(/\s+/).map(Number);

const CANVAS = "#F5F3EF";
const INK = "#141414";
const BURGUNDY = "#4B2144";
const TAUPE = "#6F6F66";

mkdirSync(OUT_DIR, { recursive: true });

/**
 * The Web Store requires 24-bit PNG with NO ALPHA for tiles and screenshots.
 * sharp emits RGBA by default, so every asset here is flattened onto the
 * canvas colour and written without an alpha channel — an alpha channel is a
 * silent rejection.
 */
const write = async (svg, file) => {
  const out = `${OUT_DIR}${file}`;
  await sharp(Buffer.from(svg))
    .flatten({ background: CANVAS })
    .png({ palette: false, compressionLevel: 9 })
    .toFile(out);
  const m = await sharp(out).metadata();
  if (m.hasAlpha) throw new Error(`${file} still has an alpha channel`);
  console.log(`wrote ${out} (${m.width}x${m.height}, channels=${m.channels})`);
};

/** Promo tile: mark + wordmark, sized for the given canvas. */
const tile = (W, H, markH, textScale) => {
  const scale = markH / MARK_H;
  const markW = MARK_W * scale;
  const markX = Math.round(W * 0.1);
  const markY = (H - markH) / 2;
  const tx = markX + markW + markH * 0.24;
  const cy = H / 2;
  const s = (n) => (n * textScale).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CANVAS}"/>
  <g transform="translate(${markX} ${markY}) scale(${scale})"><path d="${d}" fill="${INK}"/></g>
  <text x="${tx}" y="${cy - 22 * textScale}" font-family="Montserrat, Segoe UI, sans-serif" font-size="${s(21)}" font-weight="600" letter-spacing="${s(4.2)}" fill="${INK}">THE FIBRE SET</text>
  <text x="${tx}" y="${cy + 12 * textScale}" font-family="Montserrat, Segoe UI, sans-serif" font-size="${s(15.5)}" font-weight="500" fill="${BURGUNDY}">Fabric Check</text>
  <text x="${tx}" y="${cy + 44 * textScale}" font-family="Montserrat, Segoe UI, sans-serif" font-size="${s(12.5)}" font-weight="400" fill="${TAUPE}">What it&#8217;s really made of, before you buy.</text>
</svg>`;
};

await write(tile(440, 280, 128, 1), "promo-440x280.png");
await write(tile(1400, 560, 300, 2.3), "marquee-1400x560.png");

/** 128x128 store icon — the mark alone, opaque. */
const iconScale = (128 * 0.62) / MARK_H;
await write(
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="${CANVAS}"/>
    <g transform="translate(${(128 - MARK_W * iconScale) / 2} ${(128 - MARK_H * iconScale) / 2}) scale(${iconScale})"><path d="${d}" fill="${INK}"/></g>
  </svg>`,
  "store-icon-128.png",
);

console.log("\nNOTE: screenshots (1280x800) must be captured from the real extension — see STORE-SUBMISSION.md");
