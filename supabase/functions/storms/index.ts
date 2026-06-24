// Live tropical storm snapshot. Pulls active named storms from NOAA NHC
// (Atlantic + East Pacific) via CurrentStorms.json. Returns a normalized list
// with current position, intensity, motion and forecast track points so the
// frontend can render tracks + cones on the globe. Cached 10 min in-memory.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ForecastPoint = { lat: number; lng: number; tau: number; wind?: number };

type Storm = {
  id: string;             // e.g. "AL052024"
  name: string;           // e.g. "MILTON"
  basin: 'AL' | 'EP' | 'CP' | 'WP' | 'IO' | 'SH';
  classification: string; // TD/TS/HU/MH/PT
  category: number;       // -1 = TD, 0 = TS, 1-5 = Saffir-Simpson
  lat: number;
  lng: number;
  windKt: number;
  pressureMb: number | null;
  movementDeg: number | null;
  movementKt: number | null;
  forecast: ForecastPoint[];
  updated: string;        // ISO
};

let memo: { ts: number; storms: Storm[] } | null = null;
const TTL = 10 * 60_000;

function classifyCat(windKt: number, classification: string): number {
  const c = (classification || '').toUpperCase();
  if (c === 'TD' || c === 'STD' || c === 'PTC' || c === 'DB') return -1;
  if (c === 'TS' || c === 'STS' || c === 'PT' || c === 'PC') return 0;
  // Saffir-Simpson
  if (windKt >= 137) return 5;
  if (windKt >= 113) return 4;
  if (windKt >= 96)  return 3;
  if (windKt >= 83)  return 2;
  if (windKt >= 64)  return 1;
  if (windKt >= 34)  return 0;
  return -1;
}

function normalizeBasin(id: string): Storm['basin'] {
  const p = id.slice(0, 2).toUpperCase();
  if (p === 'AL') return 'AL';
  if (p === 'EP') return 'EP';
  if (p === 'CP') return 'CP';
  if (p === 'WP') return 'WP';
  if (p === 'IO') return 'IO';
  return 'SH';
}

// Convert NHC lat/lng strings like "27.4N", "82.1W" → signed numbers.
function parseCoord(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*([NSEW])?$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const dir = m[2]?.toUpperCase();
  if (dir === 'S' || dir === 'W') n = -n;
  return n;
}

async function fetchNHC(): Promise<Storm[]> {
  // The CurrentStorms.json index lists active systems with embedded URLs to the
  // forecast advisory JSON.
  const idx = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', {
    headers: { 'user-agent': 'Mozilla/5.0 lovable-globe' },
  });
  if (!idx.ok) throw new Error(`NHC index ${idx.status}`);
  const idxJson = await idx.json();
  const actives: any[] = idxJson?.activeStorms ?? [];
  const out: Storm[] = [];

  await Promise.all(actives.map(async (s) => {
    try {
      const id = String(s.id ?? s.binNumber ?? '').toUpperCase();
      const name = String(s.name ?? 'UNNAMED').toUpperCase();
      const lat = parseCoord(s.latitudeNumeric ?? s.latitude);
      const lng = parseCoord(s.longitudeNumeric ?? s.longitude);
      if (lat == null || lng == null) return;

      const windKt = Number(s.intensity ?? 0);
      const classification = String(s.classification ?? '');
      const pressureMb = s.pressure != null ? Number(s.pressure) : null;
      const movementDeg = s.movementDir != null ? Number(s.movementDir) : null;
      const movementKt = s.movementSpeed != null ? Number(s.movementSpeed) : null;

      // Try to grab forecast track from the advisory JSON if linked.
      const forecast: ForecastPoint[] = [];
      const fcstUrl: string | undefined = s.forecastTrack?.kmzFile
        ? undefined  // kmz; skip
        : s.forecastTrack?.zoneFile
          ? undefined
          : s.trackCone?.geometry
            ? undefined
            : undefined;
      // NHC also exposes an advisory JSON; if `forecastAdvisory` URL is present, fetch it.
      const advUrl: string | undefined = s.forecastAdvisory?.url ?? s.publicAdvisory?.url;
      if (advUrl && advUrl.endsWith('.json')) {
        try {
          const ar = await fetch(advUrl);
          if (ar.ok) {
            const aj = await ar.json();
            const pts: any[] = aj?.forecast ?? aj?.points ?? [];
            for (const p of pts) {
              const plat = parseCoord(p.lat ?? p.latitude);
              const plng = parseCoord(p.lng ?? p.longitude);
              const tau = Number(p.tau ?? p.fcstHour ?? 0);
              if (plat != null && plng != null) {
                forecast.push({ lat: plat, lng: plng, tau, wind: p.wind ? Number(p.wind) : undefined });
              }
            }
          }
        } catch { /* ignore — current pos still usable */ }
      }

      out.push({
        id,
        name,
        basin: normalizeBasin(id),
        classification,
        category: classifyCat(windKt, classification),
        lat,
        lng,
        windKt,
        pressureMb,
        movementDeg,
        movementKt,
        forecast,
        updated: String(s.lastUpdate ?? new Date().toISOString()),
      });
    } catch {
      /* skip malformed entry */
    }
  }));

  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Serve from memo if fresh.
  if (memo && Date.now() - memo.ts < TTL) {
    return new Response(
      JSON.stringify({ storms: memo.storms, ts: memo.ts, cached: true }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  }

  try {
    const storms = await fetchNHC();
    memo = { ts: Date.now(), storms };
    return new Response(
      JSON.stringify({ storms, ts: memo.ts, cached: false }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (e) {
    // Fall back to last good memo if we have one.
    if (memo) {
      return new Response(
        JSON.stringify({ storms: memo.storms, ts: memo.ts, cached: true, stale: true, error: String((e as Error).message) }),
        { headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({ storms: [], error: String((e as Error).message) }),
      { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  }
});
