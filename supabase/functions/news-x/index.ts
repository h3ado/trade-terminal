// X / Twitter (via Nitter RSS mirrors) + Truth Social RSS aggregator.
// Returns the same article shape as gdelt-news/news-wires for easy merge.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCount?: number;
  tier: 1 | 2 | 3; topic?: string;
};

const NITTER_MIRRORS = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.net",
];

const X_HANDLES = [
  "DeItaone", "FirstSquawk", "LiveSquawk", "unusual_whales",
  "zerohedge", "WSJmarkets", "business", "FT",
  "SoberLook", "LisaAbramowicz1", "biancoresearch", "elerianm",
];

const TRUTH_FEEDS = [
  { handle: "realDonaldTrump", url: "https://truthsocial.com/@realDonaldTrump.rss" },
];

const TOPIC_RULES: { re: RegExp; topic: string }[] = [
  { re: /\b(fed|fomc|powell|ecb|lagarde|boe|boj|rate hike|rate cut)\b/i, topic: "central-bank" },
  { re: /\b(earnings|guidance|revenue|eps|beats|misses|profit)\b/i, topic: "earnings" },
  { re: /\b(war|missile|sanction|invasion|tariff|coup|geopolit)\b/i, topic: "geopolitics" },
  { re: /\b(oil|opec|brent|wti|gas|lng|crude|natgas)\b/i, topic: "energy" },
  { re: /\b(bitcoin|btc|ethereum|eth|crypto|defi)\b/i, topic: "crypto" },
  { re: /\b(sec|cftc|doj|antitrust|lawsuit|fine|probe)\b/i, topic: "regulation" },
];
function classify(t: string) {
  for (const r of TOPIC_RULES) if (r.re.test(t)) return r.topic;
  return "macro";
}

function toGdeltDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}
function pickTag(xml: string, tag: string) {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
  if (!m) return "";
  return stripTags(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1"));
}
function parseRss(xml: string) {
  const out: { title: string; link: string; pubDate: string }[] = [];
  const re = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const block = m[2];
    const title = pickTag(block, "title");
    let link = pickTag(block, "link");
    if (!link) {
      const lm = /<link[^>]*href="([^"]+)"/i.exec(block);
      if (lm) link = lm[1];
    }
    const pubDate = pickTag(block, "pubDate") || pickTag(block, "updated") || pickTag(block, "published") || new Date().toISOString();
    if (title) out.push({ title, link: link || "", pubDate });
  }
  return out;
}

async function fetchWithMirrors(handle: string): Promise<Article[]> {
  for (const mirror of NITTER_MIRRORS) {
    try {
      const r = await fetch(`${mirror}/${handle}/rss`, {
        headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (!r.ok) continue;
      const xml = await r.text();
      const items = parseRss(xml).slice(0, 10);
      if (!items.length) continue;
      return items.map((it): Article => ({
        id: it.link || `x-${handle}-${it.pubDate}`,
        url: it.link || `https://x.com/${handle}`,
        title: it.title.slice(0, 280),
        domain: `@${handle}`,
        seendate: toGdeltDate(it.pubDate),
        language: "eng",
        tone: 0,
        country: "",
        sourceCount: 1,
        tier: 1,
        topic: classify(it.title),
      }));
    } catch { /* try next mirror */ }
  }
  return [];
}

async function fetchTruth(f: typeof TRUTH_FEEDS[number]): Promise<Article[]> {
  try {
    const r = await fetch(f.url, {
      headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items = parseRss(xml).slice(0, 10);
    return items.map((it): Article => ({
      id: it.link || `truth-${f.handle}-${it.pubDate}`,
      url: it.link || `https://truthsocial.com/@${f.handle}`,
      title: it.title.slice(0, 280),
      domain: `POTUS @${f.handle}`,
      seendate: toGdeltDate(it.pubDate),
      language: "eng",
      tone: 0,
      country: "US",
      sourceCount: 1,
      tier: 1,
      topic: "potus",
    }));
  } catch {
    return [];
  }
}

const TTL_MS = 30_000;
const cache = new Map<string, { ts: number; payload: unknown }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const only = (url.searchParams.get("only") || "").toLowerCase(); // "x" | "potus" | ""
    const max = Math.min(120, Math.max(20, Number(url.searchParams.get("max") ?? "80")));

    const key = JSON.stringify({ only, max });
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return new Response(JSON.stringify(hit.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
      });
    }

    const tasks: Promise<Article[]>[] = [];
    if (only !== "potus") for (const h of X_HANDLES) tasks.push(fetchWithMirrors(h));
    if (only !== "x") for (const f of TRUTH_FEEDS) tasks.push(fetchTruth(f));

    const settled = await Promise.allSettled(tasks);
    const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
    all.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const articles = all.slice(0, max);
    const payload = { articles, fetchedAt: Date.now() };
    cache.set(key, { ts: Date.now(), payload });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ articles: [], fallback: true, error: String((e as Error).message ?? e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
