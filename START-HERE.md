# START HERE — continuing The Fibre Set on a new machine / new account

This is the one document to read first. It gets a fresh machine — and a fresh
Claude account — from zero to productive without missing anything. When it
points you at another file, that file has the depth; this one is the map.

- **Live site:** https://thefibreset.com  (the old `greenthread.info` 308-redirects here)
- **Repo:** https://github.com/junaidnit/GREEN_THREAD  (folder is still named `greenthread`)
- **What it is:** a natural-fibre fashion comparison platform + a browser
  extension that reads any garment's fibre label while you shop and offers a
  real natural-fibre look-alike. Next.js app on Vercel, Supabase for the
  catalogue, a Chrome MV3 extension, and an offline data pipeline.

> **Nothing here is tied to a Claude account or one person's machine.**
> Everything is in this GitHub repo. Whoever clones it — you on any account,
> your co-owner, a new laptop — continues from exactly this point. That is the
> whole design: git is the shared brain.

---

## 1. First 10 minutes — get it running

Prerequisites: **Node 20+** (this project was built on Node 24.18, npm 11) and
**git**. On Windows the shell examples below are cross-shell; where PowerShell
differs it's called out in §8.

```bash
git clone https://github.com/junaidnit/GREEN_THREAD.git
cd GREEN_THREAD
npm install
npm run dev            # localhost — RUNS WITH NO KEYS on the committed catalogue
```

Open the localhost URL it prints. Browsing, search, product pages and the
catalogue all work with **no credentials at all**, because the app falls back
to the committed JSON catalogue when Supabase isn't configured. You only need
keys for the AI features (next section).

---

## 2. Accounts & keys — what you need, who owns what

Create a `.env.local` in the repo root (it is git-ignored — it never leaves the
machine). **Never put a key anywhere except `.env.local`. Never commit one,
never paste one into chat.**

| Variable | Needed for | Where it comes from |
|---|---|---|
| `ANTHROPIC_API_KEY` | extension scan, Fabric Check, concierge, the AI pipeline scripts | **Your own** key from console.anthropic.com — each person uses their own, billed to their own account |
| `NEXT_PUBLIC_SUPABASE_URL` | reading the live catalogue from Supabase (optional for dev) | The project's Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | Supabase dashboard → API settings |
| `SUPABASE_ACCESS_TOKEN` | `npm run db:setup` only (writing the catalogue to Supabase) | Supabase account → access tokens |
| `SUPABASE_PROJECT_REF` | `npm run db:setup` only | Supabase project settings |
| `CATALOG_SOURCE=local` | *optional* — forces the local JSON catalogue, skipping Supabase | set it yourself when you want deterministic local data |

`PROJECT_ROOT` is injected by the build, **not** something you set.

**The minimum to be fully productive is just your own `ANTHROPIC_API_KEY`.**
You do not need Supabase or Vercel access to build and test features — only to
push catalogue data to production or deploy.

**Accounts, and who holds them:**

| Service | Purpose | Who |
|---|---|---|
| GitHub | source of truth | owner + co-owners as collaborators |
| Anthropic | each person's own Claude / API key | each person separately |
| Vercel | hosting + production deploys | **owner only** (tied to the domain) |
| Supabase | catalogue database | owner (share read keys as needed) |
| Fasthosts | the `greenthread.info` domain DNS | owner |

> **Rotate the shared keys.** The Anthropic + Supabase keys were exposed in
> chat during early development. Rotate them (Anthropic console + Supabase
> dashboard → update Vercel env) — a new person joining is the moment to do it.

---

## 3. The exact current state (read this so nothing is missed)

As of the latest commit on `main`:

- **App + extension:** fully built and deployed to https://thefibreset.com.
- **Extension:** reads the fibre label, scores it, and recommends a natural
  look-alike matched on the garment's **photo** (colour + pattern), not just
  its title. Loaded unpacked and verified working in a real browser.
- **Catalogue:** `data/products_live.json` holds **1,860 real products** from 6
  brands (Thought, Lucy & Yak, Beaumont Organic, Komodo, Bibico, Celtic & Co),
  just grown from 1,255 after a composition-parser fix.

### ⚠ The one thing in-flight — finish this next

The catalogue grew, but two downstream steps have **not** been run for the ~993
new products:

1. **Visual-match index is behind.** `data/twins.json` covers **867** of the
   1,860 products. The ~993 new ones have no image embeddings yet, so they
   won't appear in the extension's look-alike ranking until you run:
   ```bash
   npm run embed        # ~20–30 min, local, no risk; runs on the API key
   ```
2. **Supabase is behind.** Production reads Supabase; the new products are only
   in the committed JSON (which the app falls back to). To make them fully live:
   ```bash
   npm run db:setup     # writes the catalogue to Supabase (needs SUPABASE_* keys)
   ```
   Then the owner redeploys (see §5).

Until those run, the site and extension work, but the newest ~993 products are
"present but not yet visually matchable / not in Supabase." **This is the first
task for whoever picks up next.**

---

## 4. The daily workflow (how we never lose or clobber work)

Full rules are in **CONTRIBUTING.md**. The short version:

