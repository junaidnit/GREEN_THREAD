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

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase");
  return apiBase || DEFAULT_API_BASE;
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

/** First run: land somewhere that explains what to do next. */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install") return;
  const base = await getApiBase();
  chrome.tabs.create({ url: `${base}/extension/installed` });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "gt-scan") return false;

  (async () => {
    const base = await getApiBase();
    try {
      const res = await fetch(`${base}/api/extension/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        sendResponse({ ok: false, error: data?.error || `Server error (${res.status})` });
        return;
      }
      sendResponse({ ok: true, data, apiBase: base });
    } catch (e) {
      sendResponse({ ok: false, error: `Couldn't reach The Fibre Set (${base}). ${e.message || e}` });
    }
  })();

  return true; // keep the message channel open for the async response
});
