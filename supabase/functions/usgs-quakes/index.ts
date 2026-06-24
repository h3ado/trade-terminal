// Live USGS earthquake feed proxy. Returns last 24h, M2.5+ globally.
// Public USGS GeoJSON, no auth required. Cached 60s in CDN.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const r = await fetch(FEED, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (!r.ok) throw new Error(`USGS ${r.status}`);
    const json = await r.json();
    const now = Date.now();
    const quakes = (json.features ?? [])
      .map((f: any) => {
        const [lng, lat, depthKm] = f.geometry?.coordinates ?? [];
        const p = f.properties ?? {};
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        const ageH = (now - (p.time ?? now)) / 3_600_000;
        return {
          id: f.id,
          lat, lng,
          mag: Number(p.mag ?? 0),
          depthKm: Number(depthKm ?? 0),
          age: Math.max(0, ageH),
          region: p.place ?? "",
          url: p.url ?? "",
          tsunami: !!p.tsunami,
        };
      })
      .filter(Boolean);
    return new Response(JSON.stringify({ quakes, fetchedAt: now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), quakes: [] }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
