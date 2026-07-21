# Chrome Web Store submission — Fabric Check

Everything needed for the listing. Steps 1–3 need the owner's Google account;
the rest is prepared here.

---

## 1. One-off account setup (owner only)

1. Go to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Pay the **$5 one-time registration fee**.
3. Verify your contact email and set a **publisher display name** — use
   `The Fibre Set`, not a personal name. It appears on the listing.

> Publishing under a personal Gmail is allowed but looks unprofessional next to
> the brand. If you want the listing to say "The Fibre Set", set the publisher
> display name before you submit — changing it later re-triggers review.

## 2. Build the package

```
npm run pack:extension
```

Uploads: `public/downloads/the-fibre-set-extension.zip`

The same file the website serves, so what reviewers see is what users get.

## 3. Listing fields

**Name**
```
Fabric Check — The Fibre Set
```

**Summary** (132 char limit)
```
See what a garment is really made of before you buy — and find the same piece in a natural fibre.
```

**Description**
```
Most of the high street is oil-derived plastic dressed up as something natural. A "linen-blend" shirt can be 72% polyester, and the label rarely makes that obvious.

Fabric Check reads the fibre composition on any retailer's product page and tells you, in plain terms, what you're actually buying:

• The full fibre breakdown, as disclosed on the page
• How much of it is oil-derived plastic
• A natural-fibre alternative you can buy instead, where one exists

HOW IT WORKS
Open any product page and click the ribbon icon in your toolbar. That's it. There's no account and nothing to configure.

PRIVACY BY DESIGN
Fabric Check can only see a page in the moment you click the icon — that's what the "activeTab" permission means. It doesn't run in the background, it can't see your other tabs, and it has no view of your browsing history. That's also why installing it shows no "read and change all your data on all websites" warning.

We don't store the pages you check. Full policy: https://thefibreset.com/privacy

WHY WE BUILT IT
From 2028 the EU Digital Product Passport will make fibre disclosure mandatory. We're building the independent record now — every product we read goes onto a public, timestamped ledger, and garments named after a fibre they barely contain are published on our Label Watch page.

Free, always. We earn through affiliate links when you choose to buy — never from what the extension tells you.
```

**Category:** Shopping
**Language:** English (UK)

## 4. Privacy tab — this is where submissions get rejected

**Single purpose**
```
Fabric Check reads the fibre composition stated on a clothing product page the user is viewing, and reports what the garment is made of.
```

**Permission justifications**

| Permission | Justification |
|---|---|
| `activeTab` | The extension reads the product page the user is currently viewing, only after they click the toolbar icon. This is how it obtains the fibre composition text, which is printed on the page itself. |
| `scripting` | Required to inject the reading script into the current tab at the moment the user clicks the toolbar icon. Nothing is injected before that click. |
| `storage` | Stores one setting — the API endpoint — in local browser storage. No user data is kept. |

> There are no host permissions, and no remote code. Say so if asked: our API
> sends CORS headers, so the service worker calls it without host access.

**Data use disclosures** — tick exactly these:

- [x] Collects **website content** — page text is sent to our server to extract the composition
- [ ] Personally identifiable information — no
- [ ] Health, financial, authentication, personal communications, location — no
- [ ] User activity — no (we log the domain only, not behaviour)

Then certify all three:
- [x] Not being sold to third parties
- [x] Not used for purposes unrelated to the single purpose
- [x] Not used to determine creditworthiness or for lending

**Privacy policy URL**
```
https://thefibreset.com/privacy
```

## 5. Graphics

| Asset | Size | Status |
|---|---|---|
| Store icon | 128×128 | ✅ `icons/icon128.png` |
| Small promo tile | 440×280 | ✅ `store/promo-440x280.png` (`npm run brand:store`) |
| Screenshots | 1280×800, 1–5 | ⚠️ **must be captured from the real extension** |

Screenshots have to show the actual product in use — Google rejects mocked-up
or purely promotional images. Capture the panel open on a real product page:

1. Load the extension, open a product page on a real shop.
2. Click the ribbon, let the panel finish loading.
3. Screenshot the window at 1280×800 (or capture larger and scale down).

Good ones to take: a **mostly-plastic** item showing a high plastic
percentage, and a **natural** item showing the 100% mark and an alternative.

## 6. Submit

Expect a few days; longer if a reviewer questions permissions. Once approved,
copy the extension ID from the dashboard into `STORE_URL` in
`src/components/install-extension.tsx`:

```ts
const STORE_URL = "https://chrome.google.com/webstore/detail/<EXTENSION-ID>";
```

That flips the website button from "Download" to "Add to Chrome". One line, one
deploy.

## 7. Microsoft Edge (optional, free)

[Partner Center](https://partner.microsoft.com/dashboard/microsoftedge) — no
fee, same zip. Worth doing eventually, but Edge installs Chrome Web Store
extensions fine, so it isn't a launch blocker.

---

## Before you submit — checklist

- [ ] `privacy@thefibreset.com` actually receives mail (it's published in the policy)
- [ ] Publisher display name set to "The Fibre Set"
- [ ] `npm run pack:extension` run after any code change
- [ ] Screenshots captured from a real page
- [ ] Version bumped in `manifest.json` (the store rejects a re-upload of the same version)
