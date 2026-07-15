// Regenerates src/app/icon.svg from the exact traced brand path.
import { readFileSync, writeFileSync } from "node:fs";

const { d, viewBox } = JSON.parse(readFileSync("data/brand-logo-path.json", "utf8"));
const [, , w, h] = viewBox.split(" ").map(Number);
const side = Math.max(w, h);
const dx = (side - w) / 2;
const dy = (side - h) / 2;

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 ${side} ${side}">` +
  `<g transform="translate(${dx} ${dy})"><path d="${d}" fill="#1f5137"/></g></svg>`;

writeFileSync("src/app/icon.svg", svg);
console.log(`icon.svg written (${svg.length} bytes, canvas ${side}x${side})`);
