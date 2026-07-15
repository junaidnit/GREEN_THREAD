import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/env";

/** Fire-and-forget behavioural events (search terms, out-clicks). */
export async function POST(req: Request) {
  try {
    const { type, payload } = await req.json();
    if (typeof type !== "string" || type.length > 40) {
      return new Response(null, { status: 400 });
    }
    const cfg = supabaseConfig();
    if (cfg) {
      const supabase = createClient(cfg.url, cfg.key);
      await supabase.from("events").insert({ type, payload: payload ?? {} });
    } else {
      console.log(`[event] ${type}`, payload);
    }
  } catch { /* analytics must never break the app */ }
  return new Response(null, { status: 204 });
}
