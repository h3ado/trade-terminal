// GDELT 2.0 DOC API — last 24h global news matching broad geopolitical
// keywords. Server-aggregated by `sourcecountry` so the client only ships a
// handful of country buckets. Approximate centroids per country power the
// 5° heat cells. No key required. Cached 15 min at the edge.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Broad query covering protest / conflict / sanctions / war / strike / coup.
const QUERY = '(protest OR sanction OR conflict OR strike OR war OR coup OR attack)';
// maxrecords>250 sometimes 404s; 75 is the documented sweet spot.
const FEED = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(QUERY)}&mode=ArtList&format=JSON&maxrecords=75&timespan=1d&sort=DateDesc`;

// Coarse centroid per source country code GDELT returns (varies in case).
const CENTROID: Record<string, [number, number]> = {
  "United States": [-98, 39], "China": [105, 35], "Russia": [50, 60],
  "Ukraine": [31, 49], "United Kingdom": [-2, 54], "Germany": [10, 51],
  "France": [2.5, 47], "India": [78, 22], "Japan": [138, 36], "Korea, South": [128, 36],
  "Iran": [53, 32], "Israel": [35, 31], "Saudi Arabia": [45, 24], "Turkey": [35, 39],
  "Pakistan": [70, 30], "Brazil": [-52, -10], "Mexico": [-102, 23], "Canada": [-95, 56],
  "Australia": [134, -25], "Indonesia": [113, -2], "South Africa": [25, -29],
  "Egypt": [30, 27], "Nigeria": [8, 10], "Kenya": [38, 0], "Ethiopia": [40, 9],
  "Argentina": [-64, -38], "Chile": [-71, -30], "Colombia": [-74, 4], "Peru": [-75, -10],
  "Venezuela": [-66, 7], "Vietnam": [108, 16], "Thailand": [101, 15], "Philippines": [122, 13],
  "Malaysia": [110, 4], "Singapore": [103.8, 1.3], "Bangladesh": [90, 24], "Myanmar": [96, 22],
  "Afghanistan": [67, 33], "Iraq": [44, 33], "Syria": [38, 35], "Yemen": [48, 15],
  "Lebanon": [36, 34], "Jordan": [36, 31], "Cuba": [-77, 22], "Belarus": [28, 53],
  "Spain": [-3, 40], "Italy": [12, 42], "Poland": [20, 52], "Netherlands": [5, 52],
  "Sweden": [15, 62], "Norway": [10, 61], "Finland": [25, 64], "Greece": [22, 39],
  "Portugal": [-8, 39.5], "Belgium": [4.4, 50.8], "Switzerland": [8, 47], "Austria": [14, 47.5],
  "Czech Republic": [15, 49.8], "Hungary": [19, 47], "Romania": [25, 46], "Bulgaria": [25, 43],
  "Ireland": [-8, 53], "Denmark": [10, 56], "New Zealand": [174, -41], "Taiwan": [121, 24],
  "Hong Kong": [114.2, 22.3],
};

type Cell = { lat: number; lng: number; count: number; sample: string[]; country: string };

// In-memory cache so we don't hammer GDELT (they 429 if you call more than
// once every 5s). Hold for 15 min to match the cache header.
const TTL_MS = 15 * 60_000;
let cache: { ts: number; payload: unknown } | null = null;
let inflight: Promise<unknown> | null = null;

async function fetchSnapshot() {
  const r = await fetch(FEED, { headers: { "User-Agent": "Mozilla/5.0 lovable-globe/1.0" } });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`gdelt ${r.status} ${body.slice(0, 80)}`);
  }
  const json = await r.json();
  const grid = new Map<string, Cell>();
  for (const a of json.articles ?? []) {
    const country = String(a.sourcecountry ?? "").trim();
    if (!country || country === "Unknown") continue;
    const c = CENTROID[country];
    if (!c) continue;
    const [lng, lat] = c;
    const cellLng = Math.round(lng / 5) * 5;
    const cellLat = Math.round(lat / 5) * 5;
    const key = `${cellLng}|${cellLat}`;
    let cell = grid.get(key);
    if (!cell) { cell = { lat: cellLat, lng: cellLng, count: 0, sample: [], country }; grid.set(key, cell); }
    cell.count += 1;
    const title = String(a.title ?? "").trim();
    if (title && cell.sample.length < 3) cell.sample.push(title.slice(0, 80));
  }
  const cells = [...grid.values()].map(c => ({
    lat: c.lat, lng: c.lng, count: c.count, avgTone: 0, sample: c.sample, country: c.country,
  }));
  return { cells, fetchedAt: Date.now() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify(cache.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" },
      });
    }
    if (!inflight) {
      inflight = fetchSnapshot()
        .then(p => { cache = { ts: Date.now(), payload: p }; return p; })
        .finally(() => { inflight = null; });
    }
    const payload = await inflight;
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" },
    });
  } catch (e) {
    // Serve stale cache on transient errors (e.g., 429) so the UI doesn't blank out.
    if (cache) {
      return new Response(JSON.stringify(cache.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      });
    }
    // Always 200 with empty cells + fallback flag — never 502 (would blank UI).
    return new Response(JSON.stringify({ cells: [], fetchedAt: Date.now(), fallback: true, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  }
});
