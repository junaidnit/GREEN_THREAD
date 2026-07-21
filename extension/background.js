// Runs the cross-origin API call from the extension's own context, not the
// content script — avoids being blocked by the host page's CSP connect-src,
// and gives the request a stable, predictable origin (chrome-extension://…).
//
// PERMISSION MODEL: activeTab, not host permissions. The extension can read a
// page only after the user clicks the toolbar icon, and only that tab. This is
// why the install dialog shows no "read and change all your data on all
// websites" warning. Do not add host_permissions to make something convenient:
// the clean install prompt is worth more than the convenience.
//
// The API needs no host permission either — /api/extension/scan serves
// Access-Control-Allow-Origin, so a plain CORS fetch from this worker works.

const DEFAULT_API_BASE = "https://thefibreset.com";

/**
 * Hosts we have moved off. A SAVED endpoint always beat the default, so
 * installs from before the rename kept calling greenthread.info — which now
 * 308-redirects to thefibreset.com. A CORS preflight may not follow a
 * redirect: the browser treats it as a network error and the panel showed
 * "Failed to fetch". Migrate the stored value instead of trusting it.
 */
const LEGACY_HOSTS = new Set(["greenthread.info", "www.greenthread.info"]);

function isLegacy(base) {
  try {
    return LEGACY_HOSTS.has(new URL(base).hostname);
  } catch {
    return true; // unparseable is never worth keeping
  }
}

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase");
  if (!apiBase) return DEFAULT_API_BASE;
  if (isLegacy(apiBase)) {
    await chrome.storage.local.set({ apiBase: DEFAULT_API_BASE });
    return DEFAULT_API_BASE;
  }
  return apiBase;
}

/**
 * Toolbar click = the user asking about THIS page. activeTab is granted at
 * this moment, so inject on demand and open the panel straight away rather
 * than making them find a badge and click it a second time.
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["brand-mark.js", "content.js"],
    });
    // already-injected tabs no-op on re-injection, so tell the panel to open
    await chrome.tabs.sendMessage(tab.id, { type: "gt-open" });
  } catch {
    // chrome://, the Web Store and PDF viewers refuse injection — nothing to
    // report to the user, the icon simply does nothing on those pages
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  // heal a stored legacy endpoint on update, before the user hits an error
  const base = await getApiBase();
  // first run: land somewhere that explains what to do next
  if (details.reason === "install") {
    chrome.tabs.create({ url: `${base}/extension/installed` });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "gt-scan") return false;

  (async () => {
    const post = (base) =>
      fetch(`${base}/api/extension/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload),
      });

    let base = await getApiBase();
    let res;
    try {
      res = await post(base);
    } catch (e) {
      // A custom endpoint can rot — a dev server that isn't running, or a host
      // that started redirecting (a CORS preflight may not follow a redirect,
      // which surfaces only as "Failed to fetch"). Fall back to the real site
      // once rather than leaving the user stuck on a saved setting.
      if (base === DEFAULT_API_BASE) {
        sendResponse({ ok: false, error: `Couldn't reach The Fibre Set (${base}). ${e.message || e}` });
        return;
      }
      try {
        res = await post(DEFAULT_API_BASE);
        await chrome.storage.local.set({ apiBase: DEFAULT_API_BASE });
        base = DEFAULT_API_BASE;
      } catch (e2) {
        sendResponse({
          ok: false,
          error: `Couldn't reach The Fibre Set (tried ${base}, then ${DEFAULT_API_BASE}). ${e2.message || e2}`,
        });
        return;
      }
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      sendResponse({ ok: false, error: data?.error || `Server error (${res.status})` });
      return;
    }
    sendResponse({ ok: true, data, apiBase: base });
  })();

  return true; // keep the message channel open for the async response
});
