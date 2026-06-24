// OpenAQ v3 — latest PM2.5 measurements worldwide. Free, no key required.
// Returns ~1000 most-recent city-level PM2.5 readings.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const FEED = "https://api.openaq.org/v2/latest?parameter=pm25&limit=1000&order_by=lastUpdated&sort=desc";

function aqiCategory(pm25: number): { label: string; hue: number } {
  if (pm25 <= 12) return { label: "Good", hue: 140 };
  if (pm25 <= 35) return { label: "Moderate", hue: 55 };
  if (pm25 <= 55) return { label: "USG", hue: 28 };
  if (pm25 <= 150) return { label: "Unhealthy", hue: 0 };
  if (pm25 <= 250) return { label: "Very Unhealthy", hue: 290 };
  return { label: "Hazardous", hue: 320 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const r = await fetch(FEED, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (!r.ok) throw new Error(`OpenAQ ${r.status}`);
    const json = await r.json();
    const seen = new Set<string>();
    const stations = (json.results ?? [])
      .map((s: any) => {
        const c = s.coordinates;
        if (!c || typeof c.latitude !== "number" || typeof c.longitude !== "number") return null;
        const m = (s.measurements ?? []).find((mm: any) => mm.parameter === "pm25");
        if (!m || typeof m.value !== "number" || m.value < 0) return null;
        // Dedupe by 0.5° grid cell to avoid over-plotting same city.
        const cellKey = `${Math.round(c.latitude * 2)}_${Math.round(c.longitude * 2)}`;
        if (seen.has(cellKey)) return null;
        seen.add(cellKey);
        const cat = aqiCategory(m.value);
        return {
          id: `${s.location ?? "?"}-${cellKey}`,
          name: s.location ?? "Station",
          city: s.city ?? "",
          country: s.country ?? "",
          lat: c.latitude,
          lng: c.longitude,
          pm25: Number(m.value.toFixed(1)),
          unit: m.unit ?? "µg/m³",
          updatedAt: m.lastUpdated ?? null,
          category: cat.label,
          hue: cat.hue,
        };
      })
      .filter(Boolean);
    return new Response(JSON.stringify({ stations, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), stations: [] }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
