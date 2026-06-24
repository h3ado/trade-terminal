// Earnings transcripts — Google News + AI summary, cached per ticker+period.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

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
function stripTags(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}
function pickTag(b: string, t: string) {
  const m = new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i").exec(b);
  return m ? stripTags(m[1]) : "";
}

async function fetchEarningsRss(ticker?: string): Promise<Article[]> {
  const q = ticker
    ? `${ticker} earnings call transcript site:seekingalpha.com OR site:fool.com when:14d`
    : `earnings call transcript site:seekingalpha.com OR site:fool.com when:7d`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" } });
    if (!r.ok) return [];
    const xml = await r.text();
    const out: Article[] = [];
    const re = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const block = m[1];
      const title = pickTag(block, "title");
      const link = pickTag(block, "link");
      const pub = pickTag(block, "pubDate") || new Date().toISOString();
      if (!title || !link) continue;
      const domain = /seekingalpha/i.test(link) ? "seekingalpha.com" : /fool\.com/i.test(link) ? "fool.com" : "news.google.com";
      out.push({
        id: link, url: link, title: `[EARN] ${title.slice(0, 260)}`, domain,
        seendate: toGdeltDate(pub), language: "eng", tone: 0, country: "",
        sourceCount: 1, tier: 1, topic: "earnings",
      });
    }
    return out.slice(0, 30);
  } catch { return []; }
}

const TTL_MS = 5 * 60_000;
const cache = new Map<string, { ts: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const ticker = (url.searchParams.get("ticker") || "").toUpperCase();
    const summarize = url.searchParams.get("summarize") === "1";
    const key = `${ticker}|${summarize ? "s" : ""}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return new Response(JSON.stringify(hit.payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const articles = await fetchEarningsRss(ticker || undefined);

    let summaries: Record<string, unknown> = {};
    if (summarize && ticker && articles.length > 0) {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const period = articles[0].seendate.slice(0, 6);
      const { data: existing } = await sb.from("news_earnings_cache").select("*").eq("ticker", ticker).eq("period", period).maybeSingle();
      if (existing) {
        summaries = { [period]: existing.transcript_summary };
      } else {
        const apiKey = Deno.env.get("LOVABLE_API_KEY");
        if (apiKey) {
          const titles = articles.slice(0, 8).map(a => a.title).join("\n");
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: `Extract from earnings headlines. JSON: { "guidance": string, "surprise": string, "tone": "hawkish"|"dovish"|"neutral", "key_points": string[] }` },
                { role: "user", content: `${ticker} headlines:\n${titles}` },
              ],
            }),
          });
          if (aiRes.ok) {
            try {
              const sum = JSON.parse((await aiRes.json())?.choices?.[0]?.message?.content ?? "{}");
              summaries = { [period]: sum };
              await sb.from("news_earnings_cache").upsert({ ticker, period, source: articles[0].domain, url: articles[0].url, transcript_summary: sum });
            } catch { /* ignore */ }
          }
        }
      }
    }

    const payload = { articles, summaries, fetchedAt: Date.now() };
    cache.set(key, { ts: Date.now(), payload });
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ articles: [], fallback: true, error: msg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
