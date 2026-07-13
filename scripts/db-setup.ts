/**
 * Creates the schema and seeds the enriched catalog into Supabase using the
 * Management API — needs only SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF
 * in .env.local (no psql, no Docker, no db password).
 *
 * Run:  npx tsx scripts/db-setup.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { SeedProduct } from "../src/lib/types";

config({ path: resolve(process.cwd(), ".env.local") });

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;

async function runSql(query: string, attempt = 1): Promise<unknown> {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      throw new Error(`SQL failed (${res.status}): ${await res.text()}`);
    }
    return await res.json();
  } catch (e) {
    if (attempt >= 4) throw e;
    await new Promise((r) => setTimeout(r, attempt * 1500)); // transient network blips
    return runSql(query, attempt + 1);
  }
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const qj = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
const qa = (arr: string[]) => `array[${arr.map(q).join(",") || "''"}]::text[]`.replace("array['']::text[]", "'{}'::text[]");

async function main() {
  if (!TOKEN || !REF) {
    console.error("✗ SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF must be set in .env.local");
    process.exit(1);
  }

  console.log("1/3 Applying schema…");
  await runSql(readFileSync(resolve(process.cwd(), "supabase/migration.sql"), "utf8"));

  const brands = JSON.parse(readFileSync(resolve(process.cwd(), "data/raw/brands.json"), "utf8")).brands;
  const seedProducts: SeedProduct[] = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/products_seed.json"), "utf8"),
  ).products;
  const generatedPath = resolve(process.cwd(), "data/products_generated.json");
  const generated: SeedProduct[] = existsSync(generatedPath)
    ? JSON.parse(readFileSync(generatedPath, "utf8")).products
    : [];
  const livePath = resolve(process.cwd(), "data/products_live.json");
  const live: SeedProduct[] = existsSync(livePath)
    ? JSON.parse(readFileSync(livePath, "utf8")).products
    : [];
  const products = [...live, ...seedProducts, ...generated];

  console.log(`2/3 Seeding ${brands.length} brands…`);
  const brandRows = brands
    .map(
      (b: { slug: string; name: string; website: string; ethics_summary: string; certifications: string[]; ethics_modifier: number }) =>
        `(${q(b.slug)}, ${q(b.name)}, ${q(b.website)}, ${q(b.ethics_summary)}, ${qa(b.certifications)}, ${b.ethics_modifier})`,
    )
    .join(",\n");
  await runSql(
    `insert into public.brands (slug, name, website, ethics_summary, certifications, ethics_modifier)
     values ${brandRows}
     on conflict (slug) do update set
       name = excluded.name, website = excluded.website,
       ethics_summary = excluded.ethics_summary,
       certifications = excluded.certifications,
       ethics_modifier = excluded.ethics_modifier;`,
  );

  console.log(`3/3 Seeding ${products.length} products…`);
  // chunk inserts to keep each statement modest
  for (let i = 0; i < products.length; i += 50) {
    const chunk = products.slice(i, i + 50);
    const rows = chunk
      .map(
        (p) =>
          `(${q(p.id)}, ${q(p.brand_slug)}, ${q(p.title)}, ${q(p.description)}, ${q(p.category)}, ${q(p.gender)}, ` +
          `${p.price}, ${q(p.currency)}, ${q(p.retailer)}, ${q(p.buy_url)}, ${q(p.image_url)}, ${q(p.color)}, ` +
          `${q(p.color_family)}, ${qa(p.sizes)}, ${q(p.fit)}, ${q(p.source ?? "generated")}, ${qj(p.price_history ?? [])}, ${qj(p.fabric_composition)}, ${qj(p.sustainability)})`,
      )
      .join(",\n");
    await runSql(
      `insert into public.products (id, brand_slug, title, description, category, gender, price, currency, retailer, buy_url, image_url, color, color_family, sizes, fit, source, price_history, fabric_composition, sustainability)
       values ${rows}
       on conflict (id) do update set
         brand_slug = excluded.brand_slug, title = excluded.title,
         description = excluded.description, category = excluded.category,
         gender = excluded.gender, price = excluded.price,
         currency = excluded.currency, retailer = excluded.retailer,
         buy_url = excluded.buy_url, image_url = excluded.image_url,
         color = excluded.color, color_family = excluded.color_family,
         sizes = excluded.sizes, fit = excluded.fit, source = excluded.source,
         price_history = excluded.price_history,
         fabric_composition = excluded.fabric_composition,
         sustainability = excluded.sustainability;`,
    );
    console.log(`   …${Math.min(i + 50, products.length)}/${products.length}`);
  }

  const count = (await runSql("select count(*)::int as n from public.products;")) as Array<{ n: number }>;
  console.log(`✓ Done. products table now has ${count[0]?.n} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
