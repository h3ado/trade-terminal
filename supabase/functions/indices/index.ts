// World index quotes — generates plausible mock data with daily drift.
// Free public indices APIs (Yahoo, Stooq, Twelve Data free) all reject server calls
// or paywall index data, so we synthesize values here. Swap this function for a paid
// feed (Twelve Data Grow, Polygon, or Alpha Vantage Premium) when ready — the
// rest of the pipeline (hook + globe layer) won't change.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// abbr → { display symbol, baseline level, free-float mcap (USD T), realistic daily vol % }
const SYMBOLS: { abbr: string; sym: string; base: number; mcap_usd_t: number; vol: number }[] = [
  { abbr: "NYSE", sym: "SPX",     base: 6650,  mcap_usd_t: 50.0, vol: 0.6 },
  { abbr: "NDAQ", sym: "NDX",     base: 24500, mcap_usd_t: 25.0, vol: 0.8 },
  { abbr: "CME",  sym: "DJI",     base: 47000, mcap_usd_t: 12.0, vol: 0.5 },
  { abbr: "LSE",  sym: "FTSE",    base: 8400,  mcap_usd_t: 3.5,  vol: 0.5 },
  { abbr: "PAR",  sym: "CAC",     base: 7800,  mcap_usd_t: 3.0,  vol: 0.6 },
  { abbr: "XETR", sym: "DAX",     base: 19500, mcap_usd_t: 2.5,  vol: 0.7 },
  { abbr: "SIX",  sym: "SMI",     base: 12200, mcap_usd_t: 1.8,  vol: 0.4 },
  { abbr: "AMS",  sym: "AEX",     base: 920,   mcap_usd_t: 1.0,  vol: 0.6 },
  { abbr: "BME",  sym: "IBEX",    base: 11800, mcap_usd_t: 0.8,  vol: 0.7 },
  { abbr: "BIT",  sym: "FTSEMIB", base: 35000, mcap_usd_t: 0.7,  vol: 0.7 },
  { abbr: "MOEX", sym: "IMOEX",   base: 2800,  mcap_usd_t: 0.4,  vol: 1.0 },
  { abbr: "TSE",  sym: "N225",    base: 39500, mcap_usd_t: 6.0,  vol: 0.8 },
  { abbr: "HKEX", sym: "HSI",     base: 19800, mcap_usd_t: 4.5,  vol: 1.0 },
  { abbr: "SSE",  sym: "SSEC",    base: 3200,  mcap_usd_t: 7.0,  vol: 0.7 },
  { abbr: "SZSE", sym: "SZCOMP",  base: 10000, mcap_usd_t: 5.0,  vol: 0.8 },
  { abbr: "KRX",  sym: "KOSPI",   base: 2600,  mcap_usd_t: 1.7,  vol: 0.7 },
  { abbr: "TWSE", sym: "TWII",    base: 22500, mcap_usd_t: 2.0,  vol: 0.7 },
  { abbr: "ASX",  sym: "AXJO",    base: 8200,  mcap_usd_t: 1.6,  vol: 0.5 },
  { abbr: "TSX",  sym: "TSX",     base: 24500, mcap_usd_t: 2.8,  vol: 0.5 },
  { abbr: "BSE",  sym: "SENSEX",  base: 80000, mcap_usd_t: 4.0,  vol: 0.7 },
  { abbr: "SGX",  sym: "STI",     base: 3600,  mcap_usd_t: 0.6,  vol: 0.4 },
  { abbr: "B3",   sym: "BVSP",    base: 130000,mcap_usd_t: 0.9,  vol: 1.0 },
  { abbr: "BMV",  sym: "MXX",     base: 56000, mcap_usd_t: 0.5,  vol: 0.8 },
  { abbr: "JSE",  sym: "J203",    base: 86000, mcap_usd_t: 1.0,  vol: 0.7 },
  { abbr: "DFM",  sym: "DFMGI",   base: 4900,  mcap_usd_t: 0.2,  vol: 0.6 },
  { abbr: "TDWL", sym: "TASI",    base: 11800, mcap_usd_t: 2.6,  vol: 0.6 },
  { abbr: "BIST", sym: "XU100",   base: 9800,  mcap_usd_t: 0.3,  vol: 1.5 },
  { abbr: "WSE",  sym: "WIG20",   base: 2400,  mcap_usd_t: 0.2,  vol: 0.7 },
  { abbr: "IDX",  sym: "JCI",     base: 7400,  mcap_usd_t: 0.7,  vol: 0.6 },
  { abbr: "SET",  sym: "SETI",    base: 1400,  mcap_usd_t: 0.5,  vol: 0.6 },
];

