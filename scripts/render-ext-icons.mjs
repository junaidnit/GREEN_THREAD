// Generates the extension's toolbar/store icons from the same brand-mark
// geometry as src/components/animated-logo.tsx, letterboxed into squares.
// Usage: node scripts/render-ext-icons.mjs
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

const SIZES = [16, 32, 48, 128];
const OUT_DIR = new URL("../extension/icons/", import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:");

const mark = (color) => `
  <defs>
    <mask id="w" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="168">
      <rect width="120" height="168" fill="white"/>
      <path d="M 50 73 L 59 92" stroke="black" stroke-width="24"/>
      <path d="M 63.5 124 L 67.5 148" stroke="black" stroke-width="24"/>
    </mask>
  </defs>
  <path mask="url(#w)" d="M 58 13 C 86 13, 94 44, 74 64 C 68 71, 62 77, 55 85 C 42 100, 30 110, 22 116 C 8 126, 10 138, 26 139 L 76 141" stroke="${color}" stroke-width="17" stroke-linejoin="round"/>
  <path d="M 58 13 C 30 13, 22 44, 42 64 C 48 70, 53 77, 57 86 C 62 100, 64 112, 65 124 C 66 136, 68 146, 71 158" stroke="${color}" stroke-width="17" stroke-linejoin="round"/>
`;

mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  // 120x168 mark centered in a square canvas, with a little breathing room
  const scale = (size * 0.82) / 168;
  const w = 120 * scale;
  const h = 168 * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#1f5137"/>
    <g transform="translate(${x} ${y}) scale(${scale})">${mark("#f5f2ea")}</g>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  const path = `${OUT_DIR}icon${size}.png`;
  writeFileSync(path, png);
  console.log("wrote", path);
}
