const DEFAULT_API_BASE = "https://thefibreset.com";
// kept in step with background.js — a saved legacy host 308-redirects, and a
// CORS preflight may not follow a redirect, which surfaces as "Failed to fetch"
const LEGACY_HOSTS = new Set(["greenthread.info", "www.greenthread.info"]);

const input = document.getElementById("base");
const status = document.getElementById("status");

function normalise(value) {
  const v = (value || "").trim().replace(/\/$/, "");
  if (!v) return DEFAULT_API_BASE;
  try {
    return LEGACY_HOSTS.has(new URL(v).hostname) ? DEFAULT_API_BASE : v;
  } catch {
    return DEFAULT_API_BASE;
  }
}

chrome.storage.local.get("apiBase").then(async ({ apiBase }) => {
  const current = normalise(apiBase || DEFAULT_API_BASE);
  input.value = current;
  if (apiBase && apiBase !== current) {
    await chrome.storage.local.set({ apiBase: current });
    status.textContent = "Updated to our current address.";
  }
});

document.getElementById("save").addEventListener("click", async () => {
  const value = normalise(input.value);
  input.value = value;
  await chrome.storage.local.set({ apiBase: value });
  status.textContent = "Saved.";
});
