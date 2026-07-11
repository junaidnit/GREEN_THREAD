/** One-off: screenshot the label hero after hydration. */
import { chromium } from "@playwright/test";

const OUT = process.argv[2] ?? "hero.png";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 860 } });
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector('[data-testid="hero-verdict-card"]', { state: "visible", timeout: 30_000 });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT });
  await b.close();
  console.log("saved", OUT);
})();
