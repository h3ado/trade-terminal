// Recent lightning strikes. Tries the public Saratoga-Weather Blitzortung
// 10-min JSON archive; falls back to a synthesized convection-plausible set
// keyed by current UTC hour so the layer never appears empty.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Public 10-min archive (free, no key). Each line is "ts lat lng".
const FEED = "https://www.lightningmaps.org/blitzortung/europe/index.php?bo_strike_data=1&north=85&south=-85&west=-180&east=180";

function syntheticStrikes(now: number) {
  // Convection bands centered on tropics + summer hemisphere.
  const out: { id: string; lat: number; lng: number; ageS: number }[] = [];
  const hour = new Date(now).getUTCHours();
  const seed = hour * 1000 + new Date(now).getUTCDate();
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const month = new Date(now).getUTCMonth();
  const summerN = month >= 4 && month <= 9;
  // 80 strikes total — enough to feel alive without clutter
  for (let i = 0; i < 80; i++) {
    const tropical = rnd() < 0.55;
    let lat: number;
    if (tropical) {
      lat = (rnd() - 0.5) * 30; // ±15
    } else {
      lat = summerN ? 25 + rnd() * 35 : -25 - rnd() * 35;
    }
    const lng = -180 + rnd() * 360;
    out.push({
      id: `syn-${i}-${hour}`,
      lat,
      lng,
      ageS: Math.floor(rnd() * 600),
    });
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const now = Date.now();
  try {
    const r = await fetch(FEED, {
      headers: { "User-Agent": "lovable-globe/1.0", "Accept": "*/*" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) throw new Error(`LM ${r.status}`);
    const txt = await r.text();
    // Lines: "<unix_ms> <lat> <lng>" — be tolerant.
    const strikes: { id: string; lat: number; lng: number; ageS: number }[] = [];
    for (const line of txt.split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;
      const ts = Number(parts[0]);
      const lat = Number(parts[1]);
      const lng = Number(parts[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const tsMs = ts > 1e12 ? ts : ts * 1000;
      const ageS = Math.max(0, Math.round((now - tsMs) / 1000));
      if (ageS > 1800) continue; // last 30 min
      strikes.push({ id: `${tsMs}-${lat.toFixed(2)}-${lng.toFixed(2)}`, lat, lng, ageS });
      if (strikes.length >= 800) break;
    }
    if (strikes.length === 0) throw new Error("empty feed");
    return new Response(JSON.stringify({ strikes, source: "blitzortung", fetchedAt: now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
    });
  } catch (_e) {
    const strikes = syntheticStrikes(now);
    return new Response(JSON.stringify({ strikes, source: "synthetic", fetchedAt: now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  }
});
