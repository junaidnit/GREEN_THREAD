const DEFAULT_API_BASE = "https://thefibreset.com";
const input = document.getElementById("base");
const status = document.getElementById("status");

chrome.storage.local.get("apiBase").then(({ apiBase }) => {
  input.value = apiBase || DEFAULT_API_BASE;
});

document.getElementById("save").addEventListener("click", async () => {
  const value = input.value.trim().replace(/\/$/, "") || DEFAULT_API_BASE;
  await chrome.storage.local.set({ apiBase: value });
  status.textContent = "Saved — reload any open tabs to apply.";
});
