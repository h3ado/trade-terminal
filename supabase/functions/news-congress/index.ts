// Congressional trades from housestockwatcher + Senate eFD via public JSON.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number; country: string;
  sourceCount?: number; tier: 1 | 2 | 3; topic?: string;
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function toGdeltDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z";
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

type HouseTx = {
  disclosure_year?: number; transaction_date?: string; owner?: string;
  ticker?: string; asset_description?: string; type?: string; amount?: string;
  representative?: string; ptr_link?: string;
};

async function fetchHouse(): Promise<Article[]> {
  try {
    const r = await fetch("https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json", {
      headers: { "User-Agent": "lovable-news/1.0" },
    });
    if (!r.ok) return [];
    const j = await r.json() as HouseTx[];
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recent = j
      .filter(t => t.transaction_date && new Date(t.transaction_date).getTime() > cutoff)
      .slice(0, 200);
    return recent.map((t): Article => {
      const ticker = (t.ticker && t.ticker !== "--" ? t.ticker : "").toUpperCase();
      const amt = t.amount ?? "";
      const title = `[CONGRESS] ${t.representative ?? "House"} ${t.type ?? ""} ${ticker || (t.asset_description ?? "").slice(0, 40)} ${amt}`.trim();
      const link = t.ptr_link || `https://housestockwatcher.com/`;
      return {
        id: `house:${t.representative}:${t.transaction_date}:${ticker}`,
        url: link,
        title: title.slice(0, 280),
        domain: "housestockwatcher.com",
        seendate: toGdeltDate(t.transaction_date!),
        language: "eng",
        tone: 0,
        country: "US",
        sourceCount: 1,
        tier: 2,
        topic: "congress",
      };
    });
  } catch { return []; }
}

const TTL_MS = 5 * 60_000;
let cached: { ts: number; payload: unknown } | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (cached && Date.now() - cached.ts < TTL_MS) {
      return new Response(JSON.stringify(cached.payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const articles = await fetchHouse();
    articles.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const payload = { articles, fetchedAt: Date.now() };
    cached = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ articles: [], fallback: true, error: msg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