```bash
git checkout main && git pull        # 1. always start current
git checkout -b short-feature-name   # 2. one branch per piece of work — never work on main
# ...make changes...
npm run test && npx tsc --noEmit && npm run build   # 3. all green before pushing
git add -A && git commit -m "..."    # (on Windows use -F, see §8)
git push -u origin short-feature-name
# 4. open a Pull Request on GitHub → the other owner glances → merge
```

`main` is protected: everything lands via a Pull Request, so no one — and no
Claude — can push broken code to the live branch by accident. Commit and push
often; anything only on one laptop is one spilled coffee from gone.

---

## 5. Deploying — owner only, and only from a clean tree

```bash
npx vercel deploy --prod --yes
npx vercel alias set <the-new-deploy-host> greenthread-junaidnits-projects.vercel.app
```

Two rules learned the hard way:

- **`vercel deploy` uploads your local working directory, not git.** A deploy
  fired mid-edit once shipped a file with a syntax error. Only deploy with a
  clean `git status` and a green `npm run build`.
- Production is tied to the owner's Vercel project, domain and keys — a
  co-owner's work reaches the live site **after** it's merged to `main`, by the
  owner running the deploy.

---

## 6. The catalogue is a pipeline — never hand-edit the data

To change what's in the catalogue, run scripts; don't edit
`data/products_live.json` by hand.

```bash
npm run grow -- <domain>                    # scout a brand's feed: GO/NO-GO on the honesty bar
npm run grow -- <domain> --add --name "X"   # onboard it: brands.json + live-sources.json + ingest
npm run ingest:live                         # re-harvest every brand in data/raw/live-sources.json
npm run embed                               # rebuild the CLIP visual-match index (data/twins.json)
npm run db:setup                            # push the catalogue to Supabase
npm run sentinel                            # re-harvest + prune sold-out/vanished + reseed + record truth
```

The honesty bar (only keep items whose label discloses a full composition, and
only brands that are majority natural-fibre) lives in `src/lib/scout.ts` and
`src/lib/live-ingest.ts`.

---

## 7. Where things live (architecture map)

```
src/app/                     Next.js routes
  api/extension/scan/        the extension's endpoint: score a scraped page + recommend
  api/analyze/               Fabric Check (paste a URL)
  api/concierge/             the shopping chat
  product/[id]/, search/     the storefront
src/lib/
  extract.ts                 shared Claude extraction + visualAttributes() (reads colour/pattern from the photo)
  match.ts                   the matcher: same garment/gender/colour/pattern, better fibre
  recommend.ts               ranks catalogue matches for the extension (resemblance first, price second)
  garment.ts                 garment type / colour family / pattern / gender vocabulary
  live-ingest.ts             parseComposition + mapCategory (the ingestion brains)
  scoring.ts, materials.ts   the deterministic sustainability rubric
  catalog.ts, env.ts         data loading + BOM-safe env reading
extension/                   Chrome MV3 extension (see extension/README.md)
scripts/                     the pipeline (grow, ingest-live, embed, db-setup, sentinel, …)
data/
  products_live.json         the live catalogue (generated — do not hand-edit)
  twins.json                 the visual-match index (generated by npm run embed)
  raw/live-sources.json      the brands to ingest
  raw/brands.json            brand profiles
```

---

## 8. Gotchas that will bite a new Claude (tell it these)

- **Windows PowerShell here-strings (`@'…'@`) silently swallow `git commit -m`** —
  the push then says "Everything up-to-date" and the commit never happened. Use
  `git commit -F message.txt` for multi-line messages.
- **`vercel deploy` ships the local working directory, not git HEAD** (see §5).
- **Chrome does not hot-reload unpacked extensions** — after editing anything in
  `extension/`, hit the refresh icon on its card in `chrome://extensions`.
- **Env vars can carry an invisible BOM** when pasted into a dashboard field;
  this once 500'd every AI feature in production. `src/lib/env.ts` strips it now
  (`cleanEnv`), but if you re-enter a key in Vercel, retype it rather than paste.
- **The AI pipeline scripts run on `ANTHROPIC_API_KEY`, not your Claude weekly
  limit** — `embed`, `ingest:live`, `grow` etc. are billed per-token separately,
  so heavy batch jobs don't consume your Claude Code session allowance.

---

## 9. Continuing with a NEW Claude account (the point of this doc)

On the new machine, after §1 and §2:

1. Tell the new Claude, in its first message, to **read `START-HERE.md`,
   `AGENTS.md`, `CLAUDE.md` and `PROJECT_HANDOVER.md`** before doing anything.
   Those give it the full context so it doesn't re-derive the project.
2. Have it run `git pull` at the start of every session.
3. Point it at **§3** so it knows the pending catalogue step is the first job.
4. Keep it on the branch/PR workflow in **CONTRIBUTING.md** — never let it
   commit straight to `main` or deploy from a dirty tree.

A new account loses nothing: it inherits every commit, every doc, the full
history and the tests. The only things that don't travel in git are the
secrets (by design) — each account supplies its own `ANTHROPIC_API_KEY`.

---

## 10. The other documents

| File | What it's for |
|---|---|
| **CONTRIBUTING.md** | the collaboration rules — branches, PRs, keys, territory split |
| **PROJECT_HANDOVER.md** | the deep architecture + decision history |
| **AGENTS.md** / **CLAUDE.md** | instructions a Claude working in this repo should follow |
| **extension/README.md** | how the browser extension works and how to load/pack it |
| **README.md** | the short public-facing project readme |
