// Renders the CURRENT LogoMark geometry (from animated-logo.tsx) for review.
// Run: node scripts/render-logo2.mjs <out.png>
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="504" viewBox="0 0 120 168" fill="none">
  <rect x="0" y="0" width="120" height="168" fill="#ffffff"/>
  <defs>
    <mask id="weave" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="168">
      <rect width="120" height="168" fill="white" />
      <path d="M 50 73 L 59 92" stroke="black" stroke-width="24" />
      <path d="M 63.5 124 L 67.5 148" stroke="black" stroke-width="24" />
    </mask>
  </defs>
  <path mask="url(#weave)"
        d="M 58 13 C 86 13, 94 44, 74 64 C 68 71, 62 77, 55 85 C 42 100, 30 110, 22 116 C 8 126, 10 138, 26 139 L 76 141"
        stroke="#111" stroke-width="17" stroke-linejoin="round" />
  <path d="M 58 13 C 30 13, 22 44, 42 64 C 48 70, 53 77, 57 86 C 62 100, 64 112, 65 124 C 66 136, 68 146, 71 158"
        stroke="#111" stroke-width="17" stroke-linejoin="round" />
</svg>`;

const out = process.argv[2] ?? "logo-current.png";
const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(out, png);
console.log("wrote", out);
