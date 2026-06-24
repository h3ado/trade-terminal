// ACLED (Armed Conflict Location & Event Data) — last 7 days of geocoded
// political-violence events worldwide. Authenticates via ACLED's OAuth
// password grant using the myACLED email/password and reuses the access token.
// Cached 30 min server-side; upstream failures return an empty fallback payload
// instead of a 5xx so the map never blanks because ACLED rejected a request.
//
// Severity (S1..S5) is derived from `fatalities`:
//   0 -> S1, 1-2 -> S2, 3-9 -> S3, 10-29 -> S4, 30+ -> S5
// Bumped up one tier for "Battles" / "Explosions" event types.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type SitEvent = {
  id: string;
  source: 'acled';
  category: 'conflict';
  subType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  title: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  ts: number;
  fatalities: number;
  url?: string;
};

const TTL_MS = 30 * 60_000;
let cache: { ts: number; payload: { events: SitEvent[]; fetchedAt: number } } | null = null;
let inflight: Promise<{ events: SitEvent[]; fetchedAt: number }> | null = null;
let tokenCache: { token: string; expiresAt: number } | null = null;


function severityFromFatalities(f: number, eventType: string): 1 | 2 | 3 | 4 | 5 {
  let s: 1 | 2 | 3 | 4 | 5;
  if (f >= 30) s = 5;
  else if (f >= 10) s = 4;
  else if (f >= 3) s = 3;
  else if (f >= 1) s = 2;
  else s = 1;
  const t = eventType.toLowerCase();
  if (s < 5 && (t.includes('battle') || t.includes('explosion') || t.includes('remote violence'))) {
    s = (s + 1) as 1 | 2 | 3 | 4 | 5;
  }
  return s;
}

async function obtainAcledToken(email: string, password: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const body = new URLSearchParams();
  body.set('grant_type', 'password');
  body.set('client_id', 'acled');
  body.set('scope', 'authenticated');
  body.set('username', email);
  body.set('password', password);

  const r = await fetch('https://acleddata.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'lovable-situation/1.0' },
    body,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`acled auth ${r.status} ${text.slice(0, 160)}`);
  }

  const json = await r.json();
  const token = typeof json?.access_token === 'string' ? json.access_token : '';
  if (!token) throw new Error('acled auth missing access_token');
  const expiresIn = Number(json?.expires_in ?? 3600);
  tokenCache = { token, expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000 };
  return token;
}

async function fetchAcled(): Promise<{ events: SitEvent[]; fetchedAt: number }> {
  const email = Deno.env.get('ACLED_EMAIL');
  const password = Deno.env.get('ACLED_PASSWORD');
  if (!email || !password) throw new Error('ACLED_EMAIL / ACLED_PASSWORD not configured');

  const today = new Date();
  const start = new Date(today.getTime() - 7 * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = new URL('https://acleddata.com/api/acled/read');
  url.searchParams.set('_format', 'json');
  url.searchParams.set('event_date', `${fmt(start)}|${fmt(today)}`);
  url.searchParams.set('event_date_where', 'BETWEEN');
  url.searchParams.set('limit', '2000');
  url.searchParams.set('fields', 'event_id_cnty|event_date|event_type|sub_event_type|country|admin1|location|latitude|longitude|fatalities|notes|source|source_url');

  const token = await obtainAcledToken(email, password);
  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'lovable-situation/1.0' },
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`acled ${r.status} ${body.slice(0, 160)}`);
  }
  const json = await r.json();
  const rows: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  const events: SitEvent[] = [];
  for (const row of rows) {
    const lat = parseFloat(row.latitude);
    const lng = parseFloat(row.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const fat = Number(row.fatalities ?? 0) || 0;
    const eventType = String(row.event_type ?? row.sub_event_type ?? 'Conflict');
    const ts = row.event_date ? Date.parse(`${row.event_date}T12:00:00Z`) : Date.now();
    const title = String(row.notes ?? eventType).slice(0, 200);
    const location = [row.location, row.admin1, row.country].filter(Boolean).join(', ');
    events.push({
      id: `acled-${row.event_id_cnty ?? `${lat},${lng},${ts}`}`,
      source: 'acled',
      category: 'conflict',
      subType: String(row.sub_event_type ?? eventType),
      severity: severityFromFatalities(fat, eventType),
      title,
      location: String(location),
      country: String(row.country ?? ''),
      lat, lng, ts, fatalities: fat,
      url: row.source_url ? String(row.source_url) : undefined,
    });
  }
  events.sort((a, b) => b.ts - a.ts);
  return { events, fetchedAt: Date.now() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify(cache.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
      });
    }
    if (!inflight) {
      inflight = fetchAcled()
        .then(p => { cache = { ts: Date.now(), payload: p }; return p; })
        .finally(() => { inflight = null; });
    }
    const payload = await inflight;
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
    });
  } catch (e) {
    if (cache) {
      return new Response(JSON.stringify(cache.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      });
    }
    console.error('acled-events upstream failure', String((e as Error)?.message ?? e));
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e), events: [], fallback: true, fetchedAt: Date.now() }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  }
});
