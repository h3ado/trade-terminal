// Twelve Data FX proxy with in-memory 60s cache.
// Returns latest spot prices vs USD for a fixed basket of major + EM crosses.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWELVE_KEY = Deno.env.get("TWELVE_DATA_API_KEY") ?? "";

// Major + select EM. All quoted as XXX/USD or USD/XXX as conventional.
// We'll always normalize to "1 unit of CCY = N USD" in the response.
const PAIRS: { ccy: string; symbol: string; invert: boolean }[] = [
  { ccy: "EUR", symbol: "EUR/USD", invert: false },
  { ccy: "GBP", symbol: "GBP/USD", invert: false },
  { ccy: "JPY", symbol: "USD/JPY", invert: true },
  { ccy: "CHF", symbol: "USD/CHF", invert: true },
  { ccy: "AUD", symbol: "AUD/USD", invert: false },
  { ccy: "NZD", symbol: "NZD/USD", invert: false },
  { ccy: "CAD", symbol: "USD/CAD", invert: true },
  { ccy: "CNY", symbol: "USD/CNY", invert: true },
  { ccy: "HKD", symbol: "USD/HKD", invert: true },
  { ccy: "SGD", symbol: "USD/SGD", invert: true },
  { ccy: "KRW", symbol: "USD/KRW", invert: true },
  { ccy: "INR", symbol: "USD/INR", invert: true },
  { ccy: "MXN", symbol: "USD/MXN", invert: true },
  { ccy: "BRL", symbol: "USD/BRL", invert: true },
  { ccy: "ZAR", symbol: "USD/ZAR", invert: true },
  { ccy: "TRY", symbol: "USD/TRY", invert: true },
  { ccy: "SEK", symbol: "USD/SEK", invert: true },
  { ccy: "NOK", symbol: "USD/NOK", invert: true },
];

type FxRow = {
  ccy: string;
  // value of 1 unit of ccy in USD
  usd: number;
  // 24h % change (positive = ccy strengthened vs USD)
  change_pct: number | null;
};

let cache: { ts: number; data: FxRow[] } | null = null;
const TTL_MS = 60_000;

async function fetchPair(p: typeof PAIRS[number]): Promise<FxRow> {
  // /quote returns close + previous_close
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(p.symbol)}&apikey=${TWELVE_KEY}`;
  try {
    const res = await fetch(url);
    const j = await res.json();
    if (j?.code && j.code !== 200) throw new Error(j.message || "fx fetch error");
    const close = parseFloat(j.close);
    const prev = parseFloat(j.previous_close);
    if (!isFinite(close) || close === 0) throw new Error("bad close");
    const usd = p.invert ? 1 / close : close;
    let change_pct: number | null = null;
    if (isFinite(prev) && prev !== 0) {
      const prevUsd = p.invert ? 1 / prev : prev;
      change_pct = ((usd - prevUsd) / prevUsd) * 100;
    }
    return { ccy: p.ccy, usd, change_pct };
  } catch (_e) {
    return { ccy: p.ccy, usd: NaN, change_pct: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!TWELVE_KEY) {
      return new Response(
        JSON.stringify({ error: "TWELVE_DATA_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(
        JSON.stringify({ rates: cache.data, cached: true, ts: cache.ts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Twelve Data free tier rate-limits parallel requests; serialize with a small delay.
    const data: FxRow[] = [];
    for (const p of PAIRS) {
      data.push(await fetchPair(p));
      await new Promise((r) => setTimeout(r, 150));
    }
    cache = { ts: Date.now(), data };

    return new Response(
      JSON.stringify({ rates: data, cached: false, ts: cache.ts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
