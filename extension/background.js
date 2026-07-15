// Runs the cross-origin API call from the extension's own context, not the
// content script — avoids being blocked by the host page's CSP connect-src,
// and gives the request a stable, predictable origin (chrome-extension://…).

const DEFAULT_API_BASE = "https://greenthread.info";

async function getApiBase() {
  const { apiBase } = await chrome.storage.local.get("apiBase");
  return apiBase || DEFAULT_API_BASE;
}

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
      sendResponse({ ok: false, error: `Couldn't reach GreenThread (${base}). ${e.message || e}` });
    }
  })();

  return true; // keep the message channel open for the async response
});
