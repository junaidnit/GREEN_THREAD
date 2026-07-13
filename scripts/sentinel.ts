/**
 * STOCK & PRICE SENTINEL — keeps the live catalog honest over time.
 *
 * Re-harvests every live brand feed and diffs against data/products_live.json:
 *   · price changed  → update + append to price_history (powers "price drop" badges)
 *   · item vanished  → drop it locally and delete it from Supabase (no dead Buy links)
 *   · new item       → added with a fresh price_history
 *
 * Run:  npm run sentinel        (harvest + diff + Supabase deletes, then reseed)
 *       npx tsx scripts/sentinel.ts   (harvest + diff only)
 *
 * Schedule it (Windows Task Scheduler / cron / CI) nightly to keep listings fresh.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { harvestAll } from "./ingest-live";
import type { SeedProduct } from "../src/lib/types";

config({ path: resolve(process.cwd(), ".env.local") });

const LIVE_PATH = resolve(process.cwd(), "data/products_live.json");
const HISTORY_CAP = 12;

async function deleteFromSupabase(ids: string[]) {
  const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
  const REF = process.env.SUPABASE_PROJECT_REF;
  if (!TOKEN || !REF || ids.length === 0) return;
  const list = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(",");
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: `delete from public.products where id in (${list});` }),
  });
  console.log(res.ok ? `   ✓ removed ${ids.length} vanished items from Supabase` : `   ✗ Supabase delete failed (${res.status})`);
}

async function main() {
  const prev: { ingested_at?: string; products: SeedProduct[] } = existsSync(LIVE_PATH)
    ? JSON.parse(readFileSync(LIVE_PATH, "utf8"))
    : { products: [] };
  const prevById = new Map(prev.products.map((p) => [p.id, p]));
  const prevDate = (prev.ingested_at ?? new Date().toISOString()).slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  console.log(`▶ sentinel pass — ${prev.products.length} live items on record`);
  const fresh = await harvestAll();

  let priceChanges = 0;
  let added = 0;
  const changes: string[] = [];

  for (const p of fresh) {
    const old = prevById.get(p.id);
    if (!old) {
      added++;
      p.price_history = [{ date: today, price: p.price }];
      continue;
    }
    const history = old.price_history?.length
      ? [...old.price_history]
      : [{ date: prevDate, price: old.price }];
    if (p.price !== old.price) {
      priceChanges++;
      history.push({ date: today, price: p.price });
      changes.push(`   ${p.price < old.price ? "↓" : "↑"} ${p.title}: £${old.price} → £${p.price}`);
    }
    p.price_history = history.slice(-HISTORY_CAP);
  }

  const freshIds = new Set(fresh.map((p) => p.id));
  const vanished = prev.products.filter((p) => !freshIds.has(p.id));

  writeFileSync(
    LIVE_PATH,
    JSON.stringify({ ingested_at: new Date().toISOString(), products: fresh }, null, 1),
  );

  console.log(`\n═══ SENTINEL REPORT ═══`);
  console.log(`  live items:     ${fresh.length} (was ${prev.products.length})`);
  console.log(`  new listings:   ${added}`);
  console.log(`  vanished:       ${vanished.length}${vanished.length ? ` (${vanished.slice(0, 5).map((p) => p.id).join(", ")}${vanished.length > 5 ? "…" : ""})` : ""}`);
  console.log(`  price changes:  ${priceChanges}`);
  for (const c of changes.slice(0, 10)) console.log(c);
  if (added > 0) console.log(`  ℹ ${added} new items have no visual twins yet — run: npx tsx scripts/embed-catalog.ts`);

  await deleteFromSupabase(vanished.map((p) => p.id));
  console.log(`✓ sentinel done — run "npm run db:setup" (or use "npm run sentinel") to sync Supabase prices`);
}

main();
