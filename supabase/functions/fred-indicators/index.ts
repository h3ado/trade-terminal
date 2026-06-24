// Live US economic indicators from the St. Louis Fed (FRED) API.
// Fetches the latest observation for a curated set of headline series
// (CPI YoY, unemployment, real GDP, fed funds rate, etc.) and returns
// them in a single payload. Cached server-side for 1h since FRED data
// updates monthly/quarterly — no point hammering it.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Series we expose. Keep keys stable — the frontend hook depends on them.
// `transform` defines how to derive the headline figure from raw observations.
//   - 'latest': take most recent value as-is
//   - 'yoy_pct': % change vs 12 observations ago (for monthly index series)
//   - 'qoq_ann_pct': annualized % change vs prior quarter (for GDP)
const SERIES: Record<string, { id: string; label: string; unit: string; transform: 'latest' | 'yoy_pct' | 'qoq_ann_pct' }> = {
  cpi_yoy:        { id: 'CPIAUCSL',  label: 'CPI YoY',           unit: '%',     transform: 'yoy_pct' },
  core_cpi_yoy:   { id: 'CPILFESL',  label: 'Core CPI YoY',      unit: '%',     transform: 'yoy_pct' },
  pce_yoy:        { id: 'PCEPI',     label: 'PCE YoY',           unit: '%',     transform: 'yoy_pct' },
  core_pce_yoy:   { id: 'PCEPILFE',  label: 'Core PCE YoY',      unit: '%',     transform: 'yoy_pct' },
  unemployment:   { id: 'UNRATE',    label: 'Unemployment',      unit: '%',     transform: 'latest' },
  nfp_change:     { id: 'PAYEMS',    label: 'NFP Δ (k)',         unit: 'k',     transform: 'latest' }, // we'll diff manually
  gdp_growth:     { id: 'GDPC1',     label: 'Real GDP QoQ Ann.', unit: '%',     transform: 'qoq_ann_pct' },
  fed_funds:      { id: 'DFEDTARU',  label: 'Fed Funds Upper',   unit: '%',     transform: 'latest' },
  ten_year:       { id: 'DGS10',     label: '10Y Treasury',      unit: '%',     transform: 'latest' },
  two_year:       { id: 'DGS2',      label: '2Y Treasury',       unit: '%',     transform: 'latest' },
  m2:             { id: 'M2SL',      label: 'M2 YoY',            unit: '%',     transform: 'yoy_pct' },
  industrial_prod:{ id: 'INDPRO',    label: 'Industrial Prod YoY', unit: '%',   transform: 'yoy_pct' },
  retail_sales:   { id: 'RSAFS',     label: 'Retail Sales YoY',  unit: '%',     transform: 'yoy_pct' },
};

type Indicator = {
  key: string;
  id: string;
  label: string;
  unit: string;
  value: number | null;
  prev: number | null;
  change: number | null;     // value - prev
  date: string | null;       // observation date
};

type Obs = { date: string; value: string };

async function fetchSeries(id: string, apiKey: string, limit = 16): Promise<Obs[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${id} ${res.status}`);
  const json = await res.json();
  return (json.observations ?? []) as Obs[];
}

function num(s: string | undefined): number | null {
  if (!s || s === '.') return null;
  const v = parseFloat(s);
  return Number.isFinite(v) ? v : null;
}

function buildIndicator(key: string, obs: Obs[]): Indicator {
  const meta = SERIES[key];
  const out: Indicator = { key, id: meta.id, label: meta.label, unit: meta.unit, value: null, prev: null, change: null, date: null };
  if (!obs.length) return out;

  if (meta.transform === 'latest') {
    if (key === 'nfp_change') {
      // PAYEMS is total nonfarm in thousands; compute monthly delta.
      const v0 = num(obs[0]?.value);
      const v1 = num(obs[1]?.value);
      const v2 = num(obs[2]?.value);
      out.date = obs[0]?.date ?? null;
      out.value = v0 != null && v1 != null ? Math.round(v0 - v1) : null;
      out.prev = v1 != null && v2 != null ? Math.round(v1 - v2) : null;
    } else {
      out.value = num(obs[0]?.value);
      out.prev = num(obs[1]?.value);
      out.date = obs[0]?.date ?? null;
    }
  } else if (meta.transform === 'yoy_pct') {
    // Monthly series: value is index, derive YoY.
    const v0 = num(obs[0]?.value);
    const v12 = num(obs[12]?.value);
    const v1 = num(obs[1]?.value);
    const v13 = num(obs[13]?.value);
    out.date = obs[0]?.date ?? null;
    out.value = v0 != null && v12 != null && v12 !== 0 ? +(((v0 - v12) / v12) * 100).toFixed(2) : null;
    out.prev = v1 != null && v13 != null && v13 !== 0 ? +(((v1 - v13) / v13) * 100).toFixed(2) : null;
  } else if (meta.transform === 'qoq_ann_pct') {
    // Quarterly: annualized QoQ growth = ((v0/v1)^4 - 1) * 100.
    const v0 = num(obs[0]?.value);
    const v1 = num(obs[1]?.value);
    const v2 = num(obs[2]?.value);
    out.date = obs[0]?.date ?? null;
    out.value = v0 != null && v1 != null && v1 > 0 ? +(((Math.pow(v0 / v1, 4) - 1) * 100)).toFixed(2) : null;
    out.prev = v1 != null && v2 != null && v2 > 0 ? +(((Math.pow(v1 / v2, 4) - 1) * 100)).toFixed(2) : null;
  }

  if (out.value != null && out.prev != null) {
    out.change = +(out.value - out.prev).toFixed(2);
  }
  return out;
}

let cache: { ts: number; indicators: Indicator[] } | null = null;
const TTL_MS = 60 * 60_000; // 1h

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(
        JSON.stringify({ indicators: cache.indicators, ts: cache.ts, source: 'fred', cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('FRED_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'FRED_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const keys = Object.keys(SERIES);
    const results = await Promise.allSettled(
      keys.map(async (k) => {
        const obs = await fetchSeries(SERIES[k].id, apiKey);
        return buildIndicator(k, obs);
      }),
    );
    const indicators: Indicator[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`FRED ${keys[i]} failed:`, r.reason);
      const meta = SERIES[keys[i]];
      return { key: keys[i], id: meta.id, label: meta.label, unit: meta.unit, value: null, prev: null, change: null, date: null };
    });

    cache = { ts: Date.now(), indicators };
    console.log(`FRED snapshot: ${indicators.filter(i => i.value != null).length}/${indicators.length} series`);
    return new Response(
      JSON.stringify({ indicators, ts: cache.ts, source: 'fred', cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
