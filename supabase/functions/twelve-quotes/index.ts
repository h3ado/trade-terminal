// Batched Twelve Data quote fetcher for company tickers.
// Accepts ?symbols=AAPL,MSFT,... — comma-separated. Returns price + change
// for each, plus a server timestamp. Cached 5 minutes at the edge to stay
// well under the 800 req/day free tier.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const KEY = Deno.env.get("TWELVE_DATA_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!KEY) throw new Error("TWELVE_DATA_API_KEY not configured");
    const url = new URL(req.url);
    const symbols = (url.searchParams.get("symbols") ?? "").trim();
    if (!symbols) throw new Error("symbols query param required");
    // Twelve Data's batch endpoint accepts comma-separated symbols.
    const api = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbols)}&apikey=${KEY}`;
    const r = await fetch(api);
    if (!r.ok) throw new Error(`twelve ${r.status}`);
    const raw = await r.json();
    // Single-symbol response is flat; multi-symbol is a map keyed by ticker.
    const list = symbols.split(",").map(s => s.trim()).filter(Boolean);
    const quotes: Record<string, { price: number; change: number; pct: number; mcapB?: number }> = {};
    for (const sym of list) {
      const q = list.length === 1 ? raw : raw[sym];
      if (!q || q.code) continue;
      const price = Number(q.close ?? q.price ?? 0);
      const change = Number(q.change ?? 0);
      const pct = Number(q.percent_change ?? 0);
      quotes[sym] = { price, change, pct };
    }
    return new Response(JSON.stringify({ quotes, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    // Return 200 with empty quotes so the client falls back gracefully
    // (e.g. Twelve Data 429 rate limit shouldn't blank the screen).
    return new Response(JSON.stringify({ error: String(e), quotes: {}, fallback: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
