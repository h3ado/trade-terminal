// Rating agencies + multilateral institutions: S&P, Moody's, Fitch, IMF, OECD, World Bank.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number; country: string;
  sourceCount?: number; tier: 1 | 2 | 3; topic?: string;
};

const FEEDS: { url: string; domain: string; topic: string }[] = [
  // Use Google News as a stable proxy (direct rating-agency RSS often gated).
  { url: "https://news.google.com/rss/search?q=%22S%26P+Global+Ratings%22+downgrade+OR+upgrade+when:7d&hl=en-US&gl=US&ceid=US:en", domain: "spglobal.com", topic: "ratings" },
  { url: "https://news.google.com/rss/search?q=%22Moody%27s%22+rating+action+when:7d&hl=en-US&gl=US&ceid=US:en", domain: "moodys.com", topic: "ratings" },
  { url: "https://news.google.com/rss/search?q=%22Fitch+Ratings%22+downgrade+OR+upgrade+when:7d&hl=en-US&gl=US&ceid=US:en", domain: "fitchratings.com", topic: "ratings" },
  { url: "https://www.imf.org/en/News/RSS?Language=ENG", domain: "imf.org", topic: "institutional" },
  { url: "https://www.oecd.org/newsroom/rss.xml", domain: "oecd.org", topic: "institutional" },
  { url: "https://www.worldbank.org/en/news/all.rss", domain: "worldbank.org", topic: "institutional" },
];

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
function pickAttr(b: string, t: string, a: string) {
  const m = new RegExp(`<${t}[^>]*\\s${a}="([^"]+)"`, "i").exec(b);
  return m ? m[1] : "";
}

async function fetchFeed(f: typeof FEEDS[number]): Promise<Article[]> {
  try {
    const r = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" } });
    if (!r.ok) return [];
    const xml = await r.text();
    const out: Article[] = [];
    const re = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const block = m[2];
      const title = pickTag(block, "title");
      let link = pickTag(block, "link");
      if (!link) link = pickAttr(block, "link", "href");
      const pub = pickTag(block, "pubDate") || pickTag(block, "updated") || pickTag(block, "published") || new Date().toISOString();
      if (!title || !link) continue;
      out.push({
        id: link,
        url: link,
        title: title.slice(0, 280),
        domain: f.domain,
        seendate: toGdeltDate(pub),
        language: "eng",
        tone: 0,
        country: "",
        sourceCount: 1,
        tier: 1,
        topic: f.topic,
      });
    }
    return out.slice(0, 25);
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
    const all = (await Promise.all(FEEDS.map(fetchFeed))).flat()
      .sort((a, b) => (a.seendate < b.seendate ? 1 : -1)).slice(0, 150);
    const payload = { articles: all, fetchedAt: Date.now() };
    cached = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ articles: [], fallback: true, error: msg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
