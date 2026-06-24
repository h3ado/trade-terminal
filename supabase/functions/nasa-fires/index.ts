// Live wildfire hotspots from NASA FIRMS (VIIRS, last 24h, global).
// FIRMS public CSV endpoint — no key required for "public" feed.
// Endpoint: https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const FEED = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const r = await fetch(FEED, { headers: { "User-Agent": "lovable-globe/1.0" } });
    if (!r.ok) throw new Error(`FIRMS ${r.status}`);
    const text = await r.text();
    const lines = text.split("\n");
    const header = lines[0].split(",");
    const idxLat = header.indexOf("latitude");
    const idxLng = header.indexOf("longitude");
    const idxFrp = header.indexOf("frp");
    const idxConf = header.indexOf("confidence");
    const idxDate = header.indexOf("acq_date");
    const idxTime = header.indexOf("acq_time");
    const idxDayN = header.indexOf("daynight");

    // Downsample: cap to 4000 points and require frp >= 5 (filters tiny noise).
    const out: any[] = [];
    for (let i = 1; i < lines.length && out.length < 4000; i++) {
      const c = lines[i].split(",");
      if (c.length < header.length) continue;
      const lat = parseFloat(c[idxLat]);
      const lng = parseFloat(c[idxLng]);
      const frp = parseFloat(c[idxFrp]);
      if (!isFinite(lat) || !isFinite(lng) || !isFinite(frp) || frp < 5) continue;
      out.push({
        id: `${c[idxDate]}-${c[idxTime]}-${i}`,
        lat, lng,
        intensity: Math.min(1, frp / 200),
        frp,
        confidence: c[idxConf],
        acqDate: c[idxDate],
        acqTime: c[idxTime],
        daynight: c[idxDayN],
        bin: "24h" as const,
      });
    }
    return new Response(JSON.stringify({ fires: out, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), fires: [] }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
