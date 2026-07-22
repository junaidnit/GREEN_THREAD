import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Read an env var, stripped of a leading UTF-8 BOM (U+FEFF) and surrounding
 * whitespace/quotes.
 *
 * Why this exists: pasting a secret into a dashboard field (Vercel) or a
 * .env file can carry an invisible BOM. Node exposes it verbatim in
 * process.env, and any code that puts the value in an HTTP header, which
 * the Anthropic and Supabase SDKs both do on every request, then throws
 * `Cannot convert argument to a ByteString … value 65279`. That took down
 * the concierge, Fabric Check and the extension endpoint in production.
 * Sanitising at read time makes the whole app immune regardless of how the
 * value was entered.
 */
export function cleanEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  let v = raw.replace(/^﻿/, "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v || undefined;
}

/** True when the key is present after sanitising. */
export function hasAnthropicKey(): boolean {
  return !!cleanEnv("ANTHROPIC_API_KEY");
}

/**
 * Shared Anthropic provider built from the sanitised key. Import this
 * instead of the package's default `anthropic`, whose implicit
 * `process.env.ANTHROPIC_API_KEY` read would reintroduce the BOM.
 */
export const anthropic = createAnthropic({ apiKey: cleanEnv("ANTHROPIC_API_KEY") });

/** Sanitised Supabase config, or null when not fully configured. */
export function supabaseConfig(): { url: string; key: string } | null {
  const url = cleanEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = cleanEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return url && key ? { url, key } : null;
}
