/** One-off: screenshot the live analyzer result for a real product URL. */
import { chromium } from "@playwright/test";

const TARGET = process.argv[2] ?? "https://www.uniqlo.com/uk/en/products/E475296-000";
const OUT = process.argv[3] ?? "analyzer-live.png";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 1100 } });
  await p.goto(`http://localhost:3000/analyze?url=${encodeURIComponent(TARGET)}`);
  await p.waitForSelector('[data-testid="analyze-result"]', { timeout: 90_000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: OUT, fullPage: true });
  await b.close();
  console.log("saved", OUT);
})();
