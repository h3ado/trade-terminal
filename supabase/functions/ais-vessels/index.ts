// Live AIS vessel snapshot near major maritime chokepoints.
// Connects to AISStream.io's WebSocket, listens for ~12 seconds while collecting
// position reports in bounding boxes around each chokepoint, deduplicates by MMSI,
// then returns a snapshot. Cached in-memory for 60s so frontend polling is cheap.
//
// Vessel-type filter focuses on cargo (70-79) + tanker (80-89) ship types per AIS spec,
// which are the categories that actually matter for trade-flow / oil-flow visualization.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Half-width (deg) of each chokepoint bounding box. Picked to be wide enough to
// catch transiting vessels but narrow enough to avoid drowning the WS in traffic.
const BOX_HALF = {
  hormuz:    { lat: 1.6, lng: 1.6 },
  malacca:   { lat: 2.5, lng: 2.5 },
  suez:      { lat: 1.2, lng: 0.6 },
  babmandeb: { lat: 1.5, lng: 1.5 },
  panama:    { lat: 0.9, lng: 0.9 },
  bosporus:  { lat: 0.8, lng: 0.8 },
  gibraltar: { lat: 0.8, lng: 1.2 },
  goodhope:  { lat: 2.0, lng: 2.0 },
  dover:     { lat: 0.8, lng: 1.0 },
  sunda:     { lat: 1.5, lng: 1.5 },
  lombok:    { lat: 1.0, lng: 1.0 },
  taiwan:    { lat: 2.0, lng: 1.6 },
} as const;

// Lat/Lng of each chokepoint (kept in sync with src/components/globe/layers/shipping.ts).
const CHOKEPOINT_CENTERS: Record<keyof typeof BOX_HALF, [number, number]> = {
  hormuz:    [26.57, 56.25],
  malacca:   [2.50, 101.30],
  suez:      [30.50, 32.35],
  babmandeb: [12.58, 43.33],
  panama:    [9.08, -79.68],
  bosporus:  [41.10, 29.05],
  gibraltar: [35.95, -5.50],
  goodhope:  [-34.36, 18.47],
  dover:     [51.00, 1.50],
  sunda:     [-6.00, 105.80],
  lombok:    [-8.70, 115.75],
  taiwan:    [24.50, 119.50],
};

type Vessel = {
  mmsi: number;
  lat: number;
  lng: number;
  cog: number;        // course over ground (deg)
  sog: number;        // speed over ground (knots)
  shipType: number | null;
  category: 'tanker' | 'cargo' | 'other';
  name: string | null;
  chokepoint: keyof typeof BOX_HALF;
  ts: number;         // ms epoch when last seen
};

function categorize(shipType: number | null): Vessel['category'] {
  if (shipType == null) return 'other';
  if (shipType >= 80 && shipType <= 89) return 'tanker';
  if (shipType >= 70 && shipType <= 79) return 'cargo';
  return 'other';
}

function buildBoundingBoxes(): number[][][] {
  // AISStream expects [[[swLat, swLng], [neLat, neLng]], ...] per filter.
  return (Object.keys(BOX_HALF) as (keyof typeof BOX_HALF)[]).map((k) => {
    const [lat, lng] = CHOKEPOINT_CENTERS[k];
    const { lat: hLat, lng: hLng } = BOX_HALF[k];
    return [[lat - hLat, lng - hLng], [lat + hLat, lng + hLng]];
  });
}

function chokepointFor(lat: number, lng: number): keyof typeof BOX_HALF | null {
  for (const k of Object.keys(BOX_HALF) as (keyof typeof BOX_HALF)[]) {
    const [cLat, cLng] = CHOKEPOINT_CENTERS[k];
    const { lat: hLat, lng: hLng } = BOX_HALF[k];
    if (Math.abs(lat - cLat) <= hLat && Math.abs(lng - cLng) <= hLng) return k;
  }
  return null;
}

