/** One-off: screenshot the fabric lens mid-hover. */
import { chromium } from "@playwright/test";

const OUT = process.argv[2] ?? "lens.png";

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto("http://localhost:3000/product/salt-stem-linen-shirt-white");
  await p.waitForSelector('[data-testid="fabric-lens"]');
  await p.getByTestId("fabric-lens").hover({ position: { x: 260, y: 300 } });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT });
  await b.close();
  console.log("saved", OUT);
})();
