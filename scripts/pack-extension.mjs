// Packages extension/ into public/ so the website can serve a real download.
// The zip is committed, because Vercel builds don't run this — regenerate it
// (npm run pack:extension) whenever anything under extension/ changes.
// Usage: node scripts/pack-extension.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { platform } from "node:os";

const here = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:");
const SRC = here("../extension");
const OUT_DIR = here("../public/downloads");
const OUT = `${OUT_DIR}/the-fibre-set-extension.zip`;

if (!existsSync(`${SRC}/manifest.json`)) throw new Error("extension/manifest.json missing");
if (!existsSync(`${SRC}/brand-mark.js`)) {
  throw new Error("extension/brand-mark.js missing — run: node scripts/render-ext-icons.mjs");
}

mkdirSync(OUT_DIR, { recursive: true });
rmSync(OUT, { force: true });

if (platform() === "win32") {
  // bsdtar, not Compress-Archive: Compress-Archive writes entry paths with
  // BACKSLASHES, which unzips on macOS as files literally named
  // "icons\icon16.png" — a broken extension for any Mac user.
  execFileSync(`${process.env.SystemRoot}\\System32\\tar.exe`, ["-a", "-c", "-f", OUT, "-C", SRC, "."], {
    stdio: "inherit",
  });
} else {
  execFileSync("zip", ["-r", "-q", OUT, "."], { cwd: SRC, stdio: "inherit" });
}

console.log(`wrote ${OUT} (${(statSync(OUT).size / 1024).toFixed(1)} KB)`);
