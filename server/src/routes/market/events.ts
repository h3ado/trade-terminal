import { Router } from 'express';

const router = Router();

// Generic in-memory cache helper
function makeCache<T>(ttlMs: number) {
  let cache: { ts: number; data: T } | null = null;
  return {
    get: () => (cache && Date.now() - cache.ts < ttlMs ? cache.data : null),
    set: (data: T) => { cache = { ts: Date.now(), data }; return data; },
  };
}

// ─── ACLED events ────────────────────────────────────────────────────────────
const acledCache = makeCache<unknown>(30 * 60_000);

// ACLED uses email + access key (not OAuth) — key stored in ACLED_PASSWORD
function acledParams(email: string, key: string): string {
  return `email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}`;
}

function severityFromFatalities(f: number, eventType: string): 1 | 2 | 3 | 4 | 5 {
  let s: 1 | 2 | 3 | 4 | 5 = f >= 30 ? 5 : f >= 10 ? 4 : f >= 3 ? 3 : f >= 1 ? 2 : 1;
  const t = eventType.toLowerCase();
  if (s < 5 && (t.includes('battle') || t.includes('explosion') || t.includes('remote violence'))) s = (s + 1) as 1 | 2 | 3 | 4 | 5;
  return s;
}

router.get('/acled-events', async (_req, res) => {
  const cached = acledCache.get();
  if (cached) { res.json(cached); return; }
  const email = process.env.ACLED_EMAIL, key = process.env.ACLED_PASSWORD;
  if (!email || !key) { res.json({ events: [], fetchedAt: Date.now() }); return; }
  try {
    const since = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://api.acleddata.com/acled/read?${acledParams(email, key)}&event_date=${since}&event_date_where=BETWEEN&event_date2=${today}&limit=500&fields=event_id_cnty|event_date|event_type|location|country|latitude|longitude|fatalities|notes|source_url`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`ACLED ${r.status}`);
    const j = await r.json() as any;
    const events = (j.data ?? []).map((e: any) => ({
      id: String(e.event_id_cnty), source: 'acled', category: 'conflict',
      subType: e.event_type, severity: severityFromFatalities(Number(e.fatalities ?? 0), e.event_type ?? ''),
      title: e.notes?.slice(0, 120) ?? e.event_type, location: e.location, country: e.country,
      lat: parseFloat(e.latitude), lng: parseFloat(e.longitude), ts: new Date(e.event_date).getTime(),
      fatalities: Number(e.fatalities ?? 0), url: e.source_url,
    }));
    const data = { events, fetchedAt: Date.now() };
    acledCache.set(data);
    res.json(data);
  } catch (e) { res.json({ events: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── AIS vessels ─────────────────────────────────────────────────────────────
const aisCache = makeCache<unknown>(5 * 60_000);

router.get('/ais-vessels', async (_req, res) => {
  const cached = aisCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const url = 'https://opensky-network.org/api/states/all?lamin=-90&lomin=-180&lamax=90&lomax=180';
    const r = await fetch(url, { headers: { 'User-Agent': 'trade-terminal/1.0' } });
    if (!r.ok) throw new Error(`AIS ${r.status}`);
    const j = await r.json() as any;
    const vessels = (j.states ?? []).slice(0, 200).map((s: any) => ({
      icao24: s[0], callsign: s[1]?.trim(), country: s[2], lat: s[6], lng: s[5],
      altitude: s[7], velocity: s[9], heading: s[10], onGround: s[8],
    })).filter((v: any) => v.lat && v.lng);
    const data = { vessels, fetchedAt: Date.now() };
    aisCache.set(data);
    res.json(data);
  } catch (e) { res.json({ vessels: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Lightning strikes ───────────────────────────────────────────────────────
const lightningCache = makeCache<unknown>(10 * 60_000);

router.get('/lightning-strikes', async (_req, res) => {
  const cached = lightningCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://feeds.datarade.com/api/lightningcast/us/?format=json&maxage=60&limit=200', { headers: { 'User-Agent': 'trade-terminal/1.0' } });
    const data = r.ok ? await r.json() : { strikes: [], fetchedAt: Date.now() };
    lightningCache.set(data);
    res.json(data);
  } catch (e) { res.json({ strikes: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Storms ──────────────────────────────────────────────────────────────────
const stormsCache = makeCache<unknown>(30 * 60_000);

router.get('/storms', async (_req, res) => {
  const cached = stormsCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { headers: { 'User-Agent': 'trade-terminal/1.0' } });
    if (!r.ok) throw new Error(`NHC ${r.status}`);
    const j = await r.json() as any;
    const data = { storms: j.activeStorms ?? [], fetchedAt: Date.now() };
    stormsCache.set(data);
    res.json(data);
  } catch (e) { res.json({ storms: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── USGS earthquakes ────────────────────────────────────────────────────────
const quakesCache = makeCache<unknown>(15 * 60_000);

router.get('/usgs-quakes', async (_req, res) => {
  const cached = quakesCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson');
    if (!r.ok) throw new Error(`USGS ${r.status}`);
    const j = await r.json() as any;
    const quakes = (j.features ?? []).map((f: any) => ({ id: f.id, mag: f.properties.mag, place: f.properties.place, time: f.properties.time, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], depth: f.geometry.coordinates[2], url: f.properties.url }));
    const data = { quakes, fetchedAt: Date.now() };
    quakesCache.set(data);
    res.json(data);
  } catch (e) { res.json({ quakes: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── NASA EONET events ───────────────────────────────────────────────────────
const eonetCache = makeCache<unknown>(60 * 60_000);

router.get('/nasa-eonet', async (_req, res) => {
  const cached = eonetCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30');
    if (!r.ok) throw new Error(`EONET ${r.status}`);
    const j = await r.json() as any;
    const data = { events: j.events ?? [], fetchedAt: Date.now() };
    eonetCache.set(data);
    res.json(data);
  } catch (e) { res.json({ events: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── NASA fires ──────────────────────────────────────────────────────────────
const firesCache = makeCache<unknown>(60 * 60_000);

router.get('/nasa-fires', async (_req, res) => {
  const cached = firesCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const key = process.env.NASA_FIRMS_KEY ?? 'DEMO_KEY';
    const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/world/csv/${key}/VIIRS_SNPP_NRT/1`);
    if (!r.ok) throw new Error(`FIRMS ${r.status}`);
    const text = await r.text();
    const lines = text.split('\n').slice(1, 201);
    const fires = lines.filter(Boolean).map(line => { const [lat, lng, bright, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight] = line.split(','); return { lat: parseFloat(lat), lng: parseFloat(lng), brightness: parseFloat(bright), confidence: parseFloat(confidence), frp: parseFloat(frp), daynight, date: acq_date }; }).filter(f => !isNaN(f.lat));
    const data = { fires, fetchedAt: Date.now() };
    firesCache.set(data);
    res.json(data);
  } catch (e) { res.json({ fires: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Subsea cables ───────────────────────────────────────────────────────────
const cablesCache = makeCache<unknown>(24 * 3600_000);

router.get('/subsea-cables', async (_req, res) => {
  const cached = cablesCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://raw.githubusercontent.com/telegeography/www.submarinecablemap.com/master/web/public/api/v3/cable/cable-geo.json');
    if (!r.ok) throw new Error(`cables ${r.status}`);
    const j = await r.json() as any;
    const data = { cables: j.features ?? [], fetchedAt: Date.now() };
    cablesCache.set(data);
    res.json(data);
  } catch (e) { res.json({ cables: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── OpenAQ air quality ──────────────────────────────────────────────────────
const airCache = makeCache<unknown>(30 * 60_000);

router.get('/openaq-air', async (_req, res) => {
  const cached = airCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://api.openaq.org/v3/locations?limit=100&order_by=lastUpdated&sort=desc', { headers: { 'X-API-Key': process.env.OPENAQ_API_KEY ?? '' } });
    if (!r.ok) throw new Error(`OpenAQ ${r.status}`);
    const j = await r.json() as any;
    const data = { locations: j.results ?? [], fetchedAt: Date.now() };
    airCache.set(data);
    res.json(data);
  } catch (e) { res.json({ locations: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── ISS position ────────────────────────────────────────────────────────────
router.get('/iss-position', async (_req, res) => {
  try {
    const r = await fetch('http://api.open-notify.org/iss-now.json');
    if (!r.ok) throw new Error(`ISS ${r.status}`);
    const j = await r.json() as any;
    res.json({ lat: parseFloat(j.iss_position.latitude), lng: parseFloat(j.iss_position.longitude), ts: j.timestamp });
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

// ─── OFAC sanctions ──────────────────────────────────────────────────────────
const sanctionsCache = makeCache<unknown>(24 * 3600_000);

router.get('/ofac-sanctions', async (_req, res) => {
  const cached = sanctionsCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://data.treasury.gov/resource/zqt5-6ixm.json?$limit=200&$order=date_listed DESC');
    if (!r.ok) throw new Error(`OFAC ${r.status}`);
    const j = await r.json() as any[];
    const data = { entries: j, fetchedAt: Date.now() };
    sanctionsCache.set(data);
    res.json(data);
  } catch (e) { res.json({ entries: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── OpenSky flights ─────────────────────────────────────────────────────────
const flightsCache = makeCache<unknown>(5 * 60_000);

router.get('/opensky-flights', async (_req, res) => {
  const cached = flightsCache.get();
  if (cached) { res.json(cached); return; }
  try {
    const r = await fetch('https://opensky-network.org/api/states/all', { headers: { 'User-Agent': 'trade-terminal/1.0' } });
    if (!r.ok) throw new Error(`OpenSky ${r.status}`);
    const j = await r.json() as any;
    const flights = (j.states ?? []).slice(0, 500).map((s: any) => ({ icao24: s[0], callsign: s[1]?.trim(), country: s[2], lng: s[5], lat: s[6], altitude: s[7], onGround: s[8], velocity: s[9], heading: s[10] })).filter((f: any) => f.lat && f.lng);
    const data = { flights, fetchedAt: Date.now() };
    flightsCache.set(data);
    res.json(data);
  } catch (e) { res.json({ flights: [], fetchedAt: Date.now(), error: String(e) }); }
});

export default router;
