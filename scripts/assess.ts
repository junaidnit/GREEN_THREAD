/**
 * Mystery-shopper audit: drives the running app like real users and logs
 * hard observations for a business assessment.
 * Run:  npx tsx scripts/assess.ts <shotDir>
 */
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const OUT = process.argv[2] ?? "assess-shots";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  /* ── 1. search like users ── */
  const queries = [
    "tshirt", "t shirt", "jeans", "linen shirt", "wedding guest dress",
    "gym leggings", "warm winter coat", "hoody", "organic cotton",
    "zarra", "red dress", "socks", "top", "office trousers", "vest",
  ];
  console.log("== SEARCH RESULTS ==");
  for (const q of queries) {
    const t0 = Date.now();
    await page.goto(`${BASE}/search?q=${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector('[data-testid="results-count"]', { timeout: 15000 });
    } catch { console.log(`"${q}": NO RESULTS COUNT RENDERED`); continue; }
    const count = await page.getByTestId("results-count").innerText();
    const titles = await page.getByTestId("product-card").locator("h3").allInnerTexts();
    const empty = await page.getByTestId("empty-state").count();
    console.log(`"${q}": ${count.replace(/\n/g, " ")} (${Date.now() - t0}ms)${empty ? " [EMPTY STATE]" : ""} | top: ${titles.slice(0, 3).join(" · ")}`);
  }

  /* ── 2. payload + perf ── */
  console.log("\n== PERF ==");
  const t0 = Date.now();
  const resp = await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  const html = (await resp!.body()).length;
  console.log(`/search HTML: ${(html / 1024).toFixed(0)} KB, networkidle in ${Date.now() - t0}ms`);
  const cardCount = await page.getByTestId("product-card").count();
  console.log(`cards rendered initially: ${cardCount}`);

  /* ── 3. filter combos ── */
  console.log("\n== FILTER COMBOS ==");
  await page.goto(`${BASE}/search?brand=zara&fabric=organic_cotton`);
  console.log(`Zara + organic cotton: ${await page.getByTestId("results-count").innerText()}`);
  await page.goto(`${BASE}/search?size=XL&color=Black&minScore=70`);
  console.log(`XL + Black + score>=70: ${await page.getByTestId("results-count").innerText()}`);
  await page.goto(`${BASE}/search?q=tshirt`);
  const bannerVisible = await page.getByTestId("refine-banner").count().catch(() => 0);
  console.log(`refinement banner on "tshirt": ${bannerVisible > 0 ? "visible" : "NOT FOUND"}`);
  await page.screenshot({ path: `${OUT}/01-search-tshirt.png` });

  /* ── 4. product page & buy ── */
  await page.goto(`${BASE}/search?q=jeans`);
  await page.getByTestId("product-card").first().click();
  await page.waitForURL(/\/product\//);
  await page.waitForSelector('[data-testid="sustainability-panel"]');
  const price = await page.getByTestId("product-price").innerText();
  const factors = await page.getByTestId("score-factors").locator("> div").count();
  console.log(`\n== PRODUCT PAGE ==\nprice: ${price}, score factors: ${factors}`);
  await page.screenshot({ path: `${OUT}/02-product.png`, fullPage: true });
  await page.getByTestId("buy-button").click();
  await page.waitForURL(/\/retailer\//);
  console.log(`buy flow: landed on ${page.url()}`);
  await page.screenshot({ path: `${OUT}/03-retailer.png` });

  /* ── 5. mobile ── */
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(`${BASE}/search?q=dress`);
  await mob.waitForSelector('[data-testid="results-count"]');
  const mobileFilterBtn = await mob.getByTestId("filters-toggle").isVisible();
  console.log(`\n== MOBILE ==\nfilter button visible: ${mobileFilterBtn}`);
  await mob.getByTestId("filters-toggle").click();
  await mob.waitForTimeout(400);
  const drawer = await mob.getByTestId("filter-drawer").isVisible().catch(() => false);
  console.log(`filter drawer opens: ${drawer}`);
  await mob.screenshot({ path: `${OUT}/04-mobile-drawer.png` });
  await mob.close();

  /* ── 6. concierge (one live call) ── */
  console.log("\n== CONCIERGE (live) ==");
  await page.goto(BASE);
  await page.getByTestId("concierge-open").click();
  await page.getByTestId("concierge-input").fill(
    "Smart outfit for a summer wedding, natural fabrics only, under £100 total",
  );
  await page.getByTestId("concierge-input").press("Enter");
  try {
    await page.waitForSelector('[data-testid="concierge-products"]', { timeout: 90_000 });
    await page.waitForTimeout(4000);
    const reply = await page.locator('[data-testid="msg-assistant"]').last().innerText();
    console.log(`reply length: ${reply.length} chars`);
    console.log(reply.slice(0, 400));
    await page.screenshot({ path: `${OUT}/05-concierge.png` });
  } catch {
    console.log("concierge FAILED to reply in 90s");
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