async function streamSnapshot(apiKey: string, durationMs = 20_000): Promise<Vessel[]> {
  return await new Promise((resolve, reject) => {
    const vessels = new Map<number, Vessel>();
    const shipTypeByMmsi = new Map<number, number>();
    const nameByMmsi = new Map<number, string>();
    let timeout: number | null = null;

    let ws: WebSocket;
    try {
      ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    } catch (e) {
      return reject(e);
    }

    let heartbeat: number | null = null;
    const finish = () => {
      if (timeout) { clearTimeout(timeout); timeout = null; }
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
      try { ws.close(); } catch { /* noop */ }
      const out: Vessel[] = [];
      for (const v of vessels.values()) {
        const st = v.shipType ?? shipTypeByMmsi.get(v.mmsi) ?? null;
        const cat = categorize(st);
        out.push({ ...v, shipType: st, category: cat, name: nameByMmsi.get(v.mmsi) ?? v.name });
      }
      console.log(`AIS snapshot: ${out.length} vessels (tanker=${out.filter(v=>v.category==='tanker').length} cargo=${out.filter(v=>v.category==='cargo').length} other=${out.filter(v=>v.category==='other').length})`);
      resolve(out);
    };

    ws.onopen = () => {
      const boxes = buildBoundingBoxes();
      const sub = {
        APIKey: apiKey,
        BoundingBoxes: boxes,
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      };
      ws.send(JSON.stringify(sub));
      console.log(`AIS WS open, subscribed to ${boxes.length} bboxes, window=${durationMs}ms`);
      timeout = setTimeout(finish, durationMs) as unknown as number;
    };

    ws.onclose = (ev) => {
      console.log(`AIS WS closed code=${ev.code} reason=${ev.reason || '(none)'}`);
      if (timeout) finish();
    };

    let msgCount = 0;
    let posCount = 0;
    let firstSampleLogged = false;
    const decoder = new TextDecoder();
    ws.onmessage = async (ev) => {
      try {
        msgCount++;
        let raw = '';
        if (typeof ev.data === 'string') {
          raw = ev.data;
        } else if (ev.data instanceof ArrayBuffer) {
          raw = decoder.decode(new Uint8Array(ev.data));
        } else if (ev.data && typeof (ev.data as Blob).arrayBuffer === 'function') {
          raw = decoder.decode(new Uint8Array(await (ev.data as Blob).arrayBuffer()));
        }
        if (!firstSampleLogged) {
          firstSampleLogged = true;
          console.log(`AIS first frame sample (type=${typeof ev.data}): ${raw.slice(0, 240)}`);
        }
        if (!raw) return;
        const msg = JSON.parse(raw);
        if (msg?.error || msg?.Error) {
          console.log(`AIS server error: ${JSON.stringify(msg).slice(0,240)}`);
        }
        const meta = msg.MetaData ?? msg.Metadata ?? {};
        const mmsi: number | undefined = meta.MMSI ?? meta.mmsi;
        if (!mmsi) return;

        if (msg.MessageType === 'ShipStaticData') {
          const sd = msg.Message?.ShipStaticData ?? {};
          if (typeof sd.Type === 'number') shipTypeByMmsi.set(mmsi, sd.Type);
          if (typeof sd.Name === 'string') nameByMmsi.set(mmsi, sd.Name.trim());
          return;
        }
        if (msg.MessageType === 'PositionReport') {
          const pr = msg.Message?.PositionReport ?? {};
          const lat = pr.Latitude;
          const lng = pr.Longitude;
          if (typeof lat !== 'number' || typeof lng !== 'number') return;
          posCount++;
          const ck = chokepointFor(lat, lng);
          if (!ck) return;
          vessels.set(mmsi, {
            mmsi,
            lat,
            lng,
            cog: typeof pr.Cog === 'number' ? pr.Cog : 0,
            sog: typeof pr.Sog === 'number' ? pr.Sog : 0,
            shipType: shipTypeByMmsi.get(mmsi) ?? null,
            category: 'other',
            name: nameByMmsi.get(mmsi) ?? null,
            chokepoint: ck,
            ts: Date.now(),
          });
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onerror = (e) => {
      if (timeout) clearTimeout(timeout);
      console.log(`AIS WS error: ${(e as any)?.message ?? 'unknown'}`);
      reject(new Error(`AISStream WS error: ${(e as any)?.message ?? 'unknown'}`));
    };

    // Periodic heartbeat to know whether we're getting data at all.
    heartbeat = setInterval(() => {
      console.log(`AIS heartbeat: msgs=${msgCount} positions=${posCount} kept=${vessels.size}`);
    }, 5_000) as unknown as number;

    // Hard ceiling so a stuck socket can't hang the function. Resolves with
    // whatever we have rather than rejecting — empty snapshots are valid.
    setTimeout(() => {
      if (timeout) finish();
    }, durationMs + 3_000);
  });
}

let cache: { ts: number; vessels: Vessel[] } | null = null;
const TTL_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(
        JSON.stringify({ vessels: cache.vessels, ts: cache.ts, source: 'aisstream', cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('AISSTREAM_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AISSTREAM_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const vessels = await streamSnapshot(apiKey);
    cache = { ts: Date.now(), vessels };
    return new Response(
      JSON.stringify({ vessels, ts: cache.ts, source: 'aisstream', cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
