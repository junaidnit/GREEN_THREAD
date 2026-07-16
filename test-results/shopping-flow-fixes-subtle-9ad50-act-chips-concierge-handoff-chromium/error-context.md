# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shopping-flow.spec.ts >> fixes & subtle features >> product page: retailer link, impact chips, concierge handoff
- Location: tests\e2e\shopping-flow.spec.ts:218:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('concierge-panel')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('concierge-panel')

```

```yaml
- link "Paste any product link — we read the label for you · Try Fabric Check":
  - /url: /analyze
- banner:
  - link "GreenThread home":
    - /url: /
    - text: greenthread
  - navigation:
    - link "Brands":
      - /url: /brands
    - link "Browse":
      - /url: /search
    - link "Diary":
      - /url: /diary
    - link "Fabric Check":
      - /url: /analyze
    - link "Saved items":
      - /url: /saved
      - img
    - button "Toggle theme":
      - img
- main:
  - navigation:
    - link "Browse":
      - /url: /search
    - text: /
    - link "Shirts":
      - /url: /search?category=shirts
    - text: /Breezy Linen Shirt — White
  - img "Breezy Linen Shirt — White"
  - text: B 70
  - paragraph: hover to inspect the weave
  - paragraph: Seasalt Cornwall
  - heading "Breezy Linen Shirt — White" [level=1]
  - paragraph: £35
  - paragraph: Available sizes · Regular fit
  - text: XS S M L XL
  - link "Buy at Seasalt Cornwall":
    - /url: /out/salt-stem-linen-shirt-white
    - text: Buy at Seasalt Cornwall
    - img
  - link "Find similar at Seasalt Cornwall":
    - /url: https://www.seasaltcornwall.com/search?q=Breezy%20Linen%20Shirt
    - text: Find similar at Seasalt Cornwall
    - img
  - button "Save":
    - img
    - text: Save
  - paragraph: Concept item — illustrative catalogue entry. Buy opens a simulated checkout to demo the journey.
  - img
  - paragraph: ≈ 2,275 L water saved
  - paragraph: Versus the same weight of conventional cotton fibre (industry LCA averages).
  - paragraph: Built to last ≈ 150 wears— that's about £0.23 per wear if you keep it in rotation.
  - heading "What it's made of" [level=2]
  - text: 100% natural European Flax certified linen 100%
  - paragraph: Hover any fibre to learn its impact.
  - img
  - text: European Flax
  - paragraph:
    - img
    - text: Composition read from the label by our extraction pipeline
  - img
  - text: 70 grade B
  - paragraph: 11 pts above the average shirt
  - link "Scored with a transparent rubric — see how scoring works →":
    - /url: /methodology
  - heading "Why this score?" [level=2]
  - paragraph: "This shirt is genuinely a solid sustainable pick: it's 100% European Flax certified linen, a fiber that requires much less water and fewer inputs than conventional cotton, and the certification verifies responsible European flax farming. The weak point is that beyond the fiber and dye claim there's no info on manufacturing conditions, dyeing certification, or end-of-life programs, so the sustainability story stops at the raw material stage."
  - button "the honest read →"
  - paragraph: Fibre composition
  - text: "+63"
  - paragraph: Certifications
  - text: "+3"
  - paragraph: Brand practices
  - text: "+4"
  - paragraph: About Seasalt Cornwall
  - paragraph: Cornish clothing brand and an early adopter of organic cotton (Soil Association certified), focused on durable everyday pieces.
  - button "Ask the concierge about this":
    - img
    - text: Ask the concierge about this
  - paragraph: Already made
  - heading "Check it secondhand first" [level=2]
  - paragraph: The lowest-impact garment is one that already exists. Search this piece across the resale platforms before buying new.
  - link "Vinted UK's biggest secondhand wardrobe":
    - /url: https://www.vinted.co.uk/catalog?search_text=Seasalt%20Cornwall%20Breezy%20Linen%20Shirt
    - paragraph:
      - text: Vinted
      - img
    - paragraph: UK's biggest secondhand wardrobe
  - link "eBay New & pre-loved, buyer protected":
    - /url: https://www.ebay.co.uk/sch/i.html?_nkw=Seasalt%20Cornwall%20Breezy%20Linen%20Shirt&LH_ItemCondition=3000
    - paragraph:
      - text: eBay
      - img
    - paragraph: New & pre-loved, buyer protected
  - link "Depop Curated resale, fashion-first":
    - /url: https://www.depop.com/search/?q=Seasalt%20Cornwall%20Breezy%20Linen%20Shirt
    - paragraph:
      - text: Depop
      - img
    - paragraph: Curated resale, fashion-first
  - link "Vestiaire Collective Authenticated designer resale":
    - /url: https://www.vestiairecollective.com/search/?q=Seasalt%20Cornwall%20Breezy%20Linen%20Shirt
    - paragraph:
      - text: Vestiaire Collective
      - img
    - paragraph: Authenticated designer resale
  - heading "Similar, sustainably" [level=2]
  - link "Relaxed Linen Shirt — Multi 100% natural B 72 100% Linen · unverified eco-claims Seasalt Cornwall Relaxed Linen Shirt — Multi £43":
    - /url: /product/seasalt-shirts-9
    - img "Relaxed Linen Shirt — Multi"
    - text: 100% natural B 72
    - paragraph: 100% Linen · unverified eco-claims
    - paragraph: Seasalt Cornwall
    - heading "Relaxed Linen Shirt — Multi" [level=3]
    - paragraph: £43
  - link "Breezy Linen Shirt — Sky 100% natural B 70 100% Linen (European Flax) Seasalt Cornwall Breezy Linen Shirt — Sky £35":
    - /url: /product/salt-stem-linen-shirt-sky
    - img "Breezy Linen Shirt — Sky"
    - text: 100% natural B 70
    - paragraph: 100% Linen (European Flax)
    - paragraph: Seasalt Cornwall
    - heading "Breezy Linen Shirt — Sky" [level=3]
    - paragraph: £35
  - link "Striped Linen Top 100% natural B 70 100% European Flax certified linen · unverified eco-claims Seasalt Cornwall Striped Linen Top £30":
    - /url: /product/salt-stem-striped-linen-top
    - img "Striped Linen Top"
    - text: 100% natural B 70
    - paragraph: 100% European Flax certified linen · unverified eco-claims
    - paragraph: Seasalt Cornwall
    - heading "Striped Linen Top" [level=3]
    - paragraph: £30
  - link "Oversized Linen Blouse — Multi 100% natural B 69 55% Linen Seasalt Cornwall Oversized Linen Blouse — Multi £60":
    - /url: /product/seasalt-shirts-1
    - img "Oversized Linen Blouse — Multi"
    - text: 100% natural B 69
    - paragraph: 55% Linen
    - paragraph: Seasalt Cornwall
    - heading "Oversized Linen Blouse — Multi" [level=3]
    - paragraph: £60
