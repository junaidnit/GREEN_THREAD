# The Fibre Set — VC pitch pack

> Everything you need to run a 3-minute pitch + live product demo.
> **[FILL]** marks a real number only you can supply — never present a
> placeholder as fact to investors.

---

## 1. The 3-minute pitch script (spoken, ~430 words)

> Read at ~150 wpm. Timings are cues, not handcuffs. The demo is the centre of
> gravity — everything builds to it and pays off from it.

**[0:00 – 0:20 · Hook]**
"Pick up almost anything on the high street labelled 'linen' or 'cashmere-feel',
and there's a good chance it's mostly plastic. A 'linen blend' can be 90%
polyester. The real composition is buried, vague, or missing — and by the time
you find it, you've already bought it. We all say we want natural fibres against
our skin. Almost nobody can actually tell what they're buying."

**[0:20 – 0:45 · Why it matters, why now]**
"This matters more every year — for the millions with eczema and sensitive skin,
for comfort, for quality, for what you're paying for. And the timing is the
whole point: from 2028, the EU's Digital Product Passport forces every garment
to carry its real composition. A wave of fibre data is about to arrive. The
question is who becomes the consumer layer that reads it — and builds the habit
first."

**[0:45 – 1:45 · Solution + LIVE DEMO]**
"That's The Fibre Set — a free browser tool that reads any garment's label the
moment you're shopping, and tells you the truth.
*(DEMO)* Here I am on a normal retailer's product page. I click our extension…
it reads the label right here in my browser — and instantly: this 'linen' top is
62% polyester. Plastic, dressed up as natural. And here's the part that makes it
a business, not a warning label: we don't just judge it — we show you a real,
natural-fibre alternative that looks like what you wanted, matched on the actual
photo, that you can buy in one click. We've done exactly this for 1,860 real
products across six brands — every single one verified from the brand's own
disclosed label."

**[1:45 – 2:15 · Business model + market]**
"We make money the way Honey does on price — but on fibre. We earn affiliate
commission every time we send a purchase to a brand, and that plumbing is already
built. On top of that, the fibre industry itself — Woolmark, TENCEL, European
Flax — pays to reach exactly these shoppers. Natural-fibre and sensitive-skin
demand is rising fast, and the 2028 mandate turns a niche into the default."

**[2:15 – 2:40 · Traction + founder]**
"This is live today: the site, the browser extension, 1,860 real products,
condition filters that protect people with skin conditions from the fibres that
harm them. And me — I grew up in a mohair family in the Eastern Cape; my father
ran the yarn factory. I've spent my whole life learning to read cloth. This is
the tool I always wished I had."

**[2:40 – 3:00 · The ask + close]**
"We're raising **[FILL £amount]** to grow the catalogue, switch on affiliate
revenue at scale, and be the consumer front-end for fibre truth when the 2028
data lands. Fashion is about to be forced honest. We're building the layer that
reads it — come build it with us."

---

## 2. What to present — slide-by-slide

Keep it to ~10 slides. One idea per slide, big type, few words. The deck is
scaffolding for the demo, not a document to be read.

| # | Slide | The one thing it says | What to put on it |
|---|-------|-----------------------|-------------------|
| 1 | **Title** | Who we are in one line | "The Fibre Set — know what your clothes are really made of." Logo, URL, your name. |
| 2 | **The problem** | You can't tell natural from plastic when it matters | The "linen blend = 90% polyester" example. A real screenshot of a buried/missing composition. |
| 3 | **Who feels it** | This is a *want*, not a lecture | Sensitive skin / eczema, comfort, quality, value. Frame as desire, not guilt. |
| 4 | **Why now** | A regulatory tailwind with a deadline | EU Digital Product Passport → mandatory composition data from 2028. First mover on the data + the habit. |
| 5 | **The product** | A verdict at the moment of purchase | The extension reads any page → verdict → a real natural alternative to buy. (Lead into the live demo here.) |
| 6 | **LIVE DEMO** | Seeing is believing | *Switch to the browser.* See the demo runbook (§3). |
| 7 | **Business model** | Two revenue lines, one already plumbed | Affiliate on redirected purchases (built) + fibre-industry sponsorship. |
| 8 | **Market** | Big, growing, about to be mandated | Global apparel market **[verify $]**; natural-fibre/conscious segment growth **[verify %]**; beachhead = UK/EU natural-fibre + sensitive-skin shoppers. |
| 9 | **Why us / moat** | Hard to copy, positioned for 2028 | Label-verified catalogue + "honesty bar" method; photo-based look-alike engine; deterministic (trustworthy) scoring; positioned as the consumer layer on DPP data. |
| 10 | **Traction + team** | It's real, and it's her life's work | What's live **[FILL metrics]** + founder-market fit (mohair family, factory). |
| 11 | **The ask** | Clear number, clear use | **[FILL £amount]** → catalogue growth, affiliate revenue, mobile, 2028 data readiness, key hires. |

