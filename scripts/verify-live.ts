/**
 * Live verification: drives the running app (localhost:3000) with a real
 * browser, exercises the concierge end-to-end (real Claude call), and saves
 * full-page screenshots. Not part of the test suite (costs a few paise).
 *
 * Run:  npx tsx scripts/verify-live.ts [outDir]
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = process.argv[2] ?? "verify-shots";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. home
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true });
  console.log("✓ home");

  // 2. search with linen filter
  await page.goto(`${BASE}/search?fabric=linen`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/02-search-linen.png`, fullPage: true });
  console.log("✓ search (linen filter)");

  // 3. product page
  await page.goto(`${BASE}/product/salt-stem-linen-shirt-white`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="sustainability-panel"]');
  await page.screenshot({ path: `${OUT}/03-product.png`, fullPage: true });
  console.log("✓ product page");

  // 4. concierge — LIVE Claude call with tool use
  await page.goto(BASE);
  await page.getByTestId("concierge-open").click();
  await page.getByTestId("concierge-input").fill(
    "I need a breathable linen shirt for hot weather, no polyester, under £40",
  );
  await page.getByTestId("concierge-input").press("Enter");
  console.log("… concierge thinking (live Claude call)");
  await page.waitForSelector('[data-testid="concierge-products"]', { timeout: 90_000 });
  await page.waitForTimeout(4000); // let the text finish streaming
  await page.screenshot({ path: `${OUT}/04-concierge.png`, fullPage: false });
  const reply = await page.locator('[data-testid="msg-assistant"]').last().innerText();
  console.log("✓ concierge replied with product cards. Reply excerpt:");
  console.log(reply.slice(0, 500));

  await browser.close();
}

main().catch((e) => {
  console.error("✗ verification failed:", e);
  process.exit(1);
});
