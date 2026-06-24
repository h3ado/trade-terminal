// SEC EDGAR filings (8-K, 13F, 13D/G, S-1) via public Atom feeds.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCount?: number; tier: 1 | 2 | 3;
  topic?: string;
};

const FORMS: { code: string; label: string }[] = [
  { code: "8-K", label: "8-K" },
  { code: "13F-HR", label: "13F" },
  { code: "SC 13D", label: "13D" },
  { code: "SC 13G", label: "13G" },
  { code: "S-1", label: "S-1" },
  { code: "10-K", label: "10-K" },
  { code: "10-Q", label: "10-Q" },
];

const MATERIAL_8K = /(item\s*1\.0[1-3]|item\s*2\.0[1-6]|item\s*5\.0[1-3]|item\s*7\.01|item\s*8\.01)/i;

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
function pickAttr(block: string, tag: string, attr: string): string {
  const m = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"`, "i").exec(block);
  return m ? m[1] : "";
}
function pickTag(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  return m ? stripTags(m[1]) : "";
}

async function fetchForm(code: string, label: string): Promise<Article[]> {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(code)}&company=&dateb=&owner=include&count=40&output=atom`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "lovable-news-terminal contact@lovable.dev", Accept: "application/atom+xml" } });
    if (!r.ok) return [];
    const xml = await r.text();
    const out: Article[] = [];
    const re = /<entry\b[^>]*>([\s\S]*?)<\/entry>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const block = m[1];
      const title = pickTag(block, "title");
      const link = pickAttr(block, "link", "href");
      const updated = pickTag(block, "updated") || new Date().toISOString();
      if (!title || !link) continue;
      const isMaterial = label === "8-K" && MATERIAL_8K.test(title);
      out.push({
        id: link,
        url: link,
        title: `[${label}${isMaterial ? "★" : ""}] ${title.slice(0, 260)}`,
        domain: "sec.gov",
        seendate: toGdeltDate(updated),
        language: "eng",
        tone: 0,
        country: "US",
        sourceCount: 1,
        tier: 1,
        topic: "filings",
      });
    }
    return out;
  } catch { return []; }
}

const TTL_MS = 60_000;
const cache = new Map<string, { ts: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const formFilter = (url.searchParams.get("form") || "").toUpperCase();
    const max = Math.min(200, Math.max(20, Number(url.searchParams.get("max") ?? "120")));
    const key = `${formFilter}|${max}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return new Response(JSON.stringify(hit.payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const forms = formFilter ? FORMS.filter(f => f.label === formFilter || f.code === formFilter) : FORMS;
    const results = await Promise.all(forms.map(f => fetchForm(f.code, f.label)));
    const all = results.flat().sort((a, b) => (a.seendate < b.seendate ? 1 : -1)).slice(0, max);
    const payload = { articles: all, fetchedAt: Date.now() };
    cache.set(key, { ts: Date.now(), payload });
    return new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ articles: [], fallback: true, error: msg }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
