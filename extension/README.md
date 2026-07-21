# The Fibre Set — Fabric Check (browser extension)

Click the ribbon in your toolbar on any clothing product page. It reads the
label, scores the fibre honestly, and — if something better exists — shows a
real natural-fibre alternative you can buy today.

## Permission model: activeTab, deliberately

This extension asks for **no host permissions**. It cannot see any page until
you click its toolbar icon, and then only that one tab.

That means the Chrome install dialog shows **no** "read and change all your
data on all websites" warning — the single biggest reason people abandon an
extension install, and the thing that draws the heaviest store review.

**Do not add `host_permissions` or a static `content_scripts` block to make
something convenient.** The clean install prompt is worth more than the
convenience. It also means the badge cannot appear automatically on page load;
the toolbar icon is the entry point, by design.

The API needs no host permission either: `/api/extension/scan` serves
`Access-Control-Allow-Origin`, so the service worker reaches it with a plain
CORS fetch.

## How it works

1. **background.js** listens for a toolbar click. `activeTab` is granted at
   that moment, so it injects `brand-mark.js` + `content.js` into the current
   tab via `chrome.scripting`, then posts a `gt-open` message.
2. **content.js** builds the panel in a Shadow DOM (it can't see, or be seen
   by, the host page's styles) and scrapes the **already-rendered** page:
   title, JSON-LD `Product` data, and the text around any composition-sounding
   words. This runs in the user's own browser, so it works even on sites that
   block automated server fetches.
3. It sends that text back to **background.js**, which posts it to
   `/api/extension/scan` from the extension's own context — avoiding the host
   page's Content-Security-Policy blocking the request.
4. The server runs the same Claude extraction + scoring rubric the rest of The
   Fibre Set uses, matches it against the live catalogue for a better-fibre
   alternative, and the panel renders the verdict.

Re-clicking the icon re-runs `content.js`, which hits its `__gtInjected` guard
and returns early — so the `gt-open` message is what actually toggles the
panel, not the injection.

## Performance

A scan is one model call, and the user is watching a spinner the whole time.

| | avg, warm |
|---|---|
| `claude-sonnet-5` (was) | ~7.3 s |
| `claude-haiku-4-5` (now) | ~3.6 s |

Measured on the same Uniqlo page, three runs each. Composition, grade and
recommendations were identical; haiku also classified Elastomultiester more
precisely. Honesty was re-checked on a page with no stated composition (still
returns `found: false` rather than inventing fibres) and on a 100% linen page.

`content.js` also races every scan against a 30 s deadline. An MV3 service
worker can be recycled while its fetch is in flight, and the callback then
never runs — the panel spun on "Reading label…" indefinitely with nothing to
click. It now always resolves, and a timeout leaves the panel retryable.

## Files

| File | Role |
|---|---|
| `manifest.json` | MV3, activeTab + scripting + storage. No host permissions |
| `background.js` | Service worker: toolbar click, injection, API call, install welcome |
| `content.js` | Panel UI + page scraping, injected on demand |
| `brand-mark.js` | **Generated** — the heritage ribbon path. `npm run brand:icons` |
| `options.html` / `options.js` | Settings (API endpoint). Right-click icon → Options |
| `icons/` | **Generated** from the traced logo. `npm run brand:icons` |
| `store/` | Web Store promo art. `npm run brand:store`. Not shipped in the zip |
| `STORE-SUBMISSION.md` | Listing copy, permission justifications, submission steps |

`brand-mark.js` and `icons/` are generated from
`src/components/brand-path.ts`, so the website, the toolbar icon and the
in-page badge all draw one identical mark. Never hand-edit them — re-run the
script.

## Load it locally (testing)

1. `npm run pack:extension` (regenerates the mark and icons, then zips).
2. Open `chrome://extensions`, enable **Developer mode** (top-right).
3. **Load unpacked** → select this `extension/` folder.
4. Right-click the icon → **Options** → set the API endpoint to
   `http://localhost:3000` when testing against a dev server. The default is
   `https://thefibreset.com`.
5. Open a real clothing product page and click the toolbar icon.

Chrome does **not** hot-reload unpacked extensions — after changing any file
here, hit the refresh icon on that extension's card in `chrome://extensions`.

## Publishing

See **[STORE-SUBMISSION.md](./STORE-SUBMISSION.md)** — listing copy, permission
justifications, data disclosures and the exact steps. The developer account and
its one-off $5 fee need the owner's own Google account.
