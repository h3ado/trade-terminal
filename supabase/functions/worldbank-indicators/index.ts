// Live country indicators from the World Bank Indicators API.
// Free, no key. Returns latest available value per country for a curated
// set of headline series (GDP, GDP per capita, inflation, unemployment,
// debt-to-GDP, current account, population, FDI).
//
// Cached server-side for 24h since these are annual series.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SERIES: Record<string, { code: string; label: string; unit: string }> = {
  gdp_usd:        { code: 'NY.GDP.MKTP.CD',    label: 'GDP (current $)',     unit: 'USD' },
  gdp_per_cap:    { code: 'NY.GDP.PCAP.CD',    label: 'GDP per capita',      unit: 'USD' },
  gdp_growth:     { code: 'NY.GDP.MKTP.KD.ZG', label: 'GDP growth',          unit: '%' },
  inflation:      { code: 'FP.CPI.TOTL.ZG',    label: 'Inflation CPI',       unit: '%' },
  unemployment:   { code: 'SL.UEM.TOTL.ZS',    label: 'Unemployment',        unit: '%' },
  population:     { code: 'SP.POP.TOTL',       label: 'Population',          unit: 'people' },
  current_acct:   { code: 'BN.CAB.XOKA.GD.ZS', label: 'Current acct (% GDP)', unit: '%' },
  govt_debt:      { code: 'GC.DOD.TOTL.GD.ZS', label: 'Govt debt (% GDP)',   unit: '%' },
};

// Keep iso3 codes — World Bank uses 3-letter ISO. Expand as needed; covers
// the countries we render in GlobalGDP.tsx.
const COUNTRIES = [
  'USA','CHN','JPN','DEU','IND','GBR','FRA','CAN','BRA','KOR','AUS','MEX','CHE',
  'ITA','ESP','NLD','SAU','TUR','RUS','IDN','POL','BEL','SWE','NOR','SGP','HKG',
  'IRL','ARE','AUT','ZAF','THA','VNM','PHL','MYS','EGY','NGA','ARG','CHL','COL',
  'NZL','DNK','FIN','PRT','GRC','CZE','ROU','HUN','ISR','UKR','PAK','BGD',
];

type Datum = {
  iso3: string;
  iso2: string;
  country: string;
  year: number | null;
  value: number | null;
};

type IndicatorBlock = {
  key: string;
  code: string;
  label: string;
  unit: string;
  byIso3: Record<string, Datum>;
};

async function fetchSeries(code: string): Promise<Map<string, Datum>> {
  const countries = COUNTRIES.join(';');
  // mrv=4 returns last 4 observations so we can pick most recent non-null.
  const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${code}?format=json&per_page=2000&mrv=4`;
  const r = await fetch(url, { headers: { 'User-Agent': 'lovable-globe/1.0' } });
  if (!r.ok) throw new Error(`worldbank ${code} ${r.status}`);
  const json = await r.json();
  const rows: any[] = Array.isArray(json) && json.length > 1 ? json[1] : [];
  const out = new Map<string, Datum>();
  for (const row of rows) {
    const iso3: string | undefined = row?.countryiso3code;
    if (!iso3) continue;
    const value: number | null = row?.value;
    const year: number | null = row?.date ? parseInt(row.date, 10) : null;
    const existing = out.get(iso3);
    // Keep the most recent non-null observation.
    if (value != null && (!existing || existing.value == null || (year ?? 0) > (existing.year ?? 0))) {
      out.set(iso3, {
        iso3,
        iso2: row?.country?.id ?? '',
        country: row?.country?.value ?? iso3,
        year,
        value,
      });
    } else if (!existing) {
      out.set(iso3, {
        iso3,
        iso2: row?.country?.id ?? '',
        country: row?.country?.value ?? iso3,
        year,
        value,
      });
    }
  }
  return out;
}

let cache: { ts: number; indicators: IndicatorBlock[] } | null = null;
const TTL_MS = 24 * 60 * 60_000; // 24h

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(
        JSON.stringify({ indicators: cache.indicators, ts: cache.ts, source: 'worldbank', cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const keys = Object.keys(SERIES);
    const results = await Promise.allSettled(keys.map((k) => fetchSeries(SERIES[k].code)));
    const indicators: IndicatorBlock[] = results.map((r, i) => {
      const k = keys[i];
      const meta = SERIES[k];
      const byIso3: Record<string, Datum> = {};
      if (r.status === 'fulfilled') {
        for (const [iso, d] of r.value) byIso3[iso] = d;
      } else {
        console.error(`worldbank ${k} failed:`, r.reason);
      }
      return { key: k, code: meta.code, label: meta.label, unit: meta.unit, byIso3 };
    });

    cache = { ts: Date.now(), indicators };
    console.log(`World Bank snapshot: ${indicators.length} series × ${COUNTRIES.length} countries`);
    return new Response(
      JSON.stringify({ indicators, ts: cache.ts, source: 'worldbank', cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e), indicators: [] }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
