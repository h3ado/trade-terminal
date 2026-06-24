// TV clips: Google News RSS scoped to youtube CNBC + Bloomberg.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Clip = {
  id: string; url: string; title: string;
  domain: string; seendate: string; embedId?: string;
};

const FEEDS = [
  "https://news.google.com/rss/search?q=site:youtube.com+(cnbc+OR+bloomberg+OR+%22yahoo+finance%22)+markets&hl=en-US&gl=US&ceid=US:en",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCrp_UI8XtuYfpiqluWLD7Lw", // CNBC
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdCLP7Lg", // Bloomberg Markets and Finance
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCWN3xxRkmTPmbKwht9FuE5A", // Yahoo Finance
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
function extractYoutubeId(url: string): string | undefined {
  const m = /[?&]v=([A-Za-z0-9_-]{6,})|youtu\.be\/([A-Za-z0-9_-]{6,})|\/videos\/([A-Za-z0-9_-]{6,})|yt:video:([A-Za-z0-9_-]{6,})/.exec(url);
  return m ? (m[1] || m[2] || m[3] || m[4]) : undefined;
}

async function fetchFeed(url: string): Promise<Clip[]> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return [];
    const xml = await r.text();
    const out: Clip[] = [];
    const re = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const block = m[2];
      const title = pickTag(block, "title");
      let link = pickTag(block, "link");
      if (!link) { const lm = /<link[^>]*href="([^"]+)"/i.exec(block); if (lm) link = lm[1]; }
      const id = pickTag(block, "yt:videoId") || extractYoutubeId(link);
      const pubDate = pickTag(block, "pubDate") || pickTag(block, "published") || pickTag(block, "updated") || new Date().toISOString();
      if (title && link) {
        out.push({
          id: id || link, url: link, title: title.slice(0, 200),
          domain: link.includes("youtube.com") ? "youtube.com" : "google-news",
          seendate: toGdeltDate(pubDate),
          embedId: id,
        });
      }
    }
    return out.slice(0, 20);
  } catch { return []; }
}

const TTL_MS = 4 * 60_000;
let cache: { ts: number; payload: unknown } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) return new Response(JSON.stringify(cache.payload), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=240" } });
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
    // dedup
    const seen = new Set<string>();
    const dedup = all.filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    dedup.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const payload = { clips: dedup.slice(0, 30), fetchedAt: Date.now() };
    cache = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=240" } });
  } catch (e) {
    return new Response(JSON.stringify({ clips: [], fallback: true, error: String((e as Error).message ?? e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
