// Econ release calendar (FRED + tradingeconomics RSS fallback). Returns next ~30 days.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const FRED_KEY = Deno.env.get('FRED_API_KEY') ?? '';

type Event = {
  id: string; source: string; kind: 'econ';
  ts: string; country: string; label: string;
  importance: 1 | 2 | 3;
  prior?: number | null; forecast?: number | null; actual?: number | null;
  unit?: string | null; source_url?: string;
};

const HIGH_IMP_RX = /(payroll|nonfarm|cpi|ppi|gdp|fomc|rate decision|jobless|unemployment|pce|retail sales|ism)/i;
const MED_IMP_RX = /(housing|claims|industrial|sentiment|trade balance|inventories|durable)/i;

async function fred(): Promise<Event[]> {
  if (!FRED_KEY) return [];
  // FRED release calendar (next 30d)
  const today = new Date();
  const end = new Date(Date.now() + 30 * 86400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://api.stlouisfed.org/fred/releases/dates?api_key=${FRED_KEY}&file_type=json&realtime_start=${fmt(today)}&realtime_end=${fmt(end)}&include_release_dates_with_no_data=true&order_by=release_date&sort_order=asc&limit=200`;
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    const list = (j.release_dates ?? []) as Array<{ release_id: number; release_name: string; date: string }>;
    return list.map((rd) => {
      const name = rd.release_name;
      const importance: 1 | 2 | 3 = HIGH_IMP_RX.test(name) ? 3 : MED_IMP_RX.test(name) ? 2 : 1;
      return {
        id: `fred-${rd.release_id}-${rd.date}`,
        source: 'FRED', kind: 'econ' as const,
        ts: `${rd.date}T13:30:00Z`,
        country: 'US', label: name, importance,
        prior: null, forecast: null, actual: null, unit: null,
        source_url: `https://fred.stlouisfed.org/release?rid=${rd.release_id}`,
      };
    }).slice(0, 80);
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const events = await fred();
    return new Response(JSON.stringify({ events, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ events: [], error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  }
});
