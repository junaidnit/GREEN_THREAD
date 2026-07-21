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

/** 440x280 small promo tile. */
const W = 440;
const H = 280;
const markH = 128;
const scale = markH / MARK_H;
const markW = MARK_W * scale;
const markX = 44;
const markY = (H - markH) / 2;
const textX = markX + markW + 30;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CANVAS}"/>
  <g transform="translate(${markX} ${markY}) scale(${scale})"><path d="${d}" fill="${INK}"/></g>
  <text x="${textX}" y="118" font-family="Montserrat, Segoe UI, sans-serif" font-size="21" font-weight="600" letter-spacing="4.2" fill="${INK}">THE FIBRE SET</text>
  <text x="${textX}" y="152" font-family="Montserrat, Segoe UI, sans-serif" font-size="15.5" font-weight="500" fill="${BURGUNDY}">Fabric Check</text>
  <text x="${textX}" y="184" font-family="Montserrat, Segoe UI, sans-serif" font-size="12.5" font-weight="400" fill="${TAUPE}">What it&#8217;s really made of,</text>
  <text x="${textX}" y="202" font-family="Montserrat, Segoe UI, sans-serif" font-size="12.5" font-weight="400" fill="${TAUPE}">before you buy.</text>
</svg>`;

const out = `${OUT_DIR}promo-440x280.png`;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log("wrote", out);
console.log("NOTE: screenshots (1280x800) must be captured from the real extension — see STORE-SUBMISSION.md");
