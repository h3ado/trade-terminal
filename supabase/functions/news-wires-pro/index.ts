// Targeted Google News RSS proxy for paywalled wires (Reuters/Bloomberg/WSJ/FT).
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number; country: string;
  sourceCount?: number; tier: 1 | 2 | 3; topic?: string;
};

const SITES = [
  { domain: "reuters.com" },
  { domain: "bloomberg.com" },
  { domain: "wsj.com" },
  { domain: "ft.com" },
  { domain: "economist.com" },
  { domain: "barrons.com" },
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

async function fetchSite(domain: string, query?: string): Promise<Article[]> {
  const q = query ? `${query} site:${domain}` : `site:${domain}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + " when:1d")}&hl=en-US&gl=US&ceid=US:en`;
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
      out.push({
        id: link,
        url: link,
        title: title.slice(0, 280),
        domain,
        seendate: toGdeltDate(pub),
        language: "eng",
        tone: 0,
        country: "",
        sourceCount: 1,
        tier: 1,
        topic: "macro",
      });
    }
    return out.slice(0, 25);
  } catch { return []; }
}

const TTL_MS = 60_000;
const cache = new Map<string, { ts: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const max = Math.min(200, Math.max(20, Number(url.searchParams.get("max") ?? "120")));
    const key = `${q}|${max}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return new Response(JSON.stringify(hit.payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const results = await Promise.all(SITES.map(s => fetchSite(s.domain, q)));
    const all = results.flat().sort((a, b) => (a.seendate < b.seendate ? 1 : -1)).slice(0, max);
    const payload = { articles: all, fetchedAt: Date.now() };
    cache.set(key, { ts: Date.now(), payload });
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ articles: [], fallback: true, error: msg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
