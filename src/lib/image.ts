/**
 * Product photography is the one asset a comparison site can't fake, and we
 * were showing it at whatever size the feed happened to hand back — often a
 * small thumbnail stretched into a large slot, which reads as cheap.
 *
 * Every brand in the catalogue is on Shopify, whose CDN resizes on request.
 * Asking for a width appropriate to the slot is the difference between a soft
 * upscaled image and a sharp one, and it costs nothing.
 */
const SHOPIFY_CDN = /(^|\.)(shopify|shopifycdn)\.com$/i;

/**
 * A CDN URL sized for the slot it will occupy.
 * `width` is the CSS width of the largest rendering; the CDN is asked for 2x
 * so the image stays sharp on a retina screen.
 */
export function sized(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!SHOPIFY_CDN.test(u.hostname)) return url; // leave anything else alone
    u.searchParams.set("width", String(Math.min(Math.round(width * 2), 2400)));
    return u.toString();
  } catch {
    return url; // a malformed URL is the caller's problem, not a crash here
  }
}

/** Slot sizes used across the site, so the numbers live in one place. */
export const IMG = {
  hero: 900,
  panel: 700,
  card: 420,
  carousel: 360,
  thumb: 160,
} as const;
