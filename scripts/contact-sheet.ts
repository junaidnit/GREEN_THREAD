/**
 * One-off QA: contact sheet of every catalog pool image with its assigned
 * colour + categories, so tags can be visually audited in one pass.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import type { SeedProduct } from "../src/lib/types";

const OUT = process.argv[2] ?? "contact-sheet.png";

(async () => {
  // parse the IMG table straight from the generator source, in order,
  // so every cell can be addressed as category #index
  const src = readFileSync(resolve(process.cwd(), "scripts/generate-catalog.ts"), "utf8");
  const tableMatch = src.match(/const IMG: Record<string, Img\[\]> = \{([\s\S]*?)\n\};/);
  if (!tableMatch) throw new Error("IMG table not found");
  const entries: Array<{ cat: string; i: number; id: string; colour: string }> = [];
  let cat = "";
  let idx = 0;
  for (const line of tableMatch[1].split("\n")) {
    const catM = line.match(/^\s*"?([\w-]+)"?: \[/);
    if (catM) { cat = catM[1]; idx = 0; }
    for (const m of line.matchAll(/\["(photo-[\w-]+)", "([^"]+)"\]/g)) {
      entries.push({ cat, i: idx++, id: m[1], colour: m[2] });
    }
  }

  const cells = entries
    .map(
      (e) => `
      <div style="width:150px">
        <img src="https://images.unsplash.com/${e.id}?auto=format&fit=crop&w=200&h=260&q=60" width="150" height="195" style="object-fit:cover;border-radius:6px" />
        <div style="font:700 14px sans-serif;margin-top:2px">${e.cat} #${e.i}</div>
        <div style="font:700 13px sans-serif;color:#0a7a4a">${e.colour}</div>
      </div>`,
    )
    .join("");

  const html = `<body style="margin:12px;background:#fff"><div style="display:flex;flex-wrap:wrap;gap:10px">${cells}</div></body>`;
  const htmlPath = resolve(process.cwd(), "contact-sheet.html");
  writeFileSync(htmlPath, html);

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1180, height: 900 } });
  await p.goto(`file://${htmlPath}`);
  await p.waitForTimeout(6000); // let all images load
  await p.screenshot({ path: OUT, fullPage: true });
  await b.close();
  console.log(`saved ${OUT} (${entries.length} pool entries)`);
})();
