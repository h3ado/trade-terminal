// Legal/regulatory: SCOTUS opinions, FTC press, DOJ press releases.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCount?: number;
  tier: 1 | 2 | 3; topic?: string;
};

const FEEDS = [
  { url: "https://www.supremecourt.gov/rss/cases.aspx",     domain: "supremecourt.gov" },
  { url: "https://www.ftc.gov/feeds/press-release.xml",     domain: "ftc.gov" },
  { url: "https://www.justice.gov/feeds/press-releases",    domain: "justice.gov" },
  { url: "https://www.cftc.gov/RSS/RSSPRR/rsspressroom.xml", domain: "cftc.gov" },
];

function toGdeltDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function stripTags(s: string) { return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(); }
function pickTag(xml: string, tag: string) {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  if (!m) return ""; return stripTags(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1"));
}
function parseRss(xml: string) {
  const out: { title: string; link: string; pubDate: string }[] = [];
  const re = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[2];
    const title = pickTag(block, "title");
    let link = pickTag(block, "link");
    if (!link) { const lm = /<link[^>]*href="([^"]+)"/i.exec(block); if (lm) link = lm[1]; }
    const pubDate = pickTag(block, "pubDate") || pickTag(block, "updated") || pickTag(block, "published") || new Date().toISOString();
    if (title) out.push({ title, link: link || "", pubDate });
  }
  return out;
}

async function fetchFeed(f: typeof FEEDS[number]): Promise<Article[]> {
  try {
    const r = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRss(xml).slice(0, 20).map((it): Article => ({
      id: it.link || `${f.domain}-${it.title}`,
      url: it.link, title: it.title.slice(0, 280),
      domain: f.domain, seendate: toGdeltDate(it.pubDate),
      language: "eng", tone: -0.1, country: "US", sourceCount: 1,
      tier: 1, topic: "regulation",
    }));
  } catch { return []; }
}

const TTL_MS = 5 * 60_000;
let cache: { ts: number; payload: unknown } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) return new Response(JSON.stringify(cache.payload), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
    all.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const payload = { articles: all.slice(0, 60), fetchedAt: Date.now() };
    cache = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
  } catch (e) {
    return new Response(JSON.stringify({ articles: [], fallback: true, error: String((e as Error).message ?? e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
