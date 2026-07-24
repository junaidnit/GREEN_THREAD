/**
 * PLACEHOLDER customer reviews for the preview build.
 *
 * The site is a demo and isn't trading yet; these are illustrative, sample
 * reviews so the product page reads like a real storefront. They are
 * DETERMINISTIC per product (seeded from the id) so the same product always
 * shows the same set, and every review carries a `sample: true` flag. Swap
 * this module for real, verified reviews before launch — the UI reads from
 * `demoReviews()` and nothing else needs to change.
 */

export interface DemoReview {
  name: string;
  initials: string;
  rating: number; // 1–5
  date: string; // human-relative, e.g. "2 weeks ago"
  title: string;
  body: string;
  verified: boolean;
  sample: true;
}

export interface ReviewSummary {
  reviews: DemoReview[];
  count: number;
  average: number; // one decimal
  distribution: [number, number, number, number, number]; // counts for 1..5 stars
}

const NAMES = [
  "Sarah M.", "Emma T.", "Priya K.", "Hannah L.", "Olivia R.",
  "Charlotte B.", "Grace W.", "Amelia S.", "Sophie D.", "Isla F.",
  "Freya H.", "Chloe N.", "Megan P.", "Lauren C.", "Ruby A.",
  "Daniel K.", "James P.", "Thomas R.", "Ella V.", "Niamh O.",
];

const TITLES = [
  "Beautiful quality", "Exactly as described", "So soft to wear",
  "My new favourite", "Worth every penny", "Lovely fabric",
  "Perfect fit", "Better than expected", "Will buy again",
  "Gorgeous and breathable", "Great for sensitive skin",
  "Washes beautifully", "A timeless piece", "Feels wonderful on",
  "Genuinely well made",
];

const BODIES = [
  "The fabric feels lovely against the skin and it's held up perfectly after several washes. True to size.",
  "Exactly what I hoped for — breathable, soft, and no scratchiness at all. I've already ordered another colour.",
  "So glad I found a natural-fibre option that actually feels premium. The drape is beautiful.",
  "Really comfortable for all-day wear, and it softened even more after the first wash.",
  "Gorgeous quality for the price. Fits true to size and the colour is exactly as pictured.",
  "My skin reacts to synthetics, so this has been a relief to wear — no irritation at all.",
  "Lightweight and cool, perfect for warmer days. Creases far less than I expected.",
  "Lovely weight to it, feels well made and the stitching is neat. Very happy.",
  "Bought this after checking the composition here and it's exactly right. Soft and breathable.",
  "A little longer than I expected but a great fit overall — the fabric is the star.",
  "Beautiful piece. I'd size up if you like it relaxed, but it feels wonderful on.",
  "Honestly the nicest natural-fibre basic I own now. Washes and wears brilliantly.",
  "Comfortable, breathable and looks smart. Exactly what I wanted.",
  "The colour is even nicer in person. Soft, breathable and true to size.",
  "Great everyday piece — gentle on the skin and it keeps its shape.",
];

const DATES = [
  "4 days ago", "1 week ago", "2 weeks ago", "3 weeks ago", "1 month ago",
  "6 weeks ago", "2 months ago", "3 months ago", "4 months ago", "5 months ago",
];

// mostly 5s and 4s, the occasional 3 — the shape of a genuinely liked product
const RATING_CYCLE = [5, 5, 4, 5, 5, 4, 5, 3, 5, 4, 5, 5, 4, 5, 5];

/** Deterministic 32-bit hash of a string → seed. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — deterministic, seeded. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * A stable set of ~15 sample reviews for a product, seeded from its id so the
 * page never reshuffles between renders.
 */
export function demoReviews(productId: string, count = 15): ReviewSummary {
  const rand = rng(hash(productId));
  const pick = <T>(arr: T[], offset: number) => arr[Math.floor(rand() * arr.length + offset) % arr.length];

  const reviews: DemoReview[] = Array.from({ length: count }, (_, i) => {
    const name = NAMES[(Math.floor(rand() * NAMES.length) + i) % NAMES.length];
    const rating = RATING_CYCLE[i % RATING_CYCLE.length];
    return {
      name,
      initials: initialsOf(name),
      rating,
      date: pick(DATES, i),
      title: pick(TITLES, i),
      body: pick(BODIES, i),
      verified: rand() > 0.25,
      sample: true as const,
    };
  });

  const distribution: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of reviews) distribution[r.rating - 1]++;
  const average = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  return { reviews, count, average, distribution };
}
