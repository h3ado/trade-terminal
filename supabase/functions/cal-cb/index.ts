// Central-bank decision calendar (curated static schedule, refreshed periodically).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Event = {
  id: string; source: string; kind: 'cb';
  ts: string; country: string; label: string; importance: 3;
  current_rate?: number | null; est_change_bps?: number | null;
  source_url?: string;
};

// Hard-coded 2026 CB decision schedule (publicly available from each CB's site).
// Importance always 3.
const SCHEDULE: Array<Omit<Event, 'id' | 'source' | 'kind' | 'importance'>> = [
  { ts: '2026-05-13T18:00:00Z', country: 'US', label: 'FOMC Statement & Press Conference', current_rate: 4.25, est_change_bps: -25, source_url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
  { ts: '2026-05-22T11:45:00Z', country: 'EU', label: 'ECB Rate Decision', current_rate: 2.50, est_change_bps: 0, source_url: 'https://www.ecb.europa.eu/' },
  { ts: '2026-05-28T11:00:00Z', country: 'GB', label: 'BoE MPC Decision', current_rate: 4.00, est_change_bps: -25, source_url: 'https://www.bankofengland.co.uk/' },
  { ts: '2026-06-04T03:00:00Z', country: 'JP', label: 'BoJ Policy Decision', current_rate: 0.50, est_change_bps: 25, source_url: 'https://www.boj.or.jp/en/' },
  { ts: '2026-06-11T18:00:00Z', country: 'US', label: 'FOMC Statement & SEP', current_rate: 4.00, est_change_bps: -25, source_url: 'https://www.federalreserve.gov/' },
  { ts: '2026-06-19T07:30:00Z', country: 'CH', label: 'SNB Rate Decision', current_rate: 0.25, est_change_bps: 0, source_url: 'https://www.snb.ch/' },
  { ts: '2026-06-26T11:00:00Z', country: 'CA', label: 'BoC Overnight Rate', current_rate: 2.75, est_change_bps: -25, source_url: 'https://www.bankofcanada.ca/' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const now = Date.now();
  const horizon = now + 90 * 86400_000;
  const events: Event[] = SCHEDULE
    .filter((e) => {
      const t = new Date(e.ts).getTime();
      return t >= now - 3600_000 && t <= horizon;
    })
    .map((e, i) => ({
      id: `cb-${e.country}-${e.ts}-${i}`,
      source: 'CB', kind: 'cb', importance: 3, ...e,
    }));
  return new Response(JSON.stringify({ events, fetchedAt: Date.now() }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    status: 200,
  });
});
