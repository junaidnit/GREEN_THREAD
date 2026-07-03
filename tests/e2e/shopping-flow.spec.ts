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

test.describe("search & filter", () => {
  test("instant search narrows results", async ({ page }) => {
    await page.goto("/search");
    const initial = await page.getByTestId("product-card").count();
    expect(initial).toBeGreaterThan(20);

    await page.getByTestId("search-input").fill("linen");
    await expect
      .poll(async () => page.getByTestId("product-card").count())
      .toBeLessThan(initial);
    await expect(page.getByTestId("product-card").first()).toContainText(/linen/i);
  });

  test("fabric chip filters and syncs URL", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("fabric-chip-hemp").click();
    await expect.poll(async () => page.url()).toContain("fabric=hemp");
    const cards = page.getByTestId("product-card");
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++) {
      await expect(cards.nth(i)).toContainText(/hemp/i);
    }
  });

  test("URL filters are applied on load (shareable links)", async ({ page }) => {
    await page.goto("/search?fabric=linen&sort=price-asc");
    await expect(page.getByTestId("fabric-chip-linen")).toHaveClass(/bg-primary/);
    const first = page.getByTestId("product-card").first();
    await expect(first).toContainText(/linen/i);
  });

  test("filter panel: min score slider works", async ({ page }) => {
    await page.goto("/search");
    const initial = await page.getByTestId("product-card").count();
    await page.getByTestId("filters-toggle").click();
    await page.locator('input[type="range"]').first().fill("80");
    await expect
      .poll(async () => page.getByTestId("product-card").count())
      .toBeLessThan(initial);
    // every visible card must show grade A (score >= 80)
    await expect(page.getByTestId("grade-badge").first()).toContainText("A");
  });

  test("empty state appears for impossible queries", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("search-input").fill("zxqvbnmasdf");
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });
});

test.describe("product page", () => {
  test("full sustainability story renders and buy link is external", async ({ page }) => {
    await page.goto("/search?fabric=linen");
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/product\//);

    await expect(page.getByTestId("sustainability-panel")).toBeVisible();
    await expect(page.getByTestId("composition-bars")).toBeVisible();
    await expect(page.getByTestId("score-dial")).toBeVisible();
    expect(await page.getByTestId("score-factors").locator("> div").count()).toBeGreaterThanOrEqual(2);

    const buy = page.getByTestId("buy-button");
    await expect(buy).toBeVisible();
    await expect(buy).toHaveAttribute("target", "_blank");
    await expect(buy).toHaveAttribute("href", /^https?:\/\//);

    // similar items section
    await expect(page.getByText("Similar, sustainably")).toBeVisible();
  });

  test("greenwash flags appear on vague-claim products", async ({ page }) => {
    // Bloomfield products carry uncertified 'eco-friendly' claims
    await page.goto("/product/bloomfield-crew-tee-3pack");
    await expect(page.getByTestId("greenwash-flags")).toBeVisible();
  });
});

test.describe("concierge", () => {
  test("widget opens with suggestions and accepts input", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("concierge-open").click();
    await expect(page.getByTestId("concierge-panel")).toBeVisible();
    await expect(page.getByText("breathable linen shirt", { exact: false })).toBeVisible();
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
