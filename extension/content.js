// The Fibre Set Fabric Check — content script.
// Injects a small ribbon badge on every page. On click, it scrapes the
// ALREADY-RENDERED page (title, JSON-LD, visible text) — no server fetch
// needed, which is what lets this work on sites that block automated
// reading — and asks the Fibre Set API what the garment is made of and
// whether a better-fibre alternative exists to buy instead.
(function () {
  if (window.__gtInjected) return;
  window.__gtInjected = true;

  // The heritage ribbon, from brand-mark.js (generated off the same traced
  // artwork the website and the toolbar icons use). Aspect ratio is preserved
  // from the viewBox — never squashed to a square.
  const MARK = globalThis.FIBRESET_MARK;

  function markSvg(color, size) {
    const w = Math.round((size * MARK.width) / MARK.height);
    return `<svg width="${w}" height="${size}" viewBox="${MARK.viewBox}" fill="none">
      <path d="${MARK.d}" fill="${color}"/>
    </svg>`;
  }

  // ---------- scrape the rendered page ----------
  const COMPOSITION_RE =
    /composition|material|fabric|% (cotton|polyester|linen|wool|viscose|elastane|nylon|hemp)/i;

  /**
   * An actual stated fibre percentage ("95% Organic Cotton"). Deliberately
   * strict: a bare `\d+%` also matches "50% off" in a sale banner, and the
   * word "material" shows up in site nav — so a loose test wrongly concludes
   * the visible text already holds the composition and skips the fallback.
   */
  const FIBRE_PCT_RE =
    /\d{1,3}\s*%\s*(organic\s+|recycled\s+|virgin\s+)?(cotton|polyester|nylon|polyamide|linen|flax|wool|merino|cashmere|viscose|rayon|lyocell|tencel|modal|elastane|spandex|silk|hemp|acrylic|bamboo|cupro)/i;

  /**
   * Text of the whole document, including DOM that is present but not
   * visible. Retailers routinely park the fibre composition inside a
   * collapsed "Product details" accordion (Uniqlo does exactly this), and
   * body.innerText omits anything hidden — so scraping innerText alone
   * reports "no composition disclosed" on pages that plainly disclose it.
   * Stripping tags off the live outerHTML mirrors what the server-side
   * Fabric Check does, and sees the collapsed content too.
   */
  function documentText() {
    return document.documentElement.outerHTML
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * The garment's own photo — the single most useful signal for "find me one
   * that looks like this". Matching used to run on title words alone, so a
   * jacket whose title never says "olive" could not be matched on colour at
   * all. Preference order: og:image (what the page itself calls its hero),
   * then JSON-LD Product.image, then the largest image actually rendered.
   */
  function productImage(jsonLdImage) {
    const abs = (u) => {
      try {
        return new URL(u, location.href).href;
      } catch {
        return null;
      }
    };
    const og =
      document.querySelector('meta[property="og:image"]')?.content ||
      document.querySelector('meta[name="og:image"]')?.content;
    if (og) return abs(og);
    if (jsonLdImage) return abs(jsonLdImage);

    let best = null;
    for (const img of document.images) {
      const area = img.naturalWidth * img.naturalHeight;
      // skip icons, sprites, tracking pixels and wide banners
      if (img.naturalWidth < 200 || img.naturalHeight < 200) continue;
      if (img.naturalWidth > img.naturalHeight * 2) continue;
      if (!best || area > best.area) best = { area, src: img.currentSrc || img.src };
    }
    return best ? abs(best.src) : null;
  }

  function scrapePage() {
    const meta = (prop) =>
      document.querySelector(`meta[property="${prop}"]`)?.content ||
      document.querySelector(`meta[name="${prop}"]`)?.content ||
      "";

    let jsonLd = "";
    let jsonLdImage = null;
    for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(el.textContent);
        const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] || [parsed];
        for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
          const t = node && node["@type"];
          if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) {
            jsonLd += ` PRODUCT-DATA: ${JSON.stringify(node).slice(0, 3000)}`;
            if (!jsonLdImage && node.image) {
              jsonLdImage = Array.isArray(node.image) ? node.image[0] : node.image;
              if (jsonLdImage && typeof jsonLdImage === "object") jsonLdImage = jsonLdImage.url ?? null;
            }
          }
        }
      } catch {
        /* malformed JSON-LD is common on the open web; skip */
      }
    }

    // visible text first (cleanest), then fall back to the full DOM text
    // when the composition is hidden behind a collapsed panel
    const visible = (document.body.innerText || "").replace(/\s+/g, " ").trim();
    const source = FIBRE_PCT_RE.test(visible) ? visible : documentText();

    // anchor the window on a real fibre percentage when there is one;
    // otherwise fall back to the looser keyword hit
    const compIdx = source.search(FIBRE_PCT_RE) >= 0 ? source.search(FIBRE_PCT_RE) : source.search(COMPOSITION_RE);
    const window_ =
      compIdx > 2000
        ? source.slice(0, 1200) + " … " + source.slice(compIdx - 400, compIdx + 3500)
        : source.slice(0, 5000);

    return {
      url: location.href,
      title: meta("og:title") || document.title || "",
      siteName: meta("og:site_name") || location.hostname,
      text: `${meta("og:description")} ${jsonLd} ${window_}`.trim(),
      imageUrl: productImage(jsonLdImage),
    };
  }

  // ---------- UI ----------
  const host = document.createElement("div");
  host.id = "greenthread-fabric-check-root";
  host.style.cssText = "all:initial;position:fixed;z-index:2147483647;bottom:22px;right:22px;";
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; font-family: -apple-system, "Segoe UI", sans-serif; }
      .pill {
        display: flex; align-items: center; justify-content: center;
        width: 46px; height: 46px; border-radius: 999px;
        background: #141414; box-shadow: 0 4px 18px rgba(0,0,0,.28);
        cursor: pointer; border: none; transition: transform .15s ease;
      }
      .pill:hover { transform: scale(1.06); }
      .pill:active { transform: scale(0.96); }
      .pill svg { display: block; }
      .spin { animation: gt-spin 0.9s linear infinite; }
      @keyframes gt-spin { to { transform: rotate(360deg); } }
      .panel {
        position: absolute; bottom: 58px; right: 0;
        width: 330px; max-height: 78vh; overflow-y: auto;
        background: #F5F3EF; color: #3A3A55; border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,.35); padding: 16px;
        font-size: 13px; line-height: 1.45; display: none;
      }
      .panel.open { display: block; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .title { font-weight: 700; font-size: 13.5px; margin: 0 0 2px; }
      .muted { color: #6F6F66; font-size: 11.5px; }
      .close { cursor: pointer; border: none; background: none; font-size: 16px; color: #6F6F66; padding: 0 2px; }
      .badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 700; }
      .natural { background: rgba(95,125,103,.14); color: #4d6654; }
      .plastic { background: rgba(0,0,0,.08); color: #444; }
      .warn { background: rgba(157,111,112,.16); color: #8d5c5d; }
      .comp-bar { height: 7px; border-radius: 4px; background: #E2DED7; overflow: hidden; display: flex; margin: 8px 0 4px; }
      .comp-seg { height: 100%; }
      .comp-list { font-size: 11.5px; color: #4a463d; margin: 0 0 10px; }
      .section-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #6F6F66; margin: 14px 0 8px; }
      .rec { display: flex; gap: 8px; align-items: center; padding: 7px 0; border-top: 1px solid #ece7da; text-decoration: none; color: inherit; }
      .rec:first-child { border-top: none; }
      .rec img { width: 44px; height: 55px; object-fit: cover; border-radius: 6px; background: #E2DED7; flex-shrink: 0; }
      .rec-body { flex: 1; min-width: 0; }
      .rec-title { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rec-meta { font-size: 11px; color: #6F6F66; }
      .live-tag { font-size: 9px; font-weight: 700; color: #4B2144; }
      .looks { font-size: 11px; color: #6F6F66; margin: -2px 0 8px; }
      .close { font-size: 10px; font-weight: 600; color: #4d6654; }
      .close-exact { color: #2f5d3a; }
      .close-loose { color: #8d5c5d; font-weight: 500; }
      .cta { display: block; text-align: center; margin-top: 12px; padding: 9px; border-radius: 8px; background: #4B2144; color: #F5F3EF !important; font-weight: 700; font-size: 12px; text-decoration: none; }
      .footer-link { display: block; text-align: center; margin-top: 8px; font-size: 11px; color: #6F6F66; text-decoration: none; }
      .empty { color: #6F6F66; font-size: 12px; padding: 6px 0 2px; }
    </style>
    <div style="position:relative;">
      <button class="pill" id="gt-toggle" aria-label="The Fibre Set Fabric Check" title="Check this garment's fibre">
        ${markSvg("#F5F3EF", 22)}
      </button>
      <div class="panel" id="gt-panel"></div>
    </div>
  `;

  document.documentElement.appendChild(host);

  const toggle = shadow.getElementById("gt-toggle");
  const panel = shadow.getElementById("gt-panel");
  let loaded = false;
  let open = false;

  function setOpen(v) {
    open = v;
    panel.classList.toggle("open", v);
  }

  function currencySymbol(code) {
    return { GBP: "£", USD: "$", EUR: "€" }[code] || "";
  }

  /**
   * A warm request answers in about three seconds, but the first one after a
   * quiet spell wakes the server and can take twenty. Silence for twenty
   * seconds reads as broken, so say what is happening instead of leaving the
   * spinner to imply a hang.
   */
  let loadingTimers = [];
  function renderLoading() {
    toggle.innerHTML = `<div class="spin">${markSvg("#F5F3EF", 22)}</div>`;
    panel.innerHTML = `<p class="empty" id="gt-loading">Reading the label…</p>`;
    loadingTimers.forEach(clearTimeout);
    const say = (ms, text) =>
      setTimeout(() => {
        const el = shadow.getElementById("gt-loading");
        if (el) el.textContent = text;
      }, ms);
    loadingTimers = [
      say(6000, "Still reading. First check after a while takes longer…"),
      say(15000, "Waking the server up. This only happens on the first check."),
    ];
  }
  function stopLoadingMessages() {
    loadingTimers.forEach(clearTimeout);
    loadingTimers = [];
  }

  function renderError(message) {
    toggle.innerHTML = markSvg("#F5F3EF", 22);
    panel.innerHTML = `<div class="row"><p class="title">Fabric Check</p><button class="close" id="gt-close">×</button></div>
      <p class="empty">${message}</p>`;
    shadow.getElementById("gt-close").addEventListener("click", () => setOpen(false));
  }

  function renderResult(data, apiBase) {
    toggle.innerHTML = markSvg("#F5F3EF", 22);

    if (!data.found) {
      panel.innerHTML = `
        <div class="row"><p class="title">${escapeHtml(data.title)}</p><button class="close" id="gt-close">×</button></div>
        <p class="empty">This page doesn't state a fibre composition — so there's nothing honest to score here.</p>
        <a class="footer-link" href="${apiBase}/analyze?url=${encodeURIComponent(location.href)}" target="_blank" rel="noopener">Try the full Fabric Check →</a>
      `;
      shadow.getElementById("gt-close").addEventListener("click", () => setOpen(false));
      return;
    }

    const markTone = data.fibreMark.tone === "natural" ? "natural" : data.fibreMark.tone === "plastic-free" ? "natural" : "plastic";
    const segColors = { natural: "#5f7d67", plastic: "#8a8577" };
    const bars = data.composition
      .slice()
      .sort((a, b) => b.pct - a.pct)
      .map((c) => {
        const isPlastic = /polyester|polyamide|nylon|elastane/.test(c.material);
        return `<span class="comp-seg" style="width:${c.pct}%;background:${isPlastic ? segColors.plastic : segColors.natural}"></span>`;
      })
      .join("");
    const compList = data.composition
      .slice()
      .sort((a, b) => b.pct - a.pct)
      .map((c) => `${c.pct}% ${escapeHtml(c.label)}`)
      .join(" · ");

    const misnamedHtml = data.misnamed
      ? `<span class="badge warn">⚠ only ${data.misnamed.actualPct}% ${escapeHtml(data.misnamed.fibre)}</span>`
      : "";

    // How close each pick really is, stated rather than implied. The panel
    // used to headline "Same look" for everything, including items in a
    // different colour, which is exactly what made it feel broken.
    const closeness = (r) => {
      if (r.tier === "exact") return '<span class="close close-exact">closest match</span>';
      if (r.sameColour) return '<span class="close">same colour</span>';
      if (r.samePattern) return '<span class="close">same pattern</span>';
      return '<span class="close close-loose">different colour</span>';
    };

    const recsHtml = (data.recommendations || [])
      .map(
        (r) => `
        <a class="rec" href="${apiBase}/out/${encodeURIComponent(r.id)}" target="_blank" rel="noopener">
          <img src="${r.image_url}" alt="" loading="lazy" />
          <div class="rec-body">
            <div class="rec-title">${escapeHtml(r.title)}</div>
            <div class="rec-meta">${escapeHtml(r.brand)} · ${currencySymbol(r.currency)}${r.price} · ${r.grade} ${r.score}${r.source === "live" ? ' · <span class="live-tag">● LIVE</span>' : ""}</div>
            <div class="rec-meta">${closeness(r)}</div>
          </div>
        </a>`,
      )
      .join("");

    // say what we think it looks like, so a wrong read is visible and fixable
    const looks = data.looksLike?.colour
      ? `<p class="looks">Matching: ${escapeHtml(data.looksLike.colour)}${
          data.looksLike.pattern && data.looksLike.pattern !== "plain"
            ? ` · ${escapeHtml(data.looksLike.pattern)}`
            : ""
        }</p>`
      : "";

    panel.innerHTML = `
      <div class="row"><p class="title">${escapeHtml(data.title)}</p><button class="close" id="gt-close">×</button></div>
      <div class="row" style="margin-top:6px;">
        <span class="badge ${markTone}">${escapeHtml(data.fibreMark.label)}</span>
        <span class="muted">${data.grade} · ${data.score}/100</span>
      </div>
      ${misnamedHtml ? `<div style="margin-top:6px;">${misnamedHtml}</div>` : ""}
      <div class="comp-bar">${bars}</div>
      <p class="comp-list">${compList}</p>
      ${
        recsHtml
          ? `<p class="section-title">${
              data.recommendationsWithinPrice
                ? "Same look, better fibre"
                : "Nothing natural at this price — closest is"
            }</p>${looks}${recsHtml}`
          : `<p class="empty">No natural-fibre alternative in this category yet.</p>`
      }
      <a class="cta" href="${apiBase}/search?pure=1" target="_blank" rel="noopener">Shop plastic-free on The Fibre Set →</a>
    `;
    shadow.getElementById("gt-close").addEventListener("click", () => setOpen(false));
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /**
   * A reply is not guaranteed. An MV3 service worker can be recycled while
   * its fetch is in flight, and then the callback simply never runs — the
   * panel spin "Reading label…" indefinitely with nothing to click. Always
   * race the request against a deadline so the panel resolves either way.
   *
   * 55s, not 30s: a cold start really does take ~22s and the route allows 60,
   * so a 30s deadline was failing requests that were about to succeed. The
   * loading copy explains the wait rather than hiding it.
   */
  const SCAN_TIMEOUT_MS = 55000;

  /** Open the panel and read the page (once per injection). */
  function openPanel() {
    setOpen(true);
    if (loaded) return;
    loaded = true;
    renderLoading();

    let settled = false;
    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      stopLoadingMessages();
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => {
        loaded = false; // let the next click try again
        renderError("That took longer than it should. Click the ribbon to try again.");
      });
    }, SCAN_TIMEOUT_MS);

    const payload = scrapePage();
    chrome.runtime.sendMessage({ type: "gt-scan", payload }, (response) => {
      if (chrome.runtime.lastError) {
        finish(() => {
          loaded = false;
          renderError("Couldn't reach the Fibre Set extension backend.");
        });
        return;
      }
      if (!response || !response.ok) {
        finish(() => {
          loaded = false;
          renderError(response?.error || "Something went wrong reading this page.");
        });
        return;
      }
      finish(() => renderResult(response.data, response.apiBase.replace(/\/$/, "")));
    });
  }

  toggle.addEventListener("click", () => (open ? setOpen(false) : openPanel()));

  /**
   * The toolbar icon is the real entry point now — under activeTab this script
   * is injected on click, so background.js follows the injection with this
   * message. Re-clicking an already-injected tab re-runs the file, hits the
   * __gtInjected guard and does nothing, so the message is what toggles.
   */
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type !== "gt-open") return;
    if (open) setOpen(false);
    else openPanel();
  });
})();
