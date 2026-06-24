// Earnings calendar via Yahoo Finance public JSON (next ~14 days).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Event = {
  id: string; source: string; kind: 'earnings';
  ts: string; country: string; ticker: string; label: string; importance: 1 | 2 | 3;
  eps_est?: number | null; eps_prior?: number | null;
  revenue_est?: number | null; market_cap?: number | null;
  when?: 'BMO' | 'AMC' | 'TNS' | null;
  source_url?: string;
};

async function yahooDay(date: string): Promise<Event[]> {
  // Public earnings calendar JSON. May rate-limit; tolerate failures.
  const url = `https://query1.finance.yahoo.com/v1/finance/visualization?date=${date}&entityIdType=earnings&offset=0&size=100&sortField=eventTimeEpoch&sortType=ASC`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 LovableBot' } });
    if (!r.ok) return [];
    const j = await r.json();
    const rows = (j?.finance?.result?.[0]?.documents?.[0]?.rows ?? []) as Array<Record<string, unknown>>;
    const cols = (j?.finance?.result?.[0]?.documents?.[0]?.columns ?? []) as Array<{ id: string }>;
    const idx: Record<string, number> = {};
    cols.forEach((c, i) => { idx[c.id] = i; });
    return rows.map((r, i) => {
      const ticker = String(r[idx['ticker']] ?? '');
      const company = String(r[idx['companyshortname']] ?? ticker);
      const epoch = Number(r[idx['eventtime']] ?? r[idx['startdatetime']] ?? 0);
      const epsEst = r[idx['epsestimate']] as number | null;
      const epsActual = r[idx['epsactual']] as number | null;
      const surprise = r[idx['epssurprisepct']] as number | null;
      const callTime = String(r[idx['startdatetimetype']] ?? '');
      const when: Event['when'] =
        callTime === 'BMO' ? 'BMO' : callTime === 'AMC' ? 'AMC' : callTime === 'TNS' ? 'TNS' : null;
      const importance: 1 | 2 | 3 = epsEst != null || ticker.length <= 4 ? 2 : 1;
      return {
        id: `yh-${ticker}-${date}-${i}`,
        source: 'Yahoo', kind: 'earnings' as const,
        ts: epoch ? new Date(epoch * 1000).toISOString() : `${date}T20:00:00Z`,
        country: 'US', ticker, label: company,
        importance,
        eps_est: epsEst ?? null,
        eps_prior: epsActual ?? null,
        revenue_est: null, market_cap: null,
        when,
        source_url: `https://finance.yahoo.com/quote/${ticker}`,
        // @ts-expect-error attach surprise
        surprise_pct: surprise ?? null,
      };
    });
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const today = new Date();
    const days: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today.getTime() + i * 86400_000);
      days.push(d.toISOString().slice(0, 10));
    }
    const results = await Promise.allSettled(days.map(yahooDay));
    const events = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []).slice(0, 200);
    return new Response(JSON.stringify({ events, fetchedAt: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ events: [], error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  }
});