---

## 3. The live demo runbook (the 60–90s that wins the room)

**Golden rule: rehearse it 5 times and have a recorded fallback (a screen
recording or GIF) in case the venue Wi-Fi dies. Never demo live on hope.**

Two ways to run it:

**A) The extension on a real retailer page (most powerful).**
1. Open a real product page on a mainstream retailer that discloses a blend
   (something sold as "linen"/"cashmere-feel" that's mostly synthetic).
2. Click the Fibre Set extension → the verdict panel appears (e.g. "62%
   plastic") **in their own browser, on a site that isn't ours** — this is the
   wow.
3. Point at the recommended natural-fibre alternative → click it → land on The
   Fibre Set with the real product + Buy.

**B) The site itself (fully under your control — use this if unsure of Wi-Fi).**
1. Home: the label-check animation + "Know what your clothes are really made of."
2. Search **"shirt for dermatitis"** → show the condition lock: wool is *hard-
   excluded and can't be turned back on* (the safety USP).
3. Open a product (e.g. the **Nova Linen Jumpsuit**) → the **multi-image gallery**,
   the **full merchant description**, the **"why it feels good to wear"** benefits,
   the **reviews**, and **Buy** opening the real merchant page.
4. Fabric Check: paste any product URL → it reads and scores that page live.

**Demo talking track:** "Everything you're seeing is real — real products, real
prices, real photos, pulled from the brands' own data. Nothing here is invented."

> **Before the pitch:** run the site locally with the freshest catalogue so every
> product shows its gallery + full description:
> ```bash
> CATALOG_SOURCE=local npm run dev
> ```
> Then demo on `http://localhost:3000`. (See "Making it live" note from the team.)

---

## 4. Anticipated VC questions (and crisp answers)

- **"Isn't this just Good On You / a sustainability app?"**
  No — those rate *brands* on ethics. We give a *garment-level* fibre verdict at
  the *moment of purchase*, and we hand you a real alternative to buy. It's
  transactional, not editorial.

- **"Honey already owns the checkout browser layer."**
  Honey competes on *price*. We compete on *fibre truth* — a different trigger,
  a different shopper, and a category nobody owns. Same proven mechanic.

- **"How do you make money if the tool is free?"**
  Affiliate commission on every purchase we send to a brand (plumbing built), plus
  sponsorship from fibre bodies who pay to reach these buyers. **[FILL current
  affiliate/deal status.]**

- **"What's defensible?"**
  A proprietary, label-verified catalogue built on a strict honesty bar; a
  photo-based look-alike engine; and pole position as the consumer front-end for
  EU DPP data from 2028 — data + brand relationships compound.

- **"How big is this really?"**
  Beachhead is natural-fibre and sensitive-skin shoppers in the UK/EU **[verify
  size]**; the 2028 mandate expands the addressable data to *every garment sold in
  the EU*. **[FILL your TAM/SAM/SOM with researched figures.]**

- **"Why you?"**
  I was raised in a mohair family; my father ran the yarn factory. Reading cloth
  is not a market I discovered — it's my life. **[FILL co-founders/advisors.]**

- **"What are you raising and for what?"**
  **[FILL £amount]** for catalogue growth to N brands, turning on affiliate
  revenue, a mobile app, and 2028 data-integration readiness. **[FILL runway.]**

---

## 5. Numbers to fill in before you present (do NOT wing these)

- [ ] Funding **ask** (£) and **use of funds**
- [ ] Traction: extension installs, site visitors, waitlist, affiliate revenue,
      brand LOIs/partnerships
- [ ] TAM / SAM / SOM with a cited source
- [ ] Team beyond founder (co-founders, advisors, key hires planned)
- [ ] Any early conversion / engagement metric from the live product

## 6. Positioning reminders (keep the whole pitch on-message)

- Lead with **desire, not guilt**: feel, comfort, skin, quality — "natural
  fibres, chosen for you." A bigger market than eco-shaming.
- The demo is the pitch. Words support the click, not the other way round.
- Everything is **real** — say it, because it's your credibility moat.
- One sentence they should remember: *"Fashion is about to be forced honest —
  we're the layer that reads it."*
