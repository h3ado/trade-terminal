// Live crypto prices from CoinGecko's free /coins/markets endpoint.
// Returns top N coins by market cap with 24h change. No API key required.
// Cached server-side for 60s — CoinGecko's free tier is rate-limited.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Coin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  change24hPct: number | null;
  change7dPct: number | null;
  ath: number;
  athChangePct: number | null;
  high24h: number;
  low24h: number;
  supply: number | null;
  maxSupply: number | null;
};

let cache: { ts: number; coins: Coin[] } | null = null;
const TTL_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(
        JSON.stringify({ coins: cache.coins, ts: cache.ts, source: 'coingecko', cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = 'https://api.coingecko.com/api/v3/coins/markets'
      + '?vs_currency=usd'
      + '&order=market_cap_desc'
      + '&per_page=50'
      + '&page=1'
      + '&price_change_percentage=24h,7d';
    const r = await fetch(url, { headers: { 'User-Agent': 'lovable-globe/1.0', accept: 'application/json' } });
    if (!r.ok) {
      const body = await r.text();
      throw new Error(`coingecko ${r.status}: ${body.slice(0, 200)}`);
    }
    const raw = (await r.json()) as any[];
    const coins: Coin[] = raw.map((c) => ({
      id: c.id,
      symbol: (c.symbol ?? '').toUpperCase(),
      name: c.name,
      image: c.image,
      price: c.current_price,
      marketCap: c.market_cap,
      marketCapRank: c.market_cap_rank,
      volume24h: c.total_volume,
      change24hPct: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? null,
      change7dPct: c.price_change_percentage_7d_in_currency ?? null,
      ath: c.ath,
      athChangePct: c.ath_change_percentage,
      high24h: c.high_24h,
      low24h: c.low_24h,
      supply: c.circulating_supply,
      maxSupply: c.max_supply,
    }));

    cache = { ts: Date.now(), coins };
    console.log(`CoinGecko snapshot: ${coins.length} coins, BTC=$${coins.find(c => c.id === 'bitcoin')?.price ?? '?'}`);
    return new Response(
      JSON.stringify({ coins, ts: cache.ts, source: 'coingecko', cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('coingecko-prices error', e);
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e), coins: [] }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
