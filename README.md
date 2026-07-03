# GreenThread 🌿

**Shop by fabric, not just price.** A sustainable-fashion aggregator MVP: instant
search across a multi-retailer catalog, first-class fabric filtering, and an
explainable sustainability score on every garment — with an AI enrichment
pipeline and shopping concierge powered by Claude.

## Architecture

```
data/raw/raw_products.json        ← messy retailer-style product copy (67 items)
        │
        ▼  npm run enrich          (Claude extraction agent + scoring rubric)
data/products_seed.json           ← structured fabric %, certs, flags, explanations
        │
        ▼  npm run db:setup        (Supabase Management API — schema + seed)
Supabase (brands, products)       ← served to the app; local seed is the fallback
        │
        ▼
Next.js app                       ← instant client-side search (MiniSearch),
                                    faceted fabric filter, product pages,
                                    /api/concierge (Claude + tool-calling)
```

**Key principle:** all AI work happens *offline* in the pipeline. Users search a
pre-enriched index — that's why it's instant.

## The scoring rubric (transparent by design)

`src/lib/scoring.ts` — every point is accounted for and shown in the UI:

| Component | Range | Source |
|---|---|---|
| Fibre composition (weighted per-material impact) | 0–70 | deterministic |
| Certifications (GOTS +6, GRS +4, …, capped) | 0–15 | extracted by Claude, only if stated |
| Brand practices modifier | 0–6 | curated brand data |
| Practice bonuses (deadstock, natural dye, repair…) | 0–9 | extracted by Claude |

Claude also writes an honest plain-language explanation and flags **greenwashing**
(vague eco-claims with no certification behind them) — shown on product pages.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Works out of the box using the checked-in enriched seed. For the full stack,
create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_ACCESS_TOKEN=<personal access token>   # only for npm run db:setup
SUPABASE_PROJECT_REF=<ref>                      # only for npm run db:setup
ANTHROPIC_API_KEY=<key>                         # concierge + npm run enrich
```

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build && npm start` | production build |
| `npm run test` | unit tests (scoring rubric, search/facets, URL state) |
| `npm run test:e2e` | Playwright end-to-end (uses local seed, no network) |
| `npm run enrich` | re-run the Claude enrichment pipeline (resumable) |
| `npm run db:setup` | create schema + seed Supabase |

## What's real vs. demo

- Real: the entire pipeline, scoring, search, filtering, concierge.
- Demo: the 12 brands and 67 products are fictional-but-realistic so no false
  claims are made about real companies. Buy buttons link out to illustrative URLs.

## Next steps (beyond MVP)

- Real ingestion: affiliate feeds + Firecrawl/Playwright scrapers feeding the same enrichment agent
- pgvector semantic search + visual search (CLIP embeddings)
- Meilisearch/Typesense once the catalog outgrows client-side indexing
- Compare view, saved searches/alerts, user accounts
- Affiliate deeplink tracking on buy clicks
