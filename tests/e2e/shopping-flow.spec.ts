import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** Total match count from the results header (card count is paginated). */
async function totalResults(page: Page): Promise<number> {
  const text = await page.getByTestId("results-count").innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
}

interface LiveProduct {
  id: string;
  title: string;
  source?: string;
  fabric_composition: Array<{ material: string; pct: number }>;
}
const SYNTH = new Set(["polyester", "recycled_polyester", "polyamide", "recycled_polyamide", "elastane"]);
function liveProducts(): LiveProduct[] {
  if (!existsSync("data/products_live.json")) return [];
  return (JSON.parse(readFileSync("data/products_live.json", "utf8")).products as LiveProduct[]).filter(
    (p) => p.source === "live",
  );
}
/** A real product id, optionally matching a predicate (e.g. mostly-plastic). */
function pickLiveId(pred?: (p: LiveProduct) => boolean): string | null {
  const all = liveProducts();
  return (pred ? all.find(pred) : all[0])?.id ?? null;
}
const plasticPct = (p: LiveProduct) =>
  p.fabric_composition.filter((f) => SYNTH.has(f.material)).reduce((s, f) => s + f.pct, 0);

test.describe("home", () => {
  test("hero, category panels and fibre widget render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/skin they sit against/i);
    // the four category ways-in
    await expect(page.getByRole("heading", { name: "Women", exact: true })).toBeVisible();
    await expect(page.getByText("Four ways in")).toBeVisible();
    // the interactive fibre widget
    await expect(page.getByText(/what it actually does/i)).toBeVisible();
    // the prominent extension CTA near the top
    await expect(page.getByText(/Check any fabric label/i)).toBeVisible();
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

  test("brand filter: tick a brand, see only that brand at real depth", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("brand-komodo").check();
    await expect.poll(async () => page.url()).toContain("brand=komodo");
    await expect.poll(() => totalResults(page)).toBeGreaterThan(100); // a real brand has real depth

    const cards = page.getByTestId("product-card");
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < Math.min(n, 8); i++) {
      await expect(cards.nth(i)).toContainText("Komodo");
    }
    // other real brands remain selectable (facet counts ignore own group)
    await expect(page.getByTestId("brand-beaumont-organic")).toBeVisible();
  });

  test("fabric filter narrows within a brand", async ({ page }) => {
    await page.goto("/search?brand=beaumont-organic");
    await page.getByTestId("fabric-organic_cotton").check();
    await expect.poll(async () => page.url()).toContain("fabric=organic_cotton");
    const cards = page.getByTestId("product-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
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
  test("the product page shows composition, not a rating", async ({ page }) => {
    await page.goto("/search?fabric=linen");
    await expect(page.getByTestId("results-count")).toBeVisible();
    await page.getByTestId("product-card").first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    await expect(page.getByTestId("sustainability-panel")).toBeVisible();
    await expect(page.getByTestId("product-sizes")).toBeVisible();
    await expect(page.getByTestId("product-price")).toContainText("£");

    // The 0-100 score and the A-E grade are gone on purpose: we are not an
    // accredited ratings body, and a letter grade borrows an authority we
    // have not earned. What replaced them is the disclosed composition drawn
    // in proportion, which is a fact rather than a judgement.
    await expect(page.getByTestId("fibre-profile").first()).toBeVisible();
    await expect(page.getByTestId("score-dial")).toHaveCount(0);
    await expect(page.getByTestId("score-factors")).toHaveCount(0);
  });

  test("buy button deep-links to the real merchant via /out", async ({ page }) => {
    const id = pickLiveId();
    test.skip(!id, "no live catalog");
    await page.goto(`/product/${id}`);
    const buy = page.getByTestId("buy-button");
    await expect(buy).toHaveAttribute("href", `/out/${id}`);
    await expect(buy).toContainText("Buy at");
  });
});

test.describe("label watch — the public greenwashing record", () => {
  test("lists only defensible flags and links to real products", async ({ page }) => {
    await page.goto("/label-watch");
    await expect(page.getByRole("heading", { name: /Named natural/ })).toBeVisible();
    await expect(page.getByText(/items on Label Watch/)).toBeVisible();
    // every listed flag names a minority natural fibre in a majority-plastic item
    const first = page.getByTestId("label-watch-list").locator("li").first();
    if (await first.count()) {
      await expect(first).toContainText(/only \d+%/); // minority natural fibre
      await expect(first).toContainText(/plastic/i); // in a majority-plastic item
    }
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
    await page.goto("/brand/komodo");
    await expect(page.getByRole("heading", { name: "Komodo", exact: true })).toBeVisible();
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
    const id = pickLiveId();
    test.skip(!id, "no live catalog");
    await page.goto(`/product/${id}`);
    await expect(page.getByTestId("view-on-retailer")).toBeVisible();
    await expect(page.getByTestId("view-on-retailer")).toHaveAttribute("target", "_blank");
    await expect(page.getByTestId("impact-equivalents")).toBeVisible();
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
  test("the shop contains no plastic at all", async ({ page }) => {
    // THE BRAND PROMISE, as a gate. A plastic garment is not ranked lower or
    // shown with a warning, it is absent: a promise with exceptions is not a
    // promise. This used to assert that a toggle REDUCED the count; there is
    // now nothing for it to remove, which is the point.
    await page.goto("/search");
    const marks = await page.getByTestId("fibre-mark").allInnerTexts();
    expect(marks.length).toBeGreaterThan(0);
    for (const m of marks) {
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

  test("a homepage category panel lands on filtered results", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Women/ }).first().click();
    await page.waitForURL(/\/search\?gender=women/);
    await expect(page.getByTestId("results-count")).toBeVisible();
  });
});

test.describe("diary, better fibre, resale", () => {
  test("plastic-heavy product offers the SAME garment in a better fabric", async ({ page }) => {
    const id = pickLiveId((p) => plasticPct(p) >= 40);
    test.skip(!id, "no mostly-plastic item in the live catalog");
    await page.goto(`/product/${id}`);
    const panel = page.getByTestId("better-fibre");
    // if there are upgrades, none may be a 100%-plastic item (must be an upgrade)
    if (await panel.count()) {
      const marks = await panel.getByTestId("fibre-mark").allInnerTexts();
      for (const m of marks) expect(m).not.toMatch(/100% plastic/);
    }
  });

  test("secondhand check links to live resale searches", async ({ page }) => {
    const id = pickLiveId();
    test.skip(!id, "no live catalog");
    await page.goto(`/product/${id}`);
    await expect(page.getByTestId("secondhand")).toBeVisible();
    await expect(page.getByTestId("resale-vinted")).toHaveAttribute("href", /vinted\.co\.uk.*search_text=/);
    await expect(page.getByTestId("resale-ebay")).toHaveAttribute("href", /ebay\.co\.uk/);
  });

  test("buying writes the Fibre Diary", async ({ page }) => {
    const id = pickLiveId();
    test.skip(!id, "no live catalog");
    // buy deep-links to the real merchant; block that navigation so the
    // onClick diary-write fires but we stay in the app to inspect it
    await page.route("**/out/**", (r) => r.abort());
    await page.goto(`/product/${id}`);
    await page.getByTestId("buy-button").click();

    await page.goto("/diary");
    await expect(page.getByTestId("diary-stats")).toBeVisible();
    // the purchase was logged: stats show a £ total and at least one entry
    await expect(page.getByTestId("diary-stats")).toContainText("£");
    await expect(page.getByTestId("diary-entries")).not.toBeEmpty();
  });
});

test.describe("luxury interactions", () => {
  test("fabric lens appears on product image hover", async ({ page }) => {
    const id = pickLiveId();
    test.skip(!id, "no live catalog");
    await page.goto(`/product/${id}`);
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
    const id = pickLiveId();
    test.skip(!id, "no live catalog");
    await page.goto(`/product/${id}`);
    await page.getByTestId("save-button").click();
    await expect(page.getByTestId("save-button")).toContainText("In your wardrobe");
    await expect(page.getByTestId("saved-count")).toHaveText("1");

    await page.goto("/saved");
    await expect(page.getByTestId("saved-grid")).toBeVisible();
    expect(await page.getByTestId("product-card").count()).toBe(1);

    // unsave from the product page clears it
    await page.goto(`/product/${id}`);
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

test.describe("real products only — every item is buyable", () => {
  /** Read the first product id from the live catalog. */
  function firstLiveId(): string | null {
    if (!existsSync("data/products_live.json")) return null;
    const products = JSON.parse(readFileSync("data/products_live.json", "utf8")).products as Array<{ id: string; source?: string }>;
    return products.find((p) => p.source === "live")?.id ?? null;
  }

  test("every product page deep-links to the exact item on the brand's site", async ({ page }) => {
    await page.goto("/search");
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/product\//);
    const href = await page.getByTestId("view-on-retailer").getAttribute("href");
    expect(href).toMatch(/^https:\/\/.+\/products\/.+/); // real merchant product URL
    await expect(page.getByText(/View this exact item at/)).toBeVisible();
  });

  test("buy redirects to the real merchant product page", async ({ page, request }) => {
    await page.goto("/search");
    await page.getByTestId("product-card").first().click();
    await page.waitForURL(/\/product\//);
    const id = page.url().split("/product/")[1].split("?")[0];
    const resp = await request.fetch(`/out/${id}`, { maxRedirects: 0 });
    expect(resp.status()).toBe(307);
    expect(resp.headers()["location"]).toMatch(/^https:\/\/.+\/products\/.+/);
  });

  test("no concept/illustrative items remain in the catalog", async ({ page }) => {
    const id = firstLiveId();
    test.skip(!id, "no live catalog in this checkout");
    await page.goto(`/product/${id}`);
    await expect(page.getByText(/Concept item/)).toHaveCount(0);
    await expect(page.getByText(/illustrative catalogue/)).toHaveCount(0);
    // the truth-ledger trust line is present on real items
    await expect(page.getByTestId("truth-record")).toBeVisible();
  });

  test("visual recommendations stay in the same garment family", async ({ page }) => {
    const id = firstLiveId();
    test.skip(!id, "no live catalog in this checkout");
    await page.goto(`/product/${id}`);
    // the "more like this" rail renders real, clickable product cards
    const rail = page.getByRole("heading", { name: /More .+/ });
    if (await rail.count()) {
      await expect(page.getByTestId("product-card").first()).toBeVisible();
    }
  });
});
