/**
 * CATALOG-GROWTH CREW — Scout + onboarding, one command.
 *
 *   npm run grow -- <domain>                      scout only (read-only probe)
 *   npm run grow -- <domain> --add --name "X"     onboard: brands.json +
 *                                                 live-sources.json, ingest the
 *                                                 brand, merge, record truth
 *
 * The Scout probes the brand's public Shopify feed, samples up to 150
 * products, and issues an auditable GO/NO-GO against GreenThread's honesty
 * bar (real catalogue, composition disclosed, majority natural, garments).
 * Deterministic — no LLM calls, no API cost.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseComposition, mapCategory } from "../src/lib/live-ingest";
import { naturalPct } from "../src/lib/materials";
import { scoutVerdict, type ScoutStats } from "../src/lib/scout";
import { harvestAll } from "./ingest-live";
import type { SeedProduct } from "../src/lib/types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const args = process.argv.slice(2).filter((a) => a !== "--");
const domainArg = args.find((a) => !a.startsWith("--"));
const ADD = args.includes("--add");
const nameIdx = args.indexOf("--name");
const givenName = nameIdx > -1 ? args[nameIdx + 1] : undefined;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function probe(base: string) {
  interface FeedProduct { title: string; body_html?: string; product_type?: string }
  const stats: ScoutStats = { feedFound: false, scanned: 0, disclosed: 0, majorityNatural: 0, garments: 0 };
  for (let page = 1; page <= 3; page++) {
    let data: { products?: FeedProduct[] } | null = null;
    try {
      const res = await fetch(`${base}/products.json?limit=50&page=${page}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) break;
      data = (await res.json()) as { products?: FeedProduct[] };
    } catch {
      break;
    }
    if (!data?.products?.length) break;
    stats.feedFound = true;
    for (const p of data.products) {
      stats.scanned++;
      const comp = parseComposition(stripHtml(p.body_html ?? ""));
      if (!comp) continue;
      stats.disclosed++;
      if (naturalPct(comp) > 50) stats.majorityNatural++;
      const cat = mapCategory(p.product_type ?? "", p.title);
      if (cat !== "accessories") stats.garments++;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return stats;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  if (!domainArg) {
    console.error('usage: npm run grow -- <domain> [--add --name "Brand Name"]');
    process.exit(1);
  }
  const domain = domainArg.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // try bare and www variants; keep whichever serves the feed
  let base = "";
  let stats: ScoutStats = { feedFound: false, scanned: 0, disclosed: 0, majorityNatural: 0, garments: 0 };
  for (const candidate of [`https://${domain}`, `https://www.${domain}`]) {
    console.log(`▶ probing ${candidate}/products.json …`);
    const s = await probe(candidate);
    if (s.feedFound) { base = candidate; stats = s; break; }
  }

  const verdict = scoutVerdict(stats);
  console.log(`\n═══ SCOUT VERDICT: ${verdict.go ? "✓ GO" : "✗ NO-GO"} (score ${verdict.score}/100) ═══`);
  console.log(`  sampled ${stats.scanned} · disclosed ${stats.disclosed} · majority-natural ${stats.majorityNatural} · garments ${stats.garments}`);
  for (const r of verdict.reasons) console.log(`  · ${r}`);

  if (!verdict.go || !ADD) {
    if (verdict.go) console.log(`\nTo onboard: npm run grow -- ${domain} --add --name "Brand Name"`);
    process.exit(verdict.go ? 0 : 1);
  }

  // ── onboarding ──
  const name = givenName ?? domain.split(".")[0];
  const slug = slugify(name);
  console.log(`\n▶ onboarding "${name}" (${slug}) from ${base}`);

  const brandsPath = resolve(process.cwd(), "data/raw/brands.json");
  const brandsDoc = JSON.parse(readFileSync(brandsPath, "utf8"));
  if (!brandsDoc.brands.some((b: { slug: string }) => b.slug === slug)) {
    brandsDoc.brands.unshift({
      slug,
      name,
      website: base,
      ethics_summary: `Onboarded by the Scout agent from ${domain}'s own product feed — every listed item discloses its full fibre composition. Brand ethics profile pending manual review.`,
      certifications: [],
      // conservative default until reviewed: no unearned halo
      ethics_modifier: 3,
    });
    writeFileSync(brandsPath, JSON.stringify(brandsDoc, null, 2));
    console.log("  ✓ brands.json (ethics_modifier=3, pending review)");
  }

  const sourcesPath = resolve(process.cwd(), "data/raw/live-sources.json");
  const sourcesDoc = JSON.parse(readFileSync(sourcesPath, "utf8"));
  if (!sourcesDoc.sources.some((s: { brandSlug: string }) => s.brandSlug === slug)) {
    sourcesDoc.sources.push({ brandSlug: slug, name, base });
    writeFileSync(sourcesPath, JSON.stringify(sourcesDoc, null, 2));
    console.log("  ✓ live-sources.json");
  }

  // the probe just hit the same feed — cool down so we don't ingest into a rate-limit
  console.log(`\n▶ ingesting ${name} (10s politeness cool-down first) …`);
  await new Promise((r) => setTimeout(r, 10_000));
  const fresh = await harvestAll(slug);
  if (fresh.length === 0) {
    console.error(
      `✗ ingest returned 0 products despite a GO verdict — likely rate-limited. ` +
        `Wait a minute and re-run: npm run grow -- ${domain} --add --name "${name}"`,
    );
    process.exit(1);
  }

  const livePath = resolve(process.cwd(), "data/products_live.json");
  const liveDoc: { products: SeedProduct[] } = existsSync(livePath)
    ? JSON.parse(readFileSync(livePath, "utf8"))
    : { products: [] };
  const others = liveDoc.products.filter((p) => p.brand_slug !== slug);
  const merged = [...others, ...fresh];
  writeFileSync(livePath, JSON.stringify({ ingested_at: new Date().toISOString(), products: merged }, null, 1));
  console.log(`  ✓ ${fresh.length} products added (catalog live total: ${merged.length})`);

  // fold the new observations into the truth ledger
  const { execSync } = await import("node:child_process");
  execSync("npx tsx scripts/record-truth.ts", { stdio: "inherit" });

  console.log(`\n✓ "${name}" onboarded. Next steps:`);
  console.log("  · npm run audit:site        (gate must stay green)");
  console.log("  · npx tsx scripts/embed-catalog.ts   (twins for the new items)");
  console.log("  · npm run db:setup          (sync Supabase)");
  console.log("  · review the brand's ethics_summary/modifier in data/raw/brands.json");
}

main();