// Static "top movers" placeholder until a real movers feed is wired.
const TOP_MOVERS: Record<string, { sym: string; pct: number }[]> = {
  NYSE: [{ sym: "AAPL", pct: 1.4 }, { sym: "MSFT", pct: 0.8 }, { sym: "JPM", pct: -0.6 }],
  NDAQ: [{ sym: "NVDA", pct: 2.3 }, { sym: "TSLA", pct: -1.1 }, { sym: "META", pct: 0.9 }],
  CME:  [{ sym: "ES",   pct: 0.4 }, { sym: "NQ",   pct: 0.7 }, { sym: "RTY",  pct: -0.2 }],
  LSE:  [{ sym: "SHEL", pct: 0.7 }, { sym: "AZN",  pct: -0.4 }, { sym: "HSBA", pct: 0.3 }],
  XETR: [{ sym: "SAP",  pct: 1.0 }, { sym: "SIE",  pct: -0.2 }, { sym: "BMW",  pct: 0.5 }],
  TSE:  [{ sym: "7203", pct: 0.6 }, { sym: "9984", pct: 1.8 }, { sym: "6758", pct: -0.3 }],
  HKEX: [{ sym: "0700", pct: 1.2 }, { sym: "9988", pct: -0.7 }, { sym: "0941", pct: 0.4 }],
  SSE:  [{ sym: "601398", pct: 0.5 }, { sym: "601857", pct: -0.3 }, { sym: "600519", pct: 0.8 }],
  ASX:  [{ sym: "BHP",  pct: 0.6 }, { sym: "CBA",  pct: 0.3 }, { sym: "WBC",  pct: -0.4 }],
  BSE:  [{ sym: "RELI", pct: 0.9 }, { sym: "TCS",  pct: -0.5 }, { sym: "HDFC", pct: 0.4 }],
};

type IndexRow = {
  abbr: string;
  symbol: string;
  close: number;
  prev_close: number;
  change_pct: number;
  mcap_usd_t: number;
  movers: { sym: string; pct: number }[];
  source: "mock";
};

// Deterministic-per-day RNG (seeded by UTC date) so values are stable across cache refreshes.
function dayHash(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRand(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

function buildSnapshot(): IndexRow[] {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const rngToday = seededRand(dayHash(today));
  const rngPrev = seededRand(dayHash(yesterday));

  return SYMBOLS.map((s) => {
    // Each day: drift base by ±0.5% accumulated noise, then today's intra-day move ~ N(0, vol%).
    const driftDays = (Date.UTC(2026, 0, 1) - Date.now()) / 86_400_000;
    const drift = 1 + Math.sin(driftDays / 90) * 0.02;
    const prev_close = s.base * drift * (0.99 + rngPrev() * 0.02);
    // gauss-ish via box-muller-lite
    const u = Math.max(rngToday(), 1e-9);
    const v = Math.max(rngToday(), 1e-9);
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const todayPct = z * s.vol;
    const close = prev_close * (1 + todayPct / 100);
    const change_pct = ((close - prev_close) / prev_close) * 100;
    return {
      abbr: s.abbr,
      symbol: s.sym,
      close: Math.round(close * 100) / 100,
      prev_close: Math.round(prev_close * 100) / 100,
      change_pct: Math.round(change_pct * 1000) / 1000,
      mcap_usd_t: s.mcap_usd_t,
      movers: TOP_MOVERS[s.abbr] ?? [],
      source: "mock" as const,
    };
  });
}

let cache: { ts: number; data: IndexRow[] } | null = null;
const TTL_MS = 60_000;

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!cache || Date.now() - cache.ts > TTL_MS) {
      cache = { ts: Date.now(), data: buildSnapshot() };
    }
    return new Response(
      JSON.stringify({ indices: cache.data, source: "mock", ts: cache.ts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
