// Alt-data: Reddit r/wallstreetbets + r/stocks top via JSON API. No auth required.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCount?: number;
  tier: 1 | 2 | 3; topic?: string;
};

const SUBS = ["wallstreetbets", "stocks", "investing", "CryptoCurrency"];

function toGdeltDate(epochSec: number): string {
  const d = new Date(epochSec * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

async function fetchSub(sub: string): Promise<Article[]> {
  try {
    const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
      headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0 (alt-data)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const j = await r.json();
    const posts = (j?.data?.children ?? []) as Array<{ data: { id: string; title: string; permalink: string; created_utc: number; score: number; num_comments: number } }>;
    return posts.slice(0, 15).map(({ data: p }): Article => ({
      id: `reddit-${p.id}`,
      url: `https://www.reddit.com${p.permalink}`,
      title: `r/${sub}: ${p.title}`.slice(0, 280),
      domain: `r/${sub}`,
      seendate: toGdeltDate(p.created_utc),
      language: "eng",
      tone: Math.tanh((p.score - 100) / 1000),
      country: "INT",
      sourceCount: Math.max(1, Math.round(p.num_comments / 10)),
      tier: 3,
      topic: "alt-data",
    }));
  } catch { return []; }
}

const TTL_MS = 3 * 60_000;
let cache: { ts: number; payload: unknown } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) return new Response(JSON.stringify(cache.payload), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=180" } });
    const settled = await Promise.allSettled(SUBS.map(fetchSub));
    const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
    all.sort((a, b) => (b.sourceCount ?? 0) - (a.sourceCount ?? 0));
    const payload = { articles: all.slice(0, 60), fetchedAt: Date.now() };
    cache = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=180" } });
  } catch (e) {
    return new Response(JSON.stringify({ articles: [], fallback: true, error: String((e as Error).message ?? e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
