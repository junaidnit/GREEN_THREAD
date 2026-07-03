import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("hero, fabric categories and top picks render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("fabric");
    await expect(page.getByTestId("home-fabric-linen")).toBeVisible();
    expect(await page.getByTestId("product-card").count()).toBeGreaterThanOrEqual(4);
  });

  test("home search navigates to results", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-search-input").fill("linen shirt");
    await page.getByTestId("home-search-input").press("Enter");
    await page.waitForURL(/\/search\?q=linen/);
    await expect(page.getByTestId("results-count")).toContainText("linen shirt");
  });
});

test.describe("the shopper journey: search a top, narrow it down", () => {
  test('"top" surfaces tops from every brand at once', async ({ page }) => {
    await page.goto("/search?q=top");
    const n = await page.getByTestId("product-card").count();
    expect(n).toBeGreaterThan(10); // tees + shirts + knits across brands
    await expect(page.getByTestId("results-count")).toContainText("top");
  });

  test("brand filter: tick Zara, see only Zara; counts stay visible", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("brand-zara").check();
    await expect.poll(async () => page.url()).toContain("brand=zara");

    const cards = page.getByTestId("product-card");
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++) {
      await expect(cards.nth(i)).toContainText("Zara");
    }
    // other brands remain selectable (facet counts ignore own group)
    await expect(page.getByTestId("brand-h-and-m")).toBeVisible();
  });

  test("fabric filter narrows within a brand (Zara → TENCEL)", async ({ page }) => {
    await page.goto("/search?brand=zara");
    await page.getByTestId("fabric-tencel_lyocell").check();
    await expect.poll(async () => page.url()).toContain("fabric=tencel_lyocell");
    const cards = page.getByTestId("product-card");
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < n; i++) {
      await expect(cards.nth(i)).toContainText(/tencel|lyocell/i);
    }
  });

  test("size filter works with counts", async ({ page }) => {
    await page.goto("/search");
    const initial = await page.getByTestId("product-card").count();
    await page.getByTestId("size-XL").click();
    await expect
      .poll(async () => page.getByTestId("product-card").count())
      .toBeLessThan(initial);
    await expect.poll(async () => page.url()).toContain("size=XL");
  });

  test("instant search narrows results and prices show £", async ({ page }) => {
    await page.goto("/search");
    const initial = await page.getByTestId("product-card").count();
    expect(initial).toBeGreaterThan(20);

    await page.getByTestId("search-input").fill("linen");
    await expect
      .poll(async () => page.getByTestId("product-card").count())
      .toBeLessThan(initial);
    await expect(page.getByTestId("product-card").first()).toContainText(/linen/i);
    await expect(page.getByTestId("product-card").first()).toContainText("£");
  });

  test("URL filters are applied on load (shareable links)", async ({ page }) => {
    await page.goto("/search?fabric=linen&sort=price-asc");
    await expect(page.getByTestId("fabric-linen")).toBeChecked();
    await expect(page.getByTestId("product-card").first()).toContainText(/linen/i);
  });

  test("min score slider filters low scorers out", async ({ page }) => {
    await page.goto("/search");
    const initial = await page.getByTestId("product-card").count();
    // keyboard-drive the slider: fill() sets DOM value without firing React's
    // onChange in React 19, so step from 0 → 70 with arrow keys (step=5)
    const slider = page.getByTestId("min-score-slider");
    await slider.focus();
    for (let i = 0; i < 14; i++) await slider.press("ArrowRight");
    await expect(page.getByText("Minimum: 70/100")).toBeVisible();
    await expect
      .poll(async () => page.getByTestId("product-card").count())
      .toBeLessThan(initial);
    const badgeText = await page.getByTestId("grade-badge").first().innerText();
    const score = Number(badgeText.replace(/[^0-9]/g, ""));
    expect(score).toBeGreaterThanOrEqual(70);
  });

  test("fabric fact card opens with research citation", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("fabric-filter").getByRole("button", { name: /About Linen/i }).click();
    await expect(page.getByText("European Confederation of Flax")).toBeVisible();
  });

  test("empty state appears for impossible queries", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("search-input").fill("zxqvbnmasdf");
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });
});

test.describe("product page & buy flow", () => {
  test("full sustainability story renders with sizes and £", async ({ page }) => {
    await page.goto("/search?fabric=linen");
    await expect(page.getByTestId("results-count")).toBeVisible();
    await page.getByTestId("product-card").first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    await expect(page.getByTestId("sustainability-panel")).toBeVisible();
    await expect(page.getByTestId("composition-bars")).toBeVisible();
    await expect(page.getByTestId("score-dial")).toBeVisible();
    await expect(page.getByTestId("product-sizes")).toBeVisible();
    await expect(page.getByTestId("product-price")).toContainText("£");
    expect(await page.getByTestId("score-factors").locator("> div").count()).toBeGreaterThanOrEqual(2);
  });

  test("buy button lands straight on the retailer checkout, item in bag", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    await page.getByTestId("buy-button").click();
    await expect(page).toHaveURL(/\/retailer\//, { timeout: 30_000 });
    await expect(page.getByTestId("retailer-checkout")).toBeVisible();
    await expect(page.getByText("Your bag — 1 item")).toBeVisible();
    await expect(page.getByTestId("checkout-total")).toContainText("£");
    await expect(page.getByTestId("retailer-pay-button")).toBeVisible();
  });

  test("greenwash flags appear on vague-claim products", async ({ page }) => {
    await page.goto("/product/bloomfield-crew-tee-3pack");
    await expect(page.getByTestId("greenwash-flags")).toBeVisible();
  });
});

test.describe("concierge", () => {
  test("widget opens with suggestions and accepts input", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("concierge-open").click();
    await expect(page.getByTestId("concierge-panel")).toBeVisible();
    await expect(page.getByText("breathable linen top", { exact: false })).toBeVisible();
    await page.getByTestId("concierge-input").fill("test message");
    await expect(page.getByTestId("concierge-input")).toHaveValue("test message");
  });
});

test.describe("theme", () => {
  test("dark mode toggles and persists", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
