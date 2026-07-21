# The Fibre Set — Fabric Check (browser extension)

A small ribbon badge that follows you around the web. Click it on any
clothing product page and it reads the label, scores the fibre honestly,
and — if something better exists — shows a real natural-fibre alternative
you can buy today. "Buy" always lands on The Fibre Set, either the exact
real listing (LIVE items) or a similar concept item's simulated checkout.

## How it works

1. **content.js** injects the ribbon into every page (Shadow DOM — it can't
   see or be seen by the host page's styles).
2. On click, it scrapes the **already-rendered** page: title, JSON-LD
   `Product` data, and the text around any composition-sounding words. This
   runs in the user's own browser, so it works even on sites that block
   automated server fetches.
3. **background.js** posts that scraped text to the Fibre Set API
   (`/api/extension/scan`) from the extension's own context — avoids the
   host page's Content-Security-Policy blocking the request.
4. The server runs the same Claude extraction + scoring rubric the rest of
   The Fibre Set uses, matches it against the live catalog for a better-fibre
   alternative, and the panel renders the verdict + recommendation.

## Load it locally (testing)

1. Open `chrome://extensions`, enable **Developer mode** (top-right).
2. **Load unpacked** → select this `extension/` folder.
3. Click the Fibre Set icon in the toolbar → set **API endpoint** to
   `http://localhost:3000` (or whatever port your dev server is on) while
   the production domain isn't reachable yet. Switch back to
   `https://greenthread.info` once that's live.
4. Visit any real clothing product page, click the green ribbon
   bottom-right, and click again after editing code to reload — remember to
   hit the refresh icon on `chrome://extensions` after changing any file
   here (Chrome doesn't hot-reload unpacked extensions).

## Publishing (owner-only — I can't do this part)

Chrome Web Store submission needs a Google-verified developer account (one-time
$5 fee) and manual review — both require your own Google account and
payment method, so this step is yours:

1. [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) → pay the one-time registration fee.
2. Zip this `extension/` folder's contents (not the folder itself) and upload.
3. Fill in the store listing (screenshots, description) and submit for review.

Firefox/Edge stores have their own separate (also owner-only) submission
flows if you want cross-browser reach later — the manifest is already
mostly MV3-portable.
