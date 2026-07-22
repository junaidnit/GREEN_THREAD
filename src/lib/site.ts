/**
 * One place for the site's own identity. Used by metadata, the sitemap,
 * robots, JSON-LD and llms.txt, so a domain move is a one-line change
 * rather than a hunt (which is exactly what bit the extension after the
 * greenthread.info rename).
 */
export const SITE_URL = "https://thefibreset.com";

export const SITE_NAME = "The Fibre Set";

export const SITE_TAGLINE = "Natural fibres, chosen well";

export const SITE_DESCRIPTION =
  "We read the fibre composition on real clothing and publish what it actually is. " +
  "Independent, timestamped, and free to check on any shop.";

/** Kept in step with the truth ledger so claims on the page carry a date. */
export const LEDGER_SOURCE = "data/truth-ledger.json";
