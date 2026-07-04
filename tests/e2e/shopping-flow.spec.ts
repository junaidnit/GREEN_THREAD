import { expect, test, type Page } from "@playwright/test";

/** Total match count from the results header (card count is paginated). */
async function totalResults(page: Page): Promise<number> {
  const text = await page.getByTestId("results-count").innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
}

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
  test('"tshirt" search has marketplace depth (hundreds of items)', async ({ page }) => {
    await page.goto("/search?q=tshirt");
    await expect.poll(() => totalResults(page)).toBeGreaterThan(100);
  });

  test('"jeans" search has marketplace depth', async ({ page }) => {
    await page.goto("/search?q=jeans");
    await expect.poll(() => totalResults(page)).toBeGreaterThan(100);
  });

  test("refinement banner invites narrowing without hiding results", async ({ page }) => {
    await page.goto("/search?q=tshirt");
    await expect(page.getByTestId("refine-banner")).toBeVisible();
    // results are visible UNDER the banner — no friction
    expect(await page.getByTestId("product-card").count()).toBeGreaterThan(0);

    const before = await totalResults(page);
    await page.getByTestId("refine-fit-Oversized").click();
    await expect.poll(async () => page.url()).toContain("fit=Oversized");
    await expect.poll(() => totalResults(page)).toBeLessThan(before);
    // banner steps aside once a refinement is picked
    await expect(page.getByTestId("refine-banner")).toBeHidden();
    // and can be dismissed on a fresh broad search
    await page.goto("/search?q=dress");
    await page.getByRole("button", { name: "Dismiss refinements" }).click();
    await expect(page.getByTestId("refine-banner")).toBeHidden();
  });

  test("brand filter: tick Zara, see only Zara at real depth", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("brand-zara").check();
    await expect.poll(async () => page.url()).toContain("brand=zara");
    await expect.poll(() => totalResults(page)).toBeGreaterThan(100); // 100-200 per brand

    const cards = page.getByTestId("product-card");
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < Math.min(n, 8); i++) {
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
    for (let i = 0; i < Math.min(n, 8); i++) {
      await expect(cards.nth(i)).toContainText(/tencel|lyocell/i);
    }
  });

  test("size filter works with counts", async ({ page }) => {
    await page.goto("/search");
    const initial = await totalResults(page);
    await page.getByTestId("size-XL").click();
    await expect.poll(() => totalResults(page)).toBeLessThan(initial);
    await expect.poll(async () => page.url()).toContain("size=XL");
  });

  test("instant search narrows results and prices show £", async ({ page }) => {
    await page.goto("/search");
    const initial = await totalResults(page);
    expect(initial).toBeGreaterThan(1000); // full marketplace catalog

    await page.getByTestId("search-input").fill("linen shirt");
    await expect.poll(() => totalResults(page)).toBeLessThan(initial);
    await expect(page.getByTestId("product-card").first()).toContainText(/linen/i);
    await expect(page.getByTestId("product-card").first()).toContainText("£");
  });

  test("infinite scroll loads more products", async ({ page }) => {
    await page.goto("/search");
    const firstPage = await page.getByTestId("product-card").count();
    expect(firstPage).toBeLessThanOrEqual(24);
    await page.keyboard.press("End"); // jump to bottom → sentinel triggers
    await expect
      .poll(async () => page.getByTestId("product-card").count())
      .toBeGreaterThan(firstPage);
  });

  test("URL filters are applied on load (shareable links)", async ({ page }) => {
    await page.goto("/search?fabric=linen&sort=price-asc");
    await expect(page.getByTestId("fabric-linen")).toBeChecked();
    await expect(page.getByTestId("product-card").first()).toContainText(/linen/i);
  });

  test("min score slider filters low scorers out", async ({ page }) => {
    await page.goto("/search");
    const initial = await totalResults(page);
    // keyboard-drive the slider: fill() sets DOM value without firing React's
    // onChange in React 19, so step from 0 → 70 with arrow keys (step=5)
    const slider = page.getByTestId("min-score-slider");
    await slider.focus();
    for (let i = 0; i < 14; i++) await slider.press("ArrowRight");
    await expect(page.getByText("Minimum: 70/100")).toBeVisible();
    await expect.poll(() => totalResults(page)).toBeLessThan(initial);
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

test.describe("fixes & subtle features", () => {
  test('"hoody" finds hoodies now', async ({ page }) => {
    await page.goto("/search?q=hoody");
    expect(await page.getByTestId("product-card").count()).toBeGreaterThan(5);
  });

  test('"t shirt" no longer floods the whole catalog', async ({ page }) => {
    await page.goto("/search?q=t%20shirt");
    const count = await page.getByTestId("product-card").count();
    const text = await page.getByTestId("results-count").innerText();
    const total = Number(text.match(/(\d+)/)?.[1] ?? 0);
    expect(total).toBeLessThan(800);
    expect(count).toBeGreaterThan(0);
  });

  test("methodology page publishes the rubric", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.getByRole("heading", { name: "How we score" })).toBeVisible();
    await expect(page.getByText("Fibre impact scores")).toBeVisible();
  });

  test("brand page shows profile and products", async ({ page }) => {
    await page.goto("/brand/zara");
    await expect(page.getByRole("heading", { name: "Zara", exact: true })).toBeVisible();
    await expect(page.getByTestId("grade-badge").first()).toBeVisible();
    expect(await page.getByTestId("product-card").count()).toBeGreaterThan(8);
  });

  test("fabric guide page educates and lists products", async ({ page }) => {
    await page.goto("/fabric/linen");
    await expect(page.getByRole("heading", { name: "Linen", exact: true })).toBeVisible();
    await expect(page.getByText("European Confederation of Flax").first()).toBeVisible();
    expect(await page.getByTestId("product-card").count()).toBeGreaterThan(4);
  });

  test("product page: retailer link, impact chips, concierge handoff", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    await expect(page.getByTestId("view-on-retailer")).toBeVisible();
    await expect(page.getByTestId("view-on-retailer")).toHaveAttribute("target", "_blank");
    await expect(page.getByTestId("impact-equivalents")).toBeVisible();
    await expect(page.getByTestId("category-delta")).toBeVisible();
    await page.getByTestId("ask-concierge").click();
    await expect(page.getByTestId("concierge-panel")).toBeVisible();
  });

  test("analyzer page renders and validates input", async ({ page }) => {
    await page.goto("/analyze");
    await expect(page.getByTestId("analyze-input")).toBeVisible();
    // mock the API so e2e stays offline and free
    await page.route("**/api/analyze", (route) =>
      route.fulfill({
        json: {
          url: "https://example-shop.com/tee", site: "example-shop.com",
          title: "Test Organic Tee", image: null, price_text: "£25",
          found_composition: true,
          fabric_composition: [{ material: "organic_cotton", label: "Organic cotton", pct: 100 }],
          certifications: ["GOTS"], practices: {}, greenwash_flags: [],
          explanation: "Solid organic cotton basic.",
          score: 66, grade: "B",
          factors: [{ label: "Fibre composition", points: 56, detail: "100% organic cotton" }],
        },
      }),
    );
    await page.getByTestId("analyze-input").fill("https://example-shop.com/tee");
    await page.getByTestId("analyze-submit").click();
    await expect(page.getByTestId("analyze-result")).toBeVisible();
    await expect(page.getByText("Test Organic Tee")).toBeVisible();
    await expect(page.getByTestId("analyze-visit")).toHaveAttribute("href", /example-shop/);
  });

  test("pasting a URL into home search routes to Fabric Check", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-search-input").fill("https://shop.example.com/product/1");
    await page.getByTestId("home-search-input").press("Enter");
    await page.waitForURL(/\/analyze\?url=/);
  });
});

test.describe("luxury interactions", () => {
  test("fabric lens appears on product image hover", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    const lens = page.getByTestId("fabric-lens");
    await lens.hover({ position: { x: 200, y: 200 } });
    await expect(page.getByText("Inspecting the weave", { exact: false })).toBeVisible();
  });

  test("save arcs into the wardrobe and persists", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    await page.getByTestId("save-button").click();
    await expect(page.getByTestId("save-button")).toContainText("In your wardrobe");
    await expect(page.getByTestId("saved-count")).toHaveText("1");

    await page.goto("/saved");
    await expect(page.getByTestId("saved-grid")).toBeVisible();
    expect(await page.getByTestId("product-card").count()).toBe(1);

    // unsave from the product page clears it
    await page.goto("/product/salt-stem-linen-shirt-white");
    await page.getByTestId("save-button").click();
    await expect(page.getByTestId("save-button")).toContainText("Save");
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
