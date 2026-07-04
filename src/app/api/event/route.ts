import { createClient } from "@supabase/supabase-js";

/** Fire-and-forget behavioural events (search terms, out-clicks). */
export async function POST(req: Request) {
  try {
    const { type, payload } = await req.json();
    if (typeof type !== "string" || type.length > 40) {
      return new Response(null, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      await supabase.from("events").insert({ type, payload: payload ?? {} });
    } else {
      console.log(`[event] ${type}`, payload);
    }
  } catch { /* analytics must never break the app */ }
  return new Response(null, { status: 204 });
}
