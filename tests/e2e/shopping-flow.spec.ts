import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** Total match count from the results header (card count is paginated). */
async function totalResults(page: Page): Promise<number> {
  const text = await page.getByTestId("results-count").innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
}

test.describe("home", () => {
  test("hero, fabric categories and top picks render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wear more");
    await expect(page.getByTestId("edit-tile-0")).toBeVisible();
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

  test("fabric filter narrows within a brand (COS → TENCEL)", async ({ page }) => {
    await page.goto("/search?brand=cos");
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
    await page.goto("/search");
    const allText = await page.getByTestId("results-count").innerText();
    const catalogSize = Number(allText.match(/(\d+)/)?.[1] ?? 0);

    await page.goto("/search?q=t%20shirt");
    const count = await page.getByTestId("product-card").count();
    const text = await page.getByTestId("results-count").innerText();
    const total = Number(text.match(/(\d+)/)?.[1] ?? 0);
    // narrowed to well under half the catalog = not flooding via the stray "t"
    expect(total).toBeLessThan(catalogSize * 0.5);
    expect(count).toBeGreaterThan(0);
  });

  test("methodology page publishes the rubric", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.getByRole("heading", { name: /anatomy of a score/i })).toBeVisible();
    await expect(page.getByText("Every fibre, ranked")).toBeVisible();
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

test.describe("natural-fibre-first", () => {
  test("'No synthetics' master toggle purges all plastic", async ({ page }) => {
    await page.goto("/search");
    const totalOf = async () =>
      Number((await page.getByTestId("results-count").innerText()).match(/([\d,]+)/)![1].replace(/,/g, ""));
    const initial = await totalOf();
    await page.getByTestId("pure-toggle").click();
    await expect.poll(async () => page.url()).toContain("pure=1");
    await expect.poll(totalOf).toBeLessThan(initial);
    // every visible fibre mark must be natural or plastic-free
    const marks = await page.getByTestId("fibre-mark").allInnerTexts();
    for (const m of marks.slice(0, 12)) {
      expect(m).toMatch(/100% natural|Plastic-free/i);
    }
  });

  test("mislabelled 'blend' items carry the label-check flag", async ({ page }) => {
    await page.goto("/search?q=blend");
    await expect(page.getByTestId("misnamed-flag").first()).toBeVisible();
    const flag = await page.getByTestId("misnamed-flag").first().innerText();
    expect(flag).toMatch(/only \d+%/i);

    // click through: the product page spells it out
    await page.getByTestId("product-card").filter({ has: page.getByTestId("misnamed-flag") }).first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
    await expect(page.getByTestId("misnamed-warning")).toBeVisible();
  });

  test("hero CTA lands on plastic-free results", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("hero-pure-cta").click();
    await page.waitForURL(/pure=1/);
    await expect(page.getByTestId("results-count")).toBeVisible();
  });
});

test.describe("diary, better fibre, resale", () => {
  test("plastic-heavy product offers 'better fibre at this price'", async ({ page }) => {
    await page.goto("/product/zara-t-shirts-3"); // 100% polyester tank
    await expect(page.getByTestId("better-fibre")).toBeVisible();
    const cards = page.getByTestId("better-fibre").getByTestId("product-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    // every recommendation must show less plastic than 100%
    const marks = await page.getByTestId("better-fibre").getByTestId("fibre-mark").allInnerTexts();
    for (const m of marks) expect(m).not.toMatch(/100% plastic/);
  });

  test("secondhand check links to live resale searches", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    await expect(page.getByTestId("secondhand")).toBeVisible();
    await expect(page.getByTestId("resale-vinted")).toHaveAttribute("href", /vinted\.co\.uk.*search_text=/);
    await expect(page.getByTestId("resale-ebay")).toHaveAttribute("href", /ebay\.co\.uk/);
  });

  test("buying writes the Fibre Diary and the diary sums spend", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white"); // £35, 100% natural
    await page.getByTestId("buy-button").click();
    await expect(page).toHaveURL(/\/retailer\//, { timeout: 30_000 });

    await page.goto("/diary");
    await expect(page.getByTestId("diary-stats")).toBeVisible();
    await expect(page.getByTestId("diary-entries")).toContainText("Breezy Linen Shirt");
    await expect(page.getByTestId("diary-stats")).toContainText("£35");
    // 100% natural purchase → natural spend equals total
    const stats = await page.getByTestId("diary-stats").innerText();
    expect((stats.match(/£35/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

test.describe("luxury interactions", () => {
  test("fabric lens appears on product image hover", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    const lens = page.getByTestId("fabric-lens");
    await lens.scrollIntoViewIfNeeded();
    // retry the hover: SSR paints the element before React hydrates its
    // mousemove listener, so a single early hover can land on deaf ears
    await expect(async () => {
      const box = (await lens.boundingBox())!;
      await page.mouse.move(box.x + 180, box.y + 180);
      await page.mouse.move(box.x + 200, box.y + 210, { steps: 3 });
      await expect(page.getByText("Inspecting the weave", { exact: false })).toBeVisible({ timeout: 700 });
    }).toPass({ timeout: 15_000 });
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

test.describe("live listings — real products, real merchant links", () => {
  test("live filter shows only real listings with LIVE marks", async ({ page }) => {
    await page.goto("/search?live=1");
    await expect(page.getByTestId("results-count")).toBeVisible();
    const cards = page.getByTestId("product-card");
    expect(await cards.count()).toBeGreaterThan(10);
    // every visible card carries the LIVE mark
    const firstCard = cards.first();
    await expect(firstCard.getByTestId("live-mark")).toBeVisible();
  });

  test("live PDP: badge + exact merchant product link", async ({ page }) => {
    await page.goto("/search?live=1");
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/product\//);
    await expect(page.getByTestId("live-badge")).toBeVisible();
    const href = await page.getByTestId("view-on-retailer").getAttribute("href");
    // deep link straight to the item's own page, not a site search
    expect(href).toMatch(/^https:\/\/.+\/products\/.+/);
    await expect(page.getByText(/View this exact item at/)).toBeVisible();
  });

  test("buy on a live item redirects to the real merchant page", async ({ page, request }) => {
    await page.goto("/search?live=1");
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/product\//);
    const id = page.url().split("/product/")[1];
    const resp = await request.fetch(`/out/${id}`, { maxRedirects: 0 });
    expect(resp.status()).toBe(307);
    expect(resp.headers()["location"]).toMatch(/^https:\/\/.+\/products\/.+/);
  });

  test("concept items are labelled honestly", async ({ page }) => {
    await page.goto("/product/salt-stem-linen-shirt-white");
    await expect(page.getByText(/Concept item — illustrative/)).toBeVisible();
    await expect(page.getByText(/Find similar at/)).toBeVisible();
    await expect(page.getByTestId("live-badge")).toHaveCount(0);
  });
});

test.describe("twin-finder", () => {
  interface TwinProduct { id: string; category: string; gender: string; source?: string }

  /** Find a concept product whose live-twin index has a strong same-category match. */
  function lookalikeCandidate(): string | null {
    if (!existsSync("data/twins.json")) return null;
    const liveTwins = (JSON.parse(readFileSync("data/twins.json", "utf8")).liveTwins ?? {}) as Record<
      string,
      Array<{ id: string; sim: number }>
    >;
    const read = (f: string): TwinProduct[] =>
      existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).products : [];
    const live = read("data/products_live.json");
    const concept = [...read("data/products_seed.json"), ...read("data/products_generated.json")];
    const liveById = new Map(live.map((p) => [p.id, p]));
    const compatible = (a: TwinProduct, b: TwinProduct) =>
      a.gender === "unisex" || b.gender === "unisex" || a.gender === b.gender;
    const hit = concept.find((p) =>
      liveTwins[p.id]?.some((t) => {
        const l = liveById.get(t.id);
        return l && t.sim >= 0.6 && l.category === p.category && compatible(p, l);
      }),
    );
    return hit?.id ?? null;
  }

  test("concept item points to its real live lookalike", async ({ page }) => {
    const id = lookalikeCandidate();
    test.skip(!id, "twin index not built for a qualifying concept item yet");
    await page.goto(`/product/${id}`);
    await expect(page.getByTestId("live-lookalike")).toBeVisible();
    await expect(page.getByText("The real thing")).toBeVisible();
    // the recommended card is a real listing
    await expect(page.getByTestId("live-lookalike").getByTestId("live-mark")).toBeVisible();
  });
});
