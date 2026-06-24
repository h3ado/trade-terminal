// Multi-source RSS aggregator for the NEWS terminal.
// Returns articles in the same shape as gdelt-news so the frontend can merge.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCountry?: string;
  sourceCount?: number;
  tier: 1 | 2 | 3;
  topic?: string;
};

const FEEDS: { url: string; domain: string; tier: 1 | 2 | 3; topic?: string; country?: string }[] = [
  { url: "https://feeds.reuters.com/reuters/businessNews", domain: "reuters.com", tier: 1, topic: "macro" },
  { url: "https://feeds.reuters.com/reuters/marketsNews", domain: "reuters.com", tier: 1, topic: "macro" },
  { url: "https://www.ft.com/markets?format=rss", domain: "ft.com", tier: 1, topic: "macro" },
  { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", domain: "wsj.com", tier: 1, topic: "macro" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", domain: "cnbc.com", tier: 1, topic: "macro" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", domain: "bbc.com", tier: 1, topic: "macro" },
  // Central banks
  { url: "https://www.federalreserve.gov/feeds/press_all.xml", domain: "federalreserve.gov", tier: 1, topic: "central-bank", country: "US" },
  { url: "https://www.ecb.europa.eu/rss/press.html", domain: "ecb.europa.eu", tier: 1, topic: "central-bank", country: "EU" },
  { url: "https://www.bankofengland.co.uk/rss/news", domain: "bankofengland.co.uk", tier: 1, topic: "central-bank", country: "UK" },
  { url: "https://www.boj.or.jp/en/rss/whatsnew.xml", domain: "boj.or.jp", tier: 1, topic: "central-bank", country: "JP" },
  // Crypto
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", domain: "coindesk.com", tier: 2, topic: "crypto" },
  { url: "https://www.theblock.co/rss.xml", domain: "theblock.co", tier: 2, topic: "crypto" },
];

const TOPIC_RULES: { re: RegExp; topic: string }[] = [
  { re: /\b(fed|fomc|powell|ecb|lagarde|boe|boj|rba|snb|rate hike|rate cut|policy)\b/i, topic: "central-bank" },
  { re: /\b(earnings|guidance|revenue|eps|beats|misses|profit)\b/i, topic: "earnings" },
  { re: /\b(war|missile|sanction|invasion|election|coup|tariff|trade war|geopolit)\b/i, topic: "geopolitics" },
  { re: /\b(oil|opec|brent|wti|gas|lng|crude|natgas)\b/i, topic: "energy" },
  { re: /\b(bitcoin|btc|ethereum|eth|crypto|defi|stablecoin)\b/i, topic: "crypto" },
  { re: /\b(sec|cftc|doj|antitrust|regulator|lawsuit|fine|probe)\b/i, topic: "regulation" },
];

function classify(title: string, fallback?: string): string {
  for (const r of TOPIC_RULES) if (r.re.test(title)) return r.topic;
  return fallback ?? "macro";
}

function toGdeltDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function pickTag(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  if (!m) return "";
  return stripTags(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1"));
}

function parseRss(xml: string): { title: string; link: string; pubDate: string }[] {
  const items: { title: string; link: string; pubDate: string }[] = [];
  // <item>…</item> or Atom <entry>…</entry>
  const itemRe = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[2];
    const title = pickTag(block, "title");
    let link = pickTag(block, "link");
    if (!link) {
      const lm = /<link[^>]*href="([^"]+)"/i.exec(block);
      if (lm) link = lm[1];
    }
    const pubDate = pickTag(block, "pubDate") || pickTag(block, "updated") || pickTag(block, "published") || new Date().toISOString();
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

async function fetchFeed(f: typeof FEEDS[number]): Promise<Article[]> {
  try {
    const r = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" } });
    if (!r.ok) return [];
    const xml = await r.text();
    const items = parseRss(xml).slice(0, 20);
    return items.map((it): Article => ({
      id: it.link,
      url: it.link,
      title: it.title.slice(0, 280),
      domain: f.domain,
      seendate: toGdeltDate(it.pubDate),
      language: "eng",
      tone: 0,
      country: f.country ?? "",
      sourceCountry: f.country,
      sourceCount: 1,
      tier: f.tier,
      topic: classify(it.title, f.topic),
    }));
  } catch {
    return [];
  }
}

const TTL_MS = 60_000;
const cache = new Map<string, { ts: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const topic = (url.searchParams.get("topic") || "").toLowerCase();
    const country = (url.searchParams.get("country") || "").toUpperCase();
    const max = Math.min(150, Math.max(20, Number(url.searchParams.get("max") ?? "100")));

    const key = JSON.stringify({ topic, country, max });
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return new Response(JSON.stringify(hit.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      });
    }

    let feeds = FEEDS;
    if (topic) feeds = feeds.filter((f) => f.topic === topic);
    if (country) feeds = feeds.filter((f) => !f.country || f.country === country);

    const all = (await Promise.all(feeds.map(fetchFeed))).flat();
    all.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const articles = all.slice(0, max);
    const payload = { articles, fetchedAt: Date.now() };
    cache.set(key, { ts: Date.now(), payload });
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ articles: [], fallback: true, error: msg }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
