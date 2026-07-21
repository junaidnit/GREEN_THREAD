/**
 * SCOUT — the Catalog-Growth crew's first agent, pure decision logic.
 *
 * Given what a probe of a brand's public product feed found, decide whether
 * the brand meets The Fibre Set's honesty bar and is worth onboarding. The
 * verdict is deterministic and explained — a GO/NO-GO with named reasons,
 * so onboarding decisions are auditable, never vibes.
 *
 * The I/O (actually fetching the feed) lives in scripts/grow.ts; this module
 * is unit-tested against fixed stats.
 */

export interface ScoutStats {
  /** Feed reachable and parseable at all? */
  feedFound: boolean;
  /** Products scanned in the sample. */
  scanned: number;
  /** Of those, how many disclosed a full fibre composition. */
  disclosed: number;
  /** Of the disclosed items, how many are majority natural fibre. */
  majorityNatural: number;
  /** Of the disclosed items, how many are garments (not accessories/homeware). */
  garments: number;
}

export interface ScoutVerdict {
  go: boolean;
  score: number; // 0–100, for ranking candidate brands
  reasons: string[];
  stats: ScoutStats;
}

/** Minimum bar: a real catalogue that actually discloses what things are made of. */
export const SCOUT_THRESHOLDS = {
  minScanned: 30, // too few products = not a real catalogue
  minDisclosureRate: 0.2, // at least 1 in 5 items must disclose composition
  minNaturalRate: 0.5, // majority of disclosed items should be majority-natural
  minGarments: 10, // we're a clothing platform, not a sock/homeware shop
};

export function scoutVerdict(stats: ScoutStats): ScoutVerdict {
  const reasons: string[] = [];
  const t = SCOUT_THRESHOLDS;

  if (!stats.feedFound) {
    return {
      go: false,
      score: 0,
      reasons: ["No public product feed found (not Shopify, or feed blocked) — needs a custom integration."],
      stats,
    };
  }

  const disclosureRate = stats.scanned > 0 ? stats.disclosed / stats.scanned : 0;
  const naturalRate = stats.disclosed > 0 ? stats.majorityNatural / stats.disclosed : 0;

  let go = true;
  if (stats.scanned < t.minScanned) {
    go = false;
    reasons.push(`Catalogue too small: ${stats.scanned} products sampled (need ≥ ${t.minScanned}).`);
  }
  if (disclosureRate < t.minDisclosureRate) {
    go = false;
    reasons.push(
      `Labels don't disclose composition: ${Math.round(disclosureRate * 100)}% disclosure (need ≥ ${t.minDisclosureRate * 100}%). Fails the honesty bar.`,
    );
  }
  if (naturalRate < t.minNaturalRate) {
    go = false;
    reasons.push(
      `Mostly synthetic: only ${Math.round(naturalRate * 100)}% of disclosed items are majority-natural (need ≥ ${t.minNaturalRate * 100}%). Doesn't fit the natural-fibre thesis.`,
    );
  }
  if (stats.garments < t.minGarments) {
    go = false;
    reasons.push(`Too few garments: ${stats.garments} clothing items (need ≥ ${t.minGarments}) — feed is accessories/homeware-heavy.`);
  }

  if (go) {
    reasons.push(
      `${stats.disclosed} disclosed items (${Math.round(disclosureRate * 100)}% of sample), ${Math.round(naturalRate * 100)}% majority-natural, ${stats.garments} garments — clears every bar.`,
    );
  }

  // ranking score: disclosure quality and natural share, weighted; garments as tiebreak
  const score = Math.round(
    Math.min(1, disclosureRate / 0.6) * 40 +
      naturalRate * 40 +
      Math.min(1, stats.garments / 100) * 20,
  );

  return { go, score: go ? score : Math.min(score, 30), reasons, stats };
}
