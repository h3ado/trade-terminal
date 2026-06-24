// NASA EONET v3 — Earth Observatory Natural Event Tracker.
// Open events: volcanoes, wildfires, severe storms, sea/lake ice, drought,
// dust/haze, earthquakes, floods, manmade, snow, temp extremes, water color.
// No key needed. Cached 30 min in-memory; on upstream 5xx we serve last-good.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const FEED = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=500";
const TTL_MS = 30 * 60_000;
let cache: { ts: number; payload: { events: any[]; fetchedAt: number } } | null = null;

async function fetchEonet() {
  const r = await fetch(FEED, { headers: { "User-Agent": "lovable-globe/1.0" } });
  if (!r.ok) throw new Error(`eonet ${r.status}`);
  const json = await r.json();
  const events = (json.events ?? [])
    .map((e: any) => {
      const last = e.geometry?.[e.geometry.length - 1];
      if (!last) return null;
      let lat: number, lng: number;
      if (last.type === "Point") {
        [lng, lat] = last.coordinates ?? [];
      } else {
        const first = (last.coordinates?.flat?.(2) ?? []).slice(0, 2);
        [lng, lat] = first;
      }
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      return {
        id: String(e.id),
        title: String(e.title ?? "Event"),
        category: e.categories?.[0]?.id ?? "unknown",
        categoryTitle: e.categories?.[0]?.title ?? "Unknown",
        date: last.date ?? null,
        source: e.sources?.[0]?.url ?? null,
        lat, lng,
      };
    })
    .filter(Boolean);
  return { events, fetchedAt: Date.now() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  // Serve fresh cache if available.
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return new Response(JSON.stringify(cache.payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" },
    });
  }
  try {
    const payload = await fetchEonet();
    cache = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=1800" },
    });
  } catch (e) {
    // Upstream 5xx (NASA EONET frequently 503s) — return last good cache or empty 200.
    if (cache) {
      return new Response(JSON.stringify(cache.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=120" },
      });
    }
    return new Response(JSON.stringify({ events: [], fetchedAt: Date.now(), warning: String(e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  }
});
