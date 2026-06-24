// OPEC + IEA RSS + ACLED last-24h geocoded conflict events.
// Returns { articles, geoEvents, fetchedAt }.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCount?: number;
  tier: 1 | 2 | 3; topic?: string;
};
type GeoEvent = {
  id: string; lat: number; lng: number; ts: number;
  event_type: string; headline: string; country: string;
  fatalities: number; source: string; url?: string;
};

const FEEDS = [
  { url: "https://www.opec.org/opec_web/en/press_room/rss.xml", domain: "opec.org", topic: "energy" },
  { url: "https://www.iea.org/rss/news", domain: "iea.org", topic: "energy" },
];

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

async function fetchFeed(f: typeof FEEDS[number]): Promise<Article[]> {
  try {
    const r = await fetch(f.url, {
      headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRss(xml).slice(0, 25).map((it): Article => ({
      id: it.link,
      url: it.link,
      title: it.title.slice(0, 280),
      domain: f.domain,
      seendate: toGdeltDate(it.pubDate),
      language: "eng",
      tone: 0,
      country: "",
      sourceCount: 1,
      tier: 1,
      topic: f.topic,
    }));
  } catch { return []; }
}

let acledTok: { token: string; exp: number } | null = null;
async function getAcledToken(email: string, password: string): Promise<string> {
  if (acledTok && Date.now() < acledTok.exp) return acledTok.token;
  const body = new URLSearchParams();
  body.set("grant_type", "password");
  body.set("client_id", "acled");
  body.set("scope", "authenticated");
  body.set("username", email);
  body.set("password", password);
  const r = await fetch("https://acleddata.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "lovable-news/1.0" },
    body,
  });
  if (!r.ok) throw new Error(`acled auth ${r.status}`);
  const j = await r.json();
  const tok = String(j?.access_token ?? "");
  if (!tok) throw new Error("no acled token");
  acledTok = { token: tok, exp: Date.now() + Math.max(60, Number(j?.expires_in ?? 3600) - 60) * 1000 };
  return tok;
}

async function fetchAcled(): Promise<{ articles: Article[]; geoEvents: GeoEvent[] }> {
  const email = Deno.env.get("ACLED_EMAIL");
  const password = Deno.env.get("ACLED_PASSWORD");
  if (!email || !password) return { articles: [], geoEvents: [] };

  const today = new Date();
  const start = new Date(today.getTime() - 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = new URL("https://acleddata.com/api/acled/read");
  url.searchParams.set("_format", "json");
  url.searchParams.set("event_date", `${fmt(start)}|${fmt(today)}`);
  url.searchParams.set("event_date_where", "BETWEEN");
  url.searchParams.set("limit", "500");
  url.searchParams.set("fields", "event_id_cnty|event_date|event_type|sub_event_type|country|admin1|location|latitude|longitude|fatalities|notes|source|source_url");

  try {
    const tok = await getAcledToken(email, password);
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${tok}`, "User-Agent": "lovable-news/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return { articles: [], geoEvents: [] };
    const j = await r.json();
    const rows: any[] = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
    const articles: Article[] = [];
    const geoEvents: GeoEvent[] = [];
    for (const row of rows) {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const fat = Number(row.fatalities ?? 0) || 0;
      const evType = String(row.event_type ?? "Conflict");
      const ts = row.event_date ? Date.parse(`${row.event_date}T12:00:00Z`) : Date.now();
      const headline = `${evType} · ${row.country ?? ""}${row.location ? " — " + row.location : ""}${fat ? ` (${fat} killed)` : ""}`;
      const id = `acled-${row.event_id_cnty ?? `${lat},${lng},${ts}`}`;
      const src = String(row.source ?? "ACLED");
      const sourceUrl = row.source_url ? String(row.source_url) : undefined;

      // Only surface notable events as headlines (battle OR fatalities>=1)
      if (fat >= 1 || /battle|explosion|remote violence/i.test(evType)) {
        articles.push({
          id,
          url: sourceUrl || "https://acleddata.com",
          title: (String(row.notes ?? headline)).slice(0, 220),
          domain: "acled",
          seendate: new Date(ts).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "").slice(0, 15) + "Z",
          language: "eng",
          tone: -Math.min(10, fat / 3),
          country: String(row.country ?? ""),
          sourceCount: 1,
          tier: 1,
          topic: "geopolitics",
        });
      }

      geoEvents.push({
        id, lat, lng, ts,
        event_type: evType,
        headline,
        country: String(row.country ?? ""),
        fatalities: fat,
        source: src,
        url: sourceUrl,
      });
    }
    geoEvents.sort((a, b) => b.ts - a.ts);
    return { articles, geoEvents: geoEvents.slice(0, 300) };
  } catch {
    return { articles: [], geoEvents: [] };
  }
}

const TTL_MS = 5 * 60_000;
let cache: { ts: number; payload: unknown } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify(cache.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      });
    }
    const [feedResults, acled] = await Promise.all([
      Promise.allSettled(FEEDS.map(fetchFeed)),
      fetchAcled(),
    ]);
    const feedArticles = feedResults.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
    const articles = [...feedArticles, ...acled.articles];
    articles.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const payload = { articles: articles.slice(0, 120), geoEvents: acled.geoEvents, fetchedAt: Date.now() };
    cache = { ts: Date.now(), payload };
    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ articles: [], geoEvents: [], fallback: true, error: String((e as Error).message ?? e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