- contentinfo:
  - paragraph:
    - link "How we score":
      - /url: /methodology
    - text: ·
    - link "Fabric Check":
      - /url: /analyze
    - text: ·
    - link "Fabric guides":
      - /url: /fabric/linen
    - text: · / to search · LIVE items from brands' own stores · rest is concept catalogue
- button "Open shopping concierge":
  - img
  - text: Concierge
- alert
```

# Test source

```ts
  125 |     await slider.focus();
  126 |     for (let i = 0; i < 14; i++) await slider.press("ArrowRight");
  127 |     await expect(page.getByText("Minimum: 70/100")).toBeVisible();
  128 |     await expect.poll(() => totalResults(page)).toBeLessThan(initial);
  129 |     const badgeText = await page.getByTestId("grade-badge").first().innerText();
  130 |     const score = Number(badgeText.replace(/[^0-9]/g, ""));
  131 |     expect(score).toBeGreaterThanOrEqual(70);
  132 |   });
  133 | 
  134 |   test("fabric fact card opens with research citation", async ({ page }) => {
  135 |     await page.goto("/search");
  136 |     await page.getByTestId("fabric-filter").getByRole("button", { name: /About Linen/i }).click();
  137 |     await expect(page.getByText("European Confederation of Flax")).toBeVisible();
  138 |   });
  139 | 
  140 |   test("empty state appears for impossible queries", async ({ page }) => {
  141 |     await page.goto("/search");
  142 |     await page.getByTestId("search-input").fill("zxqvbnmasdf");
  143 |     await expect(page.getByTestId("empty-state")).toBeVisible();
  144 |   });
  145 | });
  146 | 
  147 | test.describe("product page & buy flow", () => {
  148 |   test("full sustainability story renders with sizes and £", async ({ page }) => {
  149 |     await page.goto("/search?fabric=linen");
  150 |     await expect(page.getByTestId("results-count")).toBeVisible();
  151 |     await page.getByTestId("product-card").first().click();
  152 |     await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
  153 | 
  154 |     await expect(page.getByTestId("sustainability-panel")).toBeVisible();
  155 |     await expect(page.getByTestId("composition-bars")).toBeVisible();
  156 |     await expect(page.getByTestId("score-dial")).toBeVisible();
  157 |     await expect(page.getByTestId("product-sizes")).toBeVisible();
  158 |     await expect(page.getByTestId("product-price")).toContainText("£");
  159 |     expect(await page.getByTestId("score-factors").locator("> div").count()).toBeGreaterThanOrEqual(2);
  160 |   });
  161 | 
  162 |   test("buy button lands straight on the retailer checkout, item in bag", async ({ page }) => {
  163 |     await page.goto("/product/salt-stem-linen-shirt-white");
  164 |     await page.getByTestId("buy-button").click();
  165 |     await expect(page).toHaveURL(/\/retailer\//, { timeout: 30_000 });
  166 |     await expect(page.getByTestId("retailer-checkout")).toBeVisible();
  167 |     await expect(page.getByText("Your bag — 1 item")).toBeVisible();
  168 |     await expect(page.getByTestId("checkout-total")).toContainText("£");
  169 |     await expect(page.getByTestId("retailer-pay-button")).toBeVisible();
  170 |   });
  171 | 
  172 |   test("greenwash flags appear on vague-claim products", async ({ page }) => {
  173 |     await page.goto("/product/bloomfield-crew-tee-3pack");
  174 |     await expect(page.getByTestId("greenwash-flags")).toBeVisible();
  175 |   });
  176 | });
  177 | 
  178 | test.describe("fixes & subtle features", () => {
  179 |   test('"hoody" finds hoodies now', async ({ page }) => {
  180 |     await page.goto("/search?q=hoody");
  181 |     expect(await page.getByTestId("product-card").count()).toBeGreaterThan(5);
  182 |   });
  183 | 
  184 |   test('"t shirt" no longer floods the whole catalog', async ({ page }) => {
  185 |     await page.goto("/search");
  186 |     const allText = await page.getByTestId("results-count").innerText();
  187 |     const catalogSize = Number(allText.match(/(\d+)/)?.[1] ?? 0);
  188 | 
  189 |     await page.goto("/search?q=t%20shirt");
  190 |     const count = await page.getByTestId("product-card").count();
  191 |     const text = await page.getByTestId("results-count").innerText();
  192 |     const total = Number(text.match(/(\d+)/)?.[1] ?? 0);
  193 |     // narrowed to well under half the catalog = not flooding via the stray "t"
  194 |     expect(total).toBeLessThan(catalogSize * 0.5);
  195 |     expect(count).toBeGreaterThan(0);
  196 |   });
  197 | 
  198 |   test("methodology page publishes the rubric", async ({ page }) => {
  199 |     await page.goto("/methodology");
  200 |     await expect(page.getByRole("heading", { name: /anatomy of a score/i })).toBeVisible();
  201 |     await expect(page.getByText("Every fibre, ranked")).toBeVisible();
  202 |   });
  203 | 
  204 |   test("brand page shows profile and products", async ({ page }) => {
  205 |     await page.goto("/brand/zara");
  206 |     await expect(page.getByRole("heading", { name: "Zara", exact: true })).toBeVisible();
  207 |     await expect(page.getByTestId("grade-badge").first()).toBeVisible();
  208 |     expect(await page.getByTestId("product-card").count()).toBeGreaterThan(8);
  209 |   });
  210 | 
  211 |   test("fabric guide page educates and lists products", async ({ page }) => {
  212 |     await page.goto("/fabric/linen");
  213 |     await expect(page.getByRole("heading", { name: "Linen", exact: true })).toBeVisible();
  214 |     await expect(page.getByText("European Confederation of Flax").first()).toBeVisible();
  215 |     expect(await page.getByTestId("product-card").count()).toBeGreaterThan(4);
  216 |   });
  217 | 
  218 |   test("product page: retailer link, impact chips, concierge handoff", async ({ page }) => {
  219 |     await page.goto("/product/salt-stem-linen-shirt-white");
  220 |     await expect(page.getByTestId("view-on-retailer")).toBeVisible();
  221 |     await expect(page.getByTestId("view-on-retailer")).toHaveAttribute("target", "_blank");
  222 |     await expect(page.getByTestId("impact-equivalents")).toBeVisible();
  223 |     await expect(page.getByTestId("category-delta")).toBeVisible();
  224 |     await page.getByTestId("ask-concierge").click();
> 225 |     await expect(page.getByTestId("concierge-panel")).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  226 |   });
  227 | 
  228 |   test("analyzer page renders and validates input", async ({ page }) => {
  229 |     await page.goto("/analyze");
  230 |     await expect(page.getByTestId("analyze-input")).toBeVisible();
  231 |     // mock the API so e2e stays offline and free
  232 |     await page.route("**/api/analyze", (route) =>
  233 |       route.fulfill({
  234 |         json: {
  235 |           url: "https://example-shop.com/tee", site: "example-shop.com",
  236 |           title: "Test Organic Tee", image: null, price_text: "£25",
  237 |           found_composition: true,
  238 |           fabric_composition: [{ material: "organic_cotton", label: "Organic cotton", pct: 100 }],
  239 |           certifications: ["GOTS"], practices: {}, greenwash_flags: [],
  240 |           explanation: "Solid organic cotton basic.",
  241 |           score: 66, grade: "B",
  242 |           factors: [{ label: "Fibre composition", points: 56, detail: "100% organic cotton" }],
  243 |         },
  244 |       }),
  245 |     );
  246 |     await page.getByTestId("analyze-input").fill("https://example-shop.com/tee");
  247 |     await page.getByTestId("analyze-submit").click();
  248 |     await expect(page.getByTestId("analyze-result")).toBeVisible();
  249 |     await expect(page.getByText("Test Organic Tee")).toBeVisible();
  250 |     await expect(page.getByTestId("analyze-visit")).toHaveAttribute("href", /example-shop/);
  251 |   });
  252 | 
  253 |   test("pasting a URL into home search routes to Fabric Check", async ({ page }) => {
  254 |     await page.goto("/");
  255 |     await page.getByTestId("home-search-input").fill("https://shop.example.com/product/1");
  256 |     await page.getByTestId("home-search-input").press("Enter");
  257 |     await page.waitForURL(/\/analyze\?url=/);
  258 |   });
  259 | });
  260 | 
  261 | test.describe("natural-fibre-first", () => {
  262 |   test("'No synthetics' master toggle purges all plastic", async ({ page }) => {
  263 |     await page.goto("/search");
  264 |     const totalOf = async () =>
  265 |       Number((await page.getByTestId("results-count").innerText()).match(/([\d,]+)/)![1].replace(/,/g, ""));
  266 |     const initial = await totalOf();
  267 |     await page.getByTestId("pure-toggle").click();
  268 |     await expect.poll(async () => page.url()).toContain("pure=1");
  269 |     await expect.poll(totalOf).toBeLessThan(initial);
  270 |     // every visible fibre mark must be natural or plastic-free
  271 |     const marks = await page.getByTestId("fibre-mark").allInnerTexts();
  272 |     for (const m of marks.slice(0, 12)) {
  273 |       expect(m).toMatch(/100% natural|Plastic-free/i);
  274 |     }
  275 |   });
  276 | 
  277 |   test("mislabelled 'blend' items carry the label-check flag", async ({ page }) => {
  278 |     await page.goto("/search?q=blend");
  279 |     await expect(page.getByTestId("misnamed-flag").first()).toBeVisible();
  280 |     const flag = await page.getByTestId("misnamed-flag").first().innerText();
  281 |     expect(flag).toMatch(/only \d+%/i);
  282 | 
  283 |     // click through: the product page spells it out
  284 |     await page.getByTestId("product-card").filter({ has: page.getByTestId("misnamed-flag") }).first().click();
  285 |     await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
  286 |     await expect(page.getByTestId("misnamed-warning")).toBeVisible();
  287 |   });
  288 | 
  289 |   test("hero CTA lands on plastic-free results", async ({ page }) => {
  290 |     await page.goto("/");
  291 |     await page.getByTestId("hero-pure-cta").click();
  292 |     await page.waitForURL(/pure=1/);
  293 |     await expect(page.getByTestId("results-count")).toBeVisible();
  294 |   });
  295 | });
  296 | 
  297 | test.describe("diary, better fibre, resale", () => {
  298 |   test("plastic-heavy product offers 'better fibre at this price'", async ({ page }) => {
  299 |     await page.goto("/product/zara-t-shirts-3"); // 100% polyester tank
  300 |     await expect(page.getByTestId("better-fibre")).toBeVisible();
  301 |     const cards = page.getByTestId("better-fibre").getByTestId("product-card");
  302 |     expect(await cards.count()).toBeGreaterThanOrEqual(1);
  303 |     // every recommendation must show less plastic than 100%
  304 |     const marks = await page.getByTestId("better-fibre").getByTestId("fibre-mark").allInnerTexts();
  305 |     for (const m of marks) expect(m).not.toMatch(/100% plastic/);
  306 |   });
  307 | 
  308 |   test("secondhand check links to live resale searches", async ({ page }) => {
  309 |     await page.goto("/product/salt-stem-linen-shirt-white");
  310 |     await expect(page.getByTestId("secondhand")).toBeVisible();
  311 |     await expect(page.getByTestId("resale-vinted")).toHaveAttribute("href", /vinted\.co\.uk.*search_text=/);
  312 |     await expect(page.getByTestId("resale-ebay")).toHaveAttribute("href", /ebay\.co\.uk/);
  313 |   });
  314 | 
  315 |   test("buying writes the Fibre Diary and the diary sums spend", async ({ page }) => {
  316 |     await page.goto("/product/salt-stem-linen-shirt-white"); // £35, 100% natural
  317 |     await page.getByTestId("buy-button").click();
  318 |     await expect(page).toHaveURL(/\/retailer\//, { timeout: 30_000 });
  319 | 
  320 |     await page.goto("/diary");
  321 |     await expect(page.getByTestId("diary-stats")).toBeVisible();
  322 |     await expect(page.getByTestId("diary-entries")).toContainText("Breezy Linen Shirt");
  323 |     await expect(page.getByTestId("diary-stats")).toContainText("£35");
  324 |     // 100% natural purchase → natural spend equals total
  325 |     const stats = await page.getByTestId("diary-stats").innerText();
```