// GreenThread Fabric Check — content script.
// Injects a small ribbon badge on every page. On click, it scrapes the
// ALREADY-RENDERED page (title, JSON-LD, visible text) — no server fetch
// needed, which is what lets this work on sites that block automated
// reading — and asks the GreenThread API what the garment is made of and
// whether a better-fibre alternative exists to buy instead.
(function () {
  if (window.__gtInjected) return;
  window.__gtInjected = true;

  const MARK_PATH_A =
    "M 58 13 C 86 13, 94 44, 74 64 C 68 71, 62 77, 55 85 C 42 100, 30 110, 22 116 C 8 126, 10 138, 26 139 L 76 141";
  const MARK_PATH_B =
    "M 58 13 C 30 13, 22 44, 42 64 C 48 70, 53 77, 57 86 C 62 100, 64 112, 65 124 C 66 136, 68 146, 71 158";

  function markSvg(color, size) {
    return `<svg width="${size}" height="${Math.round((size * 168) / 120)}" viewBox="0 0 120 168" fill="none">
      <defs><mask id="gtm" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="168">
        <rect width="120" height="168" fill="white"/>
        <path d="M 50 73 L 59 92" stroke="black" stroke-width="24"/>
        <path d="M 63.5 124 L 67.5 148" stroke="black" stroke-width="24"/>
      </mask></defs>
      <path mask="url(#gtm)" d="${MARK_PATH_A}" stroke="${color}" stroke-width="17" stroke-linejoin="round"/>
      <path d="${MARK_PATH_B}" stroke="${color}" stroke-width="17" stroke-linejoin="round"/>
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

  function scrapePage() {
    const meta = (prop) =>
      document.querySelector(`meta[property="${prop}"]`)?.content ||
      document.querySelector(`meta[name="${prop}"]`)?.content ||
      "";

    let jsonLd = "";
    for (const el of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(el.textContent);
        const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] || [parsed];
        for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
          const t = node && node["@type"];
          if (t === "Product" || (Array.isArray(t) && t.includes("Product"))) {
            jsonLd += ` PRODUCT-DATA: ${JSON.stringify(node).slice(0, 3000)}`;
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
        background: #1f5137; box-shadow: 0 4px 18px rgba(0,0,0,.28);
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
        background: #faf7f2; color: #1a1a1a; border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,.35); padding: 16px;
        font-size: 13px; line-height: 1.45; display: none;
      }
      .panel.open { display: block; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .title { font-weight: 700; font-size: 13.5px; margin: 0 0 2px; }
      .muted { color: #6b6558; font-size: 11.5px; }
      .close { cursor: pointer; border: none; background: none; font-size: 16px; color: #6b6558; padding: 0 2px; }
      .badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 700; }
      .natural { background: rgba(31,81,55,.12); color: #1f5137; }
      .plastic { background: rgba(0,0,0,.08); color: #444; }
      .warn { background: rgba(178,52,40,.12); color: #b23428; }
      .comp-bar { height: 7px; border-radius: 4px; background: #e7e2d5; overflow: hidden; display: flex; margin: 8px 0 4px; }
      .comp-seg { height: 100%; }
      .comp-list { font-size: 11.5px; color: #4a463d; margin: 0 0 10px; }
      .section-title { font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #6b6558; margin: 14px 0 8px; }
      .rec { display: flex; gap: 8px; align-items: center; padding: 7px 0; border-top: 1px solid #ece7da; text-decoration: none; color: inherit; }
      .rec:first-child { border-top: none; }
      .rec img { width: 44px; height: 55px; object-fit: cover; border-radius: 6px; background: #ece7da; flex-shrink: 0; }
      .rec-body { flex: 1; min-width: 0; }
      .rec-title { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .rec-meta { font-size: 11px; color: #6b6558; }
      .live-tag { font-size: 9px; font-weight: 700; color: #1f5137; }
      .cta { display: block; text-align: center; margin-top: 12px; padding: 9px; border-radius: 8px; background: #1f5137; color: #f5f2ea !important; font-weight: 700; font-size: 12px; text-decoration: none; }
      .footer-link { display: block; text-align: center; margin-top: 8px; font-size: 11px; color: #6b6558; text-decoration: none; }
      .empty { color: #6b6558; font-size: 12px; padding: 6px 0 2px; }
    </style>
    <div style="position:relative;">
      <button class="pill" id="gt-toggle" aria-label="GreenThread Fabric Check" title="Check this garment's fibre">
        ${markSvg("#f5f2ea", 20)}
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

  function renderLoading() {
    toggle.innerHTML = `<div class="spin">${markSvg("#f5f2ea", 20)}</div>`;
    panel.innerHTML = `<p class="empty">Reading the label…</p>`;
  }

  function renderError(message) {
    toggle.innerHTML = markSvg("#f5f2ea", 20);
    panel.innerHTML = `<div class="row"><p class="title">Fabric Check</p><button class="close" id="gt-close">×</button></div>
      <p class="empty">${message}</p>`;
    shadow.getElementById("gt-close").addEventListener("click", () => setOpen(false));
  }

  function renderResult(data, apiBase) {
    toggle.innerHTML = markSvg("#f5f2ea", 20);

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
    const segColors = { natural: "#1f5137", plastic: "#8a8577" };
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

    const recsHtml = (data.recommendations || [])
      .map(
        (r) => `
        <a class="rec" href="${apiBase}/out/${encodeURIComponent(r.id)}" target="_blank" rel="noopener">
          <img src="${r.image_url}" alt="" loading="lazy" />
          <div class="rec-body">
            <div class="rec-title">${escapeHtml(r.title)}</div>
            <div class="rec-meta">${escapeHtml(r.brand)} · ${currencySymbol(r.currency)}${r.price} · ${r.grade} ${r.score}${r.source === "live" ? ' · <span class="live-tag">● LIVE</span>' : ""}</div>
          </div>
        </a>`,
      )
      .join("");

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
            }</p>${recsHtml}`
          : `<p class="empty">No natural-fibre alternative in this category yet.</p>`
      }
      <a class="cta" href="${apiBase}/search?pure=1" target="_blank" rel="noopener">Shop plastic-free on GreenThread →</a>
    `;
    shadow.getElementById("gt-close").addEventListener("click", () => setOpen(false));
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  toggle.addEventListener("click", () => {
    setOpen(!open);
    if (loaded || !open) return;
    loaded = true;
    renderLoading();
    const payload = scrapePage();
    chrome.runtime.sendMessage({ type: "gt-scan", payload }, (response) => {
      if (chrome.runtime.lastError) {
        renderError("Couldn't reach the GreenThread extension backend.");
        loaded = false;
        return;
      }
      if (!response || !response.ok) {
        renderError(response?.error || "Something went wrong reading this page.");
        loaded = false;
        return;
      }
      renderResult(response.data, response.apiBase.replace(/\/$/, ""));
    });
  });
})();
