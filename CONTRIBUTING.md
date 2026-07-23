# Working on The Fibre Set together

Two owners, two machines, two Claudes — synced through GitHub. Nobody edits
anyone else's computer; nobody shares a Claude session. Every change is
visible, reversible and reviewed. This file is written for **both of us and
our Claudes** — point your Claude at it on day one.

## One-time setup (per machine)

```bash
git clone https://github.com/junaidnit/GREEN_THREAD.git
cd GREEN_THREAD
npm install
npm run dev            # opens on localhost — runs on the committed catalogue, no keys needed
```

For the AI features (the extension scan, Fabric Check, the concierge) create
your **own** `.env.local` with your **own** Anthropic key:

```
ANTHROPIC_API_KEY=sk-ant-...your-own-key...
```

`.env.local` is git-ignored — it never leaves your machine. **Never paste a
key into a file that isn't `.env.local`, into a commit, or into a chat.** You
do **not** need the Supabase or Vercel credentials to build features; the app
falls back to the committed JSON catalogue when Supabase isn't configured.

## The daily rhythm (this is how we never lose or clobber work)

```bash
git checkout main
git pull                       # 1. ALWAYS start from the latest
git checkout -b fix-the-thing  # 2. one branch per piece of work, never work on main
# ...make changes, with your Claude...
npm run test                   # 3. green before you push (see "Before every push")
git add -A && git commit -m "..."
git push -u origin fix-the-thing
# 4. open a Pull Request on GitHub, the other owner glances at it, then merge
```

Four rules that make this risk-free:

1. **Pull before you start.** Tell your Claude to `git pull` at the top of a session.
2. **One feature = one branch.** Never both commit to `main` directly.
3. **Commit and push often.** Anything only on one laptop is one spilled coffee from gone.
4. **Split the territory.** If we're not editing the same files we almost never
   conflict. Suggested split: one of us owns **the extension + matching**
   (`extension/`, `src/lib/match.ts`, `recommend.ts`, `extract.ts`), the other
   owns **catalogue growth + content** (`scripts/grow.ts`, `data/`, brand
   onboarding, pages). Agree who has what before a session.

`main` is protected: you can't push to it directly, everything lands via a
Pull Request. That's the seatbelt — it means neither of us, and neither
Claude, can put broken code on the live branch by accident.

## Before every push

```bash
npm run test          # unit tests (Vitest) — must be green
npx tsc --noEmit      # types must be clean
npm run build         # production build must pass
```

Your Claude should run these itself before asking you to push. A red test is
a "don't push yet", not a formality.

## Deploying — one hand on the wheel

**Only the repo owner (junaid) deploys to production**, and only after a change
has landed on `main` through a PR. Two reasons, both learned the hard way:

- `vercel deploy` uploads your **local working directory, not git HEAD** — a
  deploy fired mid-edit once shipped a file with a syntax error. Never deploy
  with a dirty working tree.
- Production is tied to the owner's Vercel project, domain (thefibreset.com),
  and keys. Your feature reaches the live site *after* it's on `main`, not before.

If you're not the owner: get your work reviewed and merged, and let the owner
run the deploy.

## Gotchas worth knowing before your Claude hits them

- **PowerShell here-strings (`@'…'@`) silently swallow `git commit -m`** — the
  push then says "Everything up-to-date" and your commit never happened. Use
  `git commit -F message.txt` for multi-line messages on Windows.
- **The catalogue is a pipeline, not a hand-edited file.** To change products:
  `npm run grow -- <domain>` to scout/onboard a brand, `npm run ingest:live`
  to re-harvest, then `npm run embed` to rebuild the visual-match index
  (`data/twins.json`) and `npm run db:setup` to push to Supabase. Don't
  hand-edit `data/products_live.json`.
- **Chrome doesn't hot-reload unpacked extensions.** After editing anything in
  `extension/`, hit the refresh icon on the extension's card in
  `chrome://extensions`.

## Where the context lives (read these first)

- `PROJECT_HANDOVER.md` — the whole architecture and history.
- `AGENTS.md` / `CLAUDE.md` — instructions your Claude should follow.
- `extension/README.md` — how the browser extension works.

## Rotate the shared keys

The Anthropic and Supabase keys were exposed in chat during early development.
Before this repo has more than one person in it, the owner should rotate them
(Anthropic console + Supabase dashboard) and update Vercel's environment
variables. Bringing in a second owner is the right moment to do it.
