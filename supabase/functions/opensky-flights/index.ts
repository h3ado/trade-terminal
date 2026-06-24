// Live aircraft positions. Primary: adsb.lol (free, fast, no key).
// Fallback: OpenSky anonymous (often rate-limited / slow).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithTimeout(url: string, ms: number, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function mapAdsbAircraft(a: any, lamin: number, lamax: number, lomin: number, lomax: number) {
  const lat = a.lat, lng = a.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (lat < lamin || lat > lamax || lng < lomin || lng > lomax) return null;
  const altFt = typeof a.alt_baro === "number" ? a.alt_baro
    : typeof a.alt_geom === "number" ? a.alt_geom : null;
  return {
    id: a.hex,
    callsign: (a.flight ?? "").trim() || a.r || a.hex,
    country: a.r ?? "",
    lat,
    lng,
    altFt,
    speedKts: typeof a.gs === "number" ? Math.round(a.gs) : null,
    trackDeg: typeof a.track === "number" ? a.track : (a.true_heading ?? a.mag_heading ?? 0),
    vertRateFpm: typeof a.baro_rate === "number" ? a.baro_rate : 0,
    onGround: a.alt_baro === "ground",
  };
}

async function fetchAdsbTile(cLat: number, cLon: number, radiusNm: number) {
  const url = `https://api.adsb.lol/v2/lat/${cLat.toFixed(3)}/lon/${cLon.toFixed(3)}/dist/${radiusNm}`;
  const r = await fetchWithTimeout(url, 8000, { "User-Agent": "lovable-globe/1.0" });
  if (!r.ok) throw new Error(`adsb.lol ${r.status}`);
  const json = await r.json();
  return (json.ac ?? []) as any[];
}

async function fromAdsbLol(lamin: number, lamax: number, lomin: number, lomax: number) {
  // adsb.lol caps radius at 250nm. Tile the bbox into overlapping circles.
  const TILE_R_NM = 240;
  const cosLat = Math.cos(((lamin + lamax) / 2) * Math.PI / 180);
  // Spacing ~ radius * sqrt(2) so circles overlap and cover the rectangle.
  const tileLatDeg = (TILE_R_NM * 1.4) / 60;
  const tileLonDeg = (TILE_R_NM * 1.4) / (60 * Math.max(0.2, cosLat));

  const latSteps = Math.max(1, Math.ceil((lamax - lamin) / tileLatDeg));
  const lonSteps = Math.max(1, Math.ceil((lomax - lomin) / tileLonDeg));
  const stepLat = (lamax - lamin) / latSteps;
  const stepLon = (lomax - lomin) / lonSteps;

  const centers: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i < latSteps; i++) {
    for (let j = 0; j < lonSteps; j++) {
      centers.push({
        lat: lamin + (i + 0.5) * stepLat,
        lon: lomin + (j + 0.5) * stepLon,
      });
    }
  }
  // Cap total tiles to keep latency reasonable.
  const tiles = centers.slice(0, 16);
  const results = await Promise.allSettled(
    tiles.map((c) => fetchAdsbTile(c.lat, c.lon, TILE_R_NM)),
  );
  const seen = new Set<string>();
  const out: any[] = [];
  let anyOk = false;
  for (const res of results) {
    if (res.status !== "fulfilled") continue;
    anyOk = true;
    for (const a of res.value) {
      if (!a.hex || seen.has(a.hex)) continue;
      const m = mapAdsbAircraft(a, lamin, lamax, lomin, lomax);
      if (m) {
        seen.add(a.hex);
        out.push(m);
      }
    }
  }
  if (!anyOk) throw new Error("all adsb.lol tiles failed");
  return out.slice(0, 2500);
}

async function fromOpenSky(lamin: number, lamax: number, lomin: number, lomax: number) {
  const feed = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
  const r = await fetchWithTimeout(feed, 8000, { "User-Agent": "lovable-globe/1.0" });
  if (!r.ok) throw new Error(`OpenSky ${r.status}`);
  const json = await r.json();
  const states: any[] = json.states ?? [];
  return states
    .map((s) => {
      const lng = s[5], lat = s[6];
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      const altM = s[13] ?? s[7];
      const velMs = s[9];
      return {
        id: s[0],
        callsign: (s[1] ?? "").trim() || s[0],
        country: s[2] ?? "",
        lat,
        lng,
        altFt: altM != null ? Math.round(altM * 3.28084) : null,
        speedKts: velMs != null ? Math.round(velMs * 1.94384) : null,
        trackDeg: s[10] ?? 0,
        vertRateFpm: s[11] != null ? Math.round(s[11] * 196.85) : 0,
        onGround: !!s[8],
      };
    })
    .filter(Boolean)
    .slice(0, 1500);
}

// Per-instance in-memory cache (each warm container holds its own).
type CacheEntry = { at: number; body: string };
const memCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 12_000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const lamin = parseFloat(url.searchParams.get("lamin") ?? "-90");
    const lamax = parseFloat(url.searchParams.get("lamax") ?? "90");
    const lomin = parseFloat(url.searchParams.get("lomin") ?? "-180");
    const lomax = parseFloat(url.searchParams.get("lomax") ?? "180");
    if ([lamin, lamax, lomin, lomax].some((n) => !isFinite(n))) {
      return new Response(JSON.stringify({ error: "bad bbox", flights: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Quantize to 1° grid for cache hits across micro-pans.
    const k = `${Math.round(lamin)},${Math.round(lamax)},${Math.round(lomin)},${Math.round(lomax)}`;
    const cached = memCache.get(k);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return new Response(cached.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=10",
          "X-Cache": "HIT",
        },
      });
    }

    let flights: any[] = [];
    let source = "adsb.lol";
    try {
      flights = await fromAdsbLol(lamin, lamax, lomin, lomax);
    } catch (e) {
      console.warn("adsb.lol failed, falling back to OpenSky:", String(e));
      source = "opensky";
      try {
        flights = await fromOpenSky(lamin, lamax, lomin, lomax);
      } catch (e2) {
        console.error("OpenSky also failed:", String(e2));
        return new Response(
          JSON.stringify({ flights: [], fallback: true, error: String(e2) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Round numeric fields to shrink JSON payload.
    const slim = flights.map((f: any) => ({
      id: f.id,
      callsign: f.callsign,
      country: f.country,
      lat: Math.round(f.lat * 1000) / 1000,
      lng: Math.round(f.lng * 1000) / 1000,
      altFt: f.altFt,
      speedKts: f.speedKts,
      trackDeg: Math.round(f.trackDeg),
      vertRateFpm: f.vertRateFpm,
      onGround: f.onGround,
    }));

    const body = JSON.stringify({ flights: slim, source, fetchedAt: Date.now() });
    memCache.set(k, { at: Date.now(), body });
    if (memCache.size > 64) {
      const firstKey = memCache.keys().next().value;
      if (firstKey) memCache.delete(firstKey);
    }

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10",
        "X-Cache": "MISS",
      },
    });
  } catch (e) {
    console.error("opensky-flights error", e);
    return new Response(
      JSON.stringify({ flights: [], fallback: true, error: String(e) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
