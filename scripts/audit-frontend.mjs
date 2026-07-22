/**
 * Re-runs the measurements from the July 2026 design/SEO audit and fails if a
 * target regresses. Every number here was a real finding, not a guess:
 * 14 font sizes, 67 sub-14px elements, 21 small tap targets, 10px of mobile
 * overflow, 3 contrast failures, 8 missing alts, no sitemap/robots/og.
 *
 * Usage: node scripts/audit-frontend.mjs [baseUrl]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] || "https://thefibreset.com";
const SRC = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]):/, "$1:");

let failures = 0;
const check = (ok, label, detail) => {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? `: ${detail}` : ""}`);
  if (!ok) failures++;
};

// ── static checks over source ────────────────────────────────────────────
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
  });
}
const sources = walk(SRC).map((p) => readFileSync(p, "utf8"));
const all = sources.join("\n");

const sizes = [...all.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)].map((m) => parseFloat(m[1]));
const distinct = [...new Set(sizes)].sort((a, b) => a - b);
check(distinct.length <= 6, "type scale — at most 6 fixed sizes", `${distinct.length} (${distinct.join(", ")})`);
check(distinct.every((s) => s >= 12), "no type below 12px", `smallest ${Math.min(...distinct)}px`);

// Tailwind's named ramp bypasses the check above and reintroduced 24px and
// 30px once already — catch it at the source.
const named = [...all.matchAll(/(?<![\w-])text-(lg|xl|2xl|3xl|4xl|5xl|6xl)(?![\w-])/g)].map((m) => m[1]);
check(named.length === 0, "no off-scale Tailwind text sizes", `${named.length} (${[...new Set(named)].join(", ")})`);

// alt="" is CORRECT for decorative images — a screen reader should skip a
// flying animation or a hero thumbnail. Only flag an empty alt that is NOT
// marked decorative, otherwise the gate pushes you into writing noise.
const undecorated = [...all.matchAll(/alt=""(?![^>]*aria-hidden)/g)].length;
check(undecorated === 0, "no empty alt on content images", `${undecorated} unmarked`);

check(/overflow-x:\s*clip/.test(readFileSync(join(SRC, "app/globals.css"), "utf8")),
  "mobile overflow contained");
check(/--rose-ink:\s*#8A5B5C/i.test(readFileSync(join(SRC, "app/globals.css"), "utf8")),
  "AA-safe eyebrow colour in tokens");

// ── live checks ──────────────────────────────────────────────────────────
const ROUTES = ["/", "/search", "/label-watch", "/methodology", "/journal", "/extension", "/fabric/linen"];

for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
  const r = await fetch(BASE + path).catch(() => null);
  check(r?.ok === true, `${path} served`, r ? `HTTP ${r.status}` : "unreachable");
}

let missingOg = 0, missingCanonical = 0, missingH1 = 0, longTitles = 0;
for (const path of ROUTES) {
  const html = await fetch(BASE + path).then((r) => r.text()).catch(() => "");
  if (!/property="og:image"/.test(html)) missingOg++;
  if (!/rel="canonical"/.test(html)) missingCanonical++;
  if (!/<h1/.test(html)) missingH1++;
  // decode entities before measuring — "&amp;" is one character to a reader,
  // five in the source, and counting the raw form reports false failures
  const t = ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "")
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
  if (t.length > 60) longTitles++;
}
check(missingOg === 0, "every route has og:image", `${missingOg} missing`);
check(missingCanonical === 0, "every route has a canonical", `${missingCanonical} missing`);
check(missingH1 === 0, "every route has an h1", `${missingH1} missing`);
check(longTitles === 0, "titles within 60 chars", `${longTitles} too long`);

const home = await fetch(BASE).then((r) => r.text()).catch(() => "");
for (const type of ["Organization", "WebSite", "Dataset"]) {
  check(new RegExp(`"@type":"${type}"`).test(home), `JSON-LD ${type} present`);
}

console.log(failures ? `\nFAILED — ${failures} regression(s)` : "\nall frontend audit targets met");
process.exit(failures ? 1 : 0);
