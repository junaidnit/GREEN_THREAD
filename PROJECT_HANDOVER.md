# GreenThread — Project Handover

*Last updated: 12 July 2026 · Repo: https://github.com/junaidnit/GREEN_THREAD · Production: https://greenthread-junaidnits-projects.vercel.app (behind Vercel auth — see Blockers)*

---

## 1. Current project goal

**A comparison platform that filters clothing by natural fibre, excludes oil-derived synthetics, and exposes mislabelled blends** ("linen blend" that's 90% polyester). Think BuyHatke/Phia mechanics, but the verdict is *fibre truth* instead of price.

- **Purist stance (owner decision):** recycled polyester/nylon still count as plastic. Regenerated cellulosics (TENCEL, modal, cupro, viscose) are "Plastic-free" but not "natural".
- **Why now:** EU Digital Product Passport mandates fibre transparency from 2028; no consumer tool does this today.
- **Revenue model:** affiliate links (primary) + sponsorship from fibre orgs (Woolmark, Better Cotton, TENCEL/Lenzing, GOTS — *not yet built*).
- **Design language:** Phia-inspired elite editorial — Playfair serif italics, floating verdict cards, ghosted films, minimal nav (reference material in `C:\ANITA\`).

## 2. Architecture overview

```
LIVE:  scripts/ingest-live.ts ──► real brand Shopify feeds (/products.json, paginated,
       backoff, politeness sleeps) ──► parseComposition (only keeps items whose label
       discloses fibre %) ──► data/products_live.json  (1,264 REAL products,
       source:"live", real buy_url / photo / price — Thought, Lucy & Yak,
       Beaumont Organic, Komodo)

DEMO:  data/raw/*.json ──► scripts/enrich.ts (Claude extraction, resumable, £~pennies)
                ──► scripts/generate-catalog.ts (deterministic ~1,561 items, no AI)
                ──► scripts/validate-seed.ts (cert evidence-check, label hygiene)
                ──► data/products_seed.json + products_generated.json (committed)

BOTH   ──► scripts/db-setup.ts ──► Supabase (brands, products, events)
                                              │
Next.js 16 App Router ◄───────────────────────┘  (server components read Supabase,
  │                                                fall back to local JSON — app
  ├─ client: MiniSearch instant search + facets    always works offline)
  ├─ /api/concierge  — Claude tool-calling chat (streaming, AI SDK v7)
  ├─ /api/analyze    — Fabric Check: fetch any URL → extract label → score
  ├─ /api/event      — behavioural events → Supabase
  └─ /out/[id]       — tracked redirect: source:"live" → REAL merchant product page;
                       concept items → /retailer/[id] (simulated checkout)
```

**Key principle:** all AI work happens offline in the pipeline or in explicit user actions; browsing never waits on a model. Scoring is deterministic code (`computeScore`), never the LLM.

## 3. Folder structure

```
greenthread/
├─ data/
│  ├─ raw/                 brands.json (12 real UK brands), raw_products.json (67 messy originals)
│  ├─ products_seed.json   67 AI-extracted products (via enrich.ts)
│  └─ products_generated.json  1,561 deterministic products
├─ scripts/                pipeline + ops (enrich, generate-catalog, validate-seed,
│                          db-setup, audit-scores, rebrand-uk, verify-live, assess,
│                          contact-sheet, shot-*.ts one-off screenshots)
├─ src/
│  ├─ app/
│  │  ├─ page.tsx          home (LabelHero, fibre edits, brand gallery, campaign film)
│  │  ├─ search/           instant search + filter sidebar
│  │  ├─ product/[id]/     PDP: composition, score anatomy, better-fibre recs, secondhand
│  │  ├─ analyze/          Fabric Check (paste any URL)
│  │  ├─ brands/, brand/[slug]/, fabric/[id]/, methodology/, diary/, saved/
│  │  ├─ out/[id]/         click-tracked redirect   ├─ retailer/[id]/ simulated checkout
│  │  └─ api/              concierge, analyze, event
│  ├─ components/          product-card, search-experience, label-hero, cinematic-hero,
│  │                       animated-logo, kinetic (RollingWord/CountUp/Reveal/Marquee),
│  │                       score-factors, fabric-lens, saved, buy-button, concierge…
│  └─ lib/
│     ├─ scoring.ts        THE RUBRIC: material scores, cert points, computeScore,
│     │                    validateCertifications (anti-hallucination)
│     ├─ materials.ts      fibreMark, oilDerivedPct, misleadingName, facts, cert info
│     ├─ search.ts         MiniSearch index, facets, noSynthetics filter, URL state
│     ├─ catalog.ts        Supabase/local loader, getBetterFibre, getSimilar, cards
│     ├─ brand-links.ts    real brand search URLs   ├─ resale-links.ts  Vinted/eBay/Depop/VC
│     ├─ diary.ts          on-device purchase log   └─ spread.ts, format.ts, types.ts
├─ supabase/migration.sql  brands, products, events (+RLS)
├─ tests/unit/ (61)        scoring, search, materials
└─ tests/e2e/ (35)         shopping-flow.spec.ts — full journeys
```

## 4. What was built (change history in broad strokes)

1. **MVP** — scaffold, design system, 67-product AI-enriched catalog, Supabase, search, PDP, concierge, tests.
2. **UK pivot** — real brand names, £, sizes/colours, journey-first filter sidebar, deeplink buy flow.
3. **Scale** — 1,628 products (deterministic generator), refinement banner, infinite scroll.
4. **Fabric Check** — paste any product URL; live-verified against a real Uniqlo page.
5. **Natural-fibre-first reframe** — fibre mark as hero metric, "No synthetics" purist toggle (`?pure=1`), mislabelling detector, "Most natural" sort.
6. **Phia design transformation** — Playfair serif, label-truth hero with floating verdict cards, thread-leaf animated logo, brand gallery, fibre edits, /brands.
7. **Better-fibre batch** — better-fibre recommendations (±25% price, less plastic), Fibre Diary, secondhand deeplinks, score + retailer-link audits.
8. **Live ingestion** — `scripts/ingest-live.ts` + `src/lib/live-ingest.ts`: 1,264 REAL products pulled from 4 real UK sustainable brands' own Shopify feeds (Thought 77, Lucy & Yak 185, Beaumont Organic 592, Komodo 410). Real titles/photos/prices/URLs; only items whose label discloses full composition are kept. Buy + "View this exact item" land on the exact merchant product page; concept items are now labelled honestly ("Find similar at…", "concept item" note). `?live=1` filter + LIVE badges.

## 5. Important code decisions

- **Scoring is deterministic** (`src/lib/scoring.ts`): fibre 0–70 + certs 0–15 (capped) + brand 0–6 + practices 0–9. The AI only *extracts*; `validateCertifications` drops any cert without textual evidence (the extractor hallucinated certs once — this guard is load-bearing).
- **Purist plastic definition** (`materials.ts FIBRE_CLASS`): synthetic class = oil-derived incl. recycled. Changing this single map changes the whole product's stance.
- **Colours derive FROM photos** in the generator (each pool image is colour-tagged) — prevents "Forest" titles on black tees. Real feeds will make this obsolete.
- **Catalog ships to the client as a slim `CatalogCard` projection** (~⅓ payload) — full records only on PDP/server.
- **Search**: AND-first multi-term with OR fallback (stops "t shirt" flooding); category synonyms so "top" finds tees/shirts/knits.
- **Retailer = brand** on every product (demo has no marketplace inventory) — avoids "Zara sold by Brand Direct" nonsense.
- **Diary/saved are localStorage-only** (privacy-first, no accounts). Events table in Supabase takes anonymous search/out-click events only.
- **Next 16 quirks encountered:** experimental `viewTransition: true` powers card→PDP morphs; only ONE `next dev` per project (e2e webServer vs preview server conflict — stop one first); unlayered CSS beats Tailwind utilities (h1 rule must stay in `@layer base`-compatible form); Playwright `fill()` doesn't fire React 19 onChange on range inputs (keyboard-drive sliders in tests).
- **Deploy pattern:** `vercel deploy --prod` does NOT repoint the stable alias — always follow with `vercel alias set <deploy-host> greenthread-junaidnits-projects.vercel.app`.

## 6. Current bugs / known issues

- **Image↔title mismatch (concept items only):** small Unsplash pools mean a "Rib Tank" can show a striped tee. The 1,264 live items are immune — their photos come from the brand's own store. Concept items are now labelled as such on the PDP.
- **Thought pivoted to socks:** `wearethought.com` 301s to `thoughtsocks.com` (ingest uses the canonical domain). Their remaining garments are mostly clearance-priced — real, but a thin garment range.
- **Fabric lens is desktop/hover-only** — mobile users don't see it (no broken UX, just absent).
- **Some outbound links 403 to bots** (COS, Depop, eBay, People Tree, & Other Stories, Vestiaire, H&M) — they work in real browsers; can't verify programmatically. M&S was a real 404, fixed to `/l/search?searchTerm=`.
- **Hydration-timing flakiness in dev** — first paint before hydration shows framer-motion elements at opacity 0 and counters at 0; fine in prod but screenshots/tests need explicit waits.
- **PowerShell + inline `npx tsx -e` mangles quotes** — always write one-off scripts to files (see scripts/shot-*.ts pattern).
- **CountUp had an rAF teardown race** — fixed with a settle timeout, keep if refactoring.

## 7. Remaining tasks (product backlog)

- **Sponsor/ad slots** for fibre orgs (Woolmark, TENCEL, Better Cotton, GOTS) — planned secondary revenue, not built.
- **"Why fibre matters / EU DPP 2028" narrative page** — regulatory-tailwind story, not built.
- More live brand feeds: any Shopify store with disclosed compositions is a 5-line addition to `SOURCES` in `scripts/ingest-live.ts` (People Tree hard-blocks bots with 503s; Seasalt/Finisterre/Patagonia aren't public-Shopify). Re-run the script any time — data refreshes in place.
- Affiliate network integration (AWIN/Rakuten) so live buy-clicks earn commission — the redirect plumbing in `/out/[id]` is ready for deeplink wrapping.
- Semantic search (pgvector), compare view, price-drop alerts, Android/extension surfaces (Phia parity ideas).
- Cloth-physics 3D viewer + shoppable video (parked: need real 3D/video assets).

## 8. Next steps (in order)

1. **Owner: disable Vercel Authentication** — Settings → Deployment Protection → Disabled. *Until then the whole site shows "Login – Vercel" to visitors.*
2. **Owner: point greenthread.info at Vercel** (Fasthosts DNS): `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com` (or switch nameservers to ns1/ns2.vercel-dns.com). Domain is already attached on Vercel's side.
3. **Owner: rotate the Anthropic + Supabase keys** (they were pasted in chat during development) and update `.env.local` + Vercel env.
4. Build sponsor slots + EU-2028 page, then pursue first real affiliate feed.
5. Keep repo private until real data replaces illustrative brand scores (legal exposure: invented scores on real brand names — Zara, H&M etc. — demo-labelled but not for public marketing).

## 9. Commands

```bash
npm run dev            # dev server (http://localhost:3000)
npm run build          # production build (~74 static pages + server routes)
npm start              # serve production build
npm run test           # 61 unit tests (Vitest)
npm run test:e2e       # 35 Playwright e2e (uses local seed, port 3100 — stop dev server first)
npm run enrich         # re-run Claude extraction over data/raw (resumable, needs ANTHROPIC_API_KEY)
npm run db:setup       # push schema + seed 1,628 products to Supabase (Management API)
npx tsx scripts/generate-catalog.ts   # regenerate the 1,561 deterministic products
npx tsx scripts/validate-seed.ts      # deterministic re-validation/rescore (no AI)
npx tsx scripts/audit-scores.ts       # recompute + diff every stored score
npx tsx scripts/verify-live.ts <dir>  # live browser walkthrough incl. one real concierge call

# deploy (CLI already authed on this machine)
npx vercel deploy --prod --yes
npx vercel alias set <deploy-host> greenthread-junaidnits-projects.vercel.app
```

Windows note: fresh shells may need `$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")` before node/npm resolve (Node was installed mid-project via winget).

## 10. Environment variables (`.env.local`, git-ignored)

| Variable | Used by | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | app runtime | Supabase project (ref `lyouozcnfuaknoxmvpxy`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | app runtime | publishable key; RLS allows public read + anon event insert |
| `ANTHROPIC_API_KEY` | `/api/concierge`, `/api/analyze`, `npm run enrich` | **rotate — was exposed in chat** |
| `SUPABASE_ACCESS_TOKEN` | `npm run db:setup` only | personal access token — **rotate** |
| `SUPABASE_PROJECT_REF` | `npm run db:setup` only | `lyouozcnfuaknoxmvpxy` |
| `CATALOG_SOURCE=local` | optional | forces local JSON (Playwright uses this for determinism) |

Same three runtime vars are set in Vercel (production env). `VERCEL_OIDC_TOKEN` in `.env.local` is CLI-generated; ignore.

---

*Test status at handover: 61 unit + 35 e2e, all green. Production build verified. Everything committed & pushed through `70f100c`.*
