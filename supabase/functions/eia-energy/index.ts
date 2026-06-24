// Live US energy stats from EIA (Energy Information Administration) API v2.
// Returns latest values for headline weekly/monthly series:
//   - WTI spot price ($/bbl)
//   - Brent spot price ($/bbl)
//   - Henry Hub natural gas spot ($/MMBtu)
//   - US crude inventories (commercial, ex-SPR, kbbl)
//   - US gasoline stocks (kbbl)
//   - US distillate stocks (kbbl)
//   - US crude production (mbbl/day)
//   - US natural gas working storage (Bcf)
//
// Cached for 1h since EIA data updates weekly/monthly.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type EIASeries = { route: string; label: string; unit: string; transform?: 'delta_wow' };

// EIA v2 routes. `route` is appended to /v2/{route}/data/?api_key=...&...
const SERIES: Record<string, EIASeries> = {
  wti:           { route: 'petroleum/pri/spt/data', label: 'WTI Crude Spot', unit: '$/bbl' },
  brent:         { route: 'petroleum/pri/spt/data', label: 'Brent Spot',     unit: '$/bbl' },
  henry_hub:     { route: 'natural-gas/pri/sum/data', label: 'Henry Hub',    unit: '$/MMBtu' },
  crude_stocks:  { route: 'petroleum/stoc/wstk/data', label: 'Crude Stocks (ex-SPR)', unit: 'Mbbl', transform: 'delta_wow' },
  gasoline_stocks: { route: 'petroleum/stoc/wstk/data', label: 'Gasoline Stocks', unit: 'Mbbl', transform: 'delta_wow' },
  distillate_stocks: { route: 'petroleum/stoc/wstk/data', label: 'Distillate Stocks', unit: 'Mbbl', transform: 'delta_wow' },
  crude_production: { route: 'petroleum/sum/snd/data', label: 'US Crude Production', unit: 'kb/d' },
  natgas_storage: { route: 'natural-gas/stor/wkly/data', label: 'NatGas Working Storage', unit: 'Bcf', transform: 'delta_wow' },
};

// Series IDs per key. EIA v2 supports `facets[series][]=` to filter.
const SERIES_FACETS: Record<string, { series: string }> = {
  wti:               { series: 'RWTC' },           // Cushing WTI Spot
  brent:             { series: 'RBRTE' },          // Europe Brent Spot
  henry_hub:         { series: 'RNGWHHD' },        // Henry Hub Spot
  crude_stocks:      { series: 'WCESTUS1' },       // Weekly US ending stocks ex-SPR
  gasoline_stocks:   { series: 'WGTSTUS1' },       // Weekly US gasoline stocks
  distillate_stocks: { series: 'WDISTUS1' },       // Weekly US distillate stocks
  crude_production:  { series: 'MCRFPUS2' },       // Monthly US field production crude
  natgas_storage:    { series: 'NW2_EPG0_SWO_R48_BCF' }, // Lower 48 working gas in storage
};

type Indicator = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  prev: number | null;
  change: number | null;
  date: string | null;
};

async function fetchLatest(key: string, apiKey: string): Promise<Indicator> {
  const meta = SERIES[key];
  const facet = SERIES_FACETS[key];
  const out: Indicator = { key, label: meta.label, unit: meta.unit, value: null, prev: null, change: null, date: null };

  const params = new URLSearchParams({
    api_key: apiKey,
    'frequency': key === 'crude_production' ? 'monthly' : (key === 'natgas_storage' ? 'weekly' : 'weekly'),
    'data[0]': 'value',
    'sort[0][column]': 'period',
    'sort[0][direction]': 'desc',
    'offset': '0',
    'length': '4',
  });
  params.append('facets[series][]', facet.series);

  const url = `https://api.eia.gov/v2/${meta.route}/?${params.toString()}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'lovable-globe/1.0', accept: 'application/json' } });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`EIA ${key} ${r.status}: ${body.slice(0, 200)}`);
  }
  const json = await r.json();
  const rows: any[] = json?.response?.data ?? [];
  if (!rows.length) return out;

  const v0 = typeof rows[0]?.value === 'number' ? rows[0].value : parseFloat(rows[0]?.value);
  const v1 = rows[1] ? (typeof rows[1].value === 'number' ? rows[1].value : parseFloat(rows[1].value)) : NaN;
  out.date = rows[0]?.period ?? null;
  out.value = Number.isFinite(v0) ? +v0.toFixed(2) : null;
  out.prev = Number.isFinite(v1) ? +v1.toFixed(2) : null;
  if (out.value != null && out.prev != null) out.change = +(out.value - out.prev).toFixed(2);

  // Convert kbbl → Mbbl for stocks (EIA returns in thousand barrels).
  if (meta.unit === 'Mbbl' && out.value != null) {
    out.value = +(out.value / 1000).toFixed(2);
    if (out.prev != null) out.prev = +(out.prev / 1000).toFixed(2);
    if (out.change != null) out.change = +(out.change / 1000).toFixed(2);
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
        JSON.stringify({ indicators: cache.indicators, ts: cache.ts, source: 'eia', cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const apiKey = Deno.env.get('EIA_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'EIA_API_KEY not configured', indicators: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const keys = Object.keys(SERIES);
    const results = await Promise.allSettled(keys.map((k) => fetchLatest(k, apiKey)));
    const indicators: Indicator[] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`EIA ${keys[i]} failed:`, r.reason);
      const meta = SERIES[keys[i]];
      return { key: keys[i], label: meta.label, unit: meta.unit, value: null, prev: null, change: null, date: null };
    });

    cache = { ts: Date.now(), indicators };
    console.log(`EIA snapshot: ${indicators.filter(i => i.value != null).length}/${indicators.length} series`);
    return new Response(
      JSON.stringify({ indicators, ts: cache.ts, source: 'eia', cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e), indicators: [] }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
