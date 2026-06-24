// GDELT DOC 2.0 news firehose for the NEWS terminal.
// Returns clustered articles + tone series. No API key required.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const COUNTRY_NAME: Record<string, string> = {
  US: "United States", UK: "United Kingdom", EU: "European Union", JP: "Japan",
  CN: "China", DE: "Germany", FR: "France", CA: "Canada", AU: "Australia",
  IN: "India", BR: "Brazil", KR: "South Korea", MX: "Mexico", CH: "Switzerland",
  RU: "Russia", IL: "Israel", IR: "Iran", SA: "Saudi Arabia", TR: "Turkey",
};

const QuerySchema = z.object({
  country: z.string().max(3).optional(),
  keyword: z.string().max(120).optional(),
  timespan: z.enum(["1h", "6h", "24h", "72h", "7d"]).default("24h"),
  tone: z.enum(["pos", "neg", "all"]).default("all"),
  mode: z.enum(["artlist", "tonechart", "timeline"]).default("artlist"),
  max: z.coerce.number().int().min(10).max(75).default(75),
});

type Article = {
  id: string; url: string; title: string; domain: string;
  seendate: string; language: string; tone: number;
  country: string; sourceCountry?: string; image?: string;
  sources?: { url: string; domain: string }[];
  sourceCount?: number;
  tier?: 1 | 2 | 3;
  topic?: string;
};

const TIER1_DOMAINS = new Set([
  "reuters.com","ft.com","wsj.com","bloomberg.com","cnbc.com","bbc.com","bbc.co.uk",
  "nytimes.com","economist.com","apnews.com","federalreserve.gov","ecb.europa.eu",
  "bankofengland.co.uk","boj.or.jp","sec.gov",
]);

const TOPIC_RULES: { re: RegExp; topic: string }[] = [
  { re: /\b(fed|fomc|powell|ecb|lagarde|boe|boj|rba|snb|rate hike|rate cut|policy)\b/i, topic: "central-bank" },
  { re: /\b(earnings|guidance|revenue|eps|beats|misses|profit)\b/i, topic: "earnings" },
  { re: /\b(war|missile|sanction|invasion|election|coup|tariff|trade war|geopolit)\b/i, topic: "geopolitics" },
  { re: /\b(oil|opec|brent|wti|gas|lng|crude|natgas)\b/i, topic: "energy" },
  { re: /\b(bitcoin|btc|ethereum|eth|crypto|defi|stablecoin)\b/i, topic: "crypto" },
  { re: /\b(sec|cftc|doj|antitrust|regulator|lawsuit|fine|probe)\b/i, topic: "regulation" },
];
function classifyTopic(title: string): string {
  for (const r of TOPIC_RULES) if (r.re.test(title)) return r.topic;
  return "macro";
}
function tierOf(domain: string): 1 | 2 | 3 {
  if (TIER1_DOMAINS.has(domain)) return 1;
  if (/\.(gov|edu)$/.test(domain)) return 1;
  return 2;
}

function timespanParam(t: string) {
  return ({ "1h": "1h", "6h": "6h", "24h": "1d", "72h": "3d", "7d": "1w" } as const)[t as "24h"] ?? "1d";
}

function buildQuery({ country, keyword, tone }: z.infer<typeof QuerySchema>) {
  const parts: string[] = [];
  if (keyword?.trim()) parts.push(`(${keyword.trim()})`);
  else parts.push("(market OR economy OR central bank OR oil OR inflation OR rates OR earnings OR geopolitics)");
  if (country) {
    const cc = country.toUpperCase();
    const name = COUNTRY_NAME[cc];
    if (name) parts.push(`sourcecountry:"${name}"`);
  }
  if (tone === "pos") parts.push("tone>3");
  else if (tone === "neg") parts.push("tone<-3");
  return parts.join(" ");
}

// Cheap title-similarity bucketing: lowercase + alpha-only, hash first 5 stem-ish tokens.
function clusterKey(title: string): string {
  const tokens = title.toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  return tokens.slice(0, 5).sort().join("|");
}
const STOP = new Set([
  "with","from","this","that","says","said","into","over","after","about","more","than",
  "have","will","what","when","where","amid","could","should","would","they","them","their",
  "been","being","while","also","just","like","only","near","year","week","month","today",
  "still","were","such","much","most","many","very","much","some","other","another",
]);

async function fetchArticles(opts: z.infer<typeof QuerySchema>): Promise<Article[]> {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", buildQuery(opts));
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "JSON");
  url.searchParams.set("maxrecords", String(opts.max));
  url.searchParams.set("timespan", timespanParam(opts.timespan));
  url.searchParams.set("sort", "DateDesc");

  const r = await fetch(url.toString(), { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" } });
  if (!r.ok) throw new Error(`gdelt artlist ${r.status}`);
  const j = await r.json().catch(() => ({}));
  const arr = Array.isArray(j.articles) ? j.articles : [];
  return arr.map((a: Record<string, unknown>): Article => {
    const title = String(a.title ?? "").trim();
    const domain = String(a.domain ?? "").trim();
    return {
      id: String(a.url ?? Math.random()),
      url: String(a.url ?? ""),
      title,
      domain,
      seendate: String(a.seendate ?? ""),
      language: String(a.language ?? ""),
      tone: Number(a.tone ?? 0) || 0,
      country: String(a.sourcecountry ?? ""),
      sourceCountry: String(a.sourcecountry ?? ""),
      image: typeof a.socialimage === "string" ? (a.socialimage as string) : undefined,
      tier: tierOf(domain),
      topic: classifyTopic(title),
    };
  }).filter((a) => a.title && a.url);
}

function clusterArticles(articles: Article[]): Article[] {
  const buckets = new Map<string, Article[]>();
  for (const a of articles) {
    const k = clusterKey(a.title) || a.id;
    const list = buckets.get(k);
    if (list) list.push(a); else buckets.set(k, [a]);
  }
  const out: Article[] = [];
  for (const list of buckets.values()) {
    list.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
    const head = list[0];
    head.sourceCount = list.length;
    head.sources = list.map((x) => ({ url: x.url, domain: x.domain }));
    // average tone across cluster
    head.tone = list.reduce((s, x) => s + x.tone, 0) / list.length;
    out.push(head);
  }
  out.sort((a, b) => (a.seendate < b.seendate ? 1 : -1));
  return out;
}

async function fetchToneTimeline(opts: z.infer<typeof QuerySchema>) {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", buildQuery(opts));
  url.searchParams.set("mode", "TimelineTone");
  url.searchParams.set("format", "JSON");
  url.searchParams.set("timespan", timespanParam(opts.timespan));
  const r = await fetch(url.toString(), { headers: { "User-Agent": "Mozilla/5.0 lovable-news/1.0" } });
  if (!r.ok) return [];
  const j = await r.json().catch(() => ({}));
  const series = j?.timeline?.[0]?.data ?? [];
  return series.map((p: Record<string, unknown>) => ({
    t: String(p.date ?? ""),
    tone: Number(p.value ?? 0) || 0,
  }));
}

// Tiny in-memory cache (60s) keyed by query.
const TTL_MS = 60_000;
const cache = new Map<string, { ts: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const parsed = QuerySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const opts = parsed.data;
    const key = JSON.stringify(opts);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      return new Response(JSON.stringify(hit.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      });
    }

    try {
      const [articles, toneSeries] = await Promise.all([
        fetchArticles(opts),
        fetchToneTimeline(opts).catch(() => []),
      ]);
      const clusters = clusterArticles(articles);
      const payload = { articles: clusters, toneSeries, fetchedAt: Date.now(), query: opts };
      cache.set(key, { ts: Date.now(), payload });
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      const rateLimited = /\b(429|5\d\d)\b/.test(msg);
      // Serve stale cache if available so the UI never goes blank.
      if (hit) {
        return new Response(
          JSON.stringify({ ...(hit.payload as object), stale: true, warning: msg }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          articles: [], toneSeries: [], fetchedAt: Date.now(), query: opts,
          fallback: true, error: rateLimited ? "GDELT_RATE_LIMITED" : msg,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return new Response(
      JSON.stringify({ articles: [], toneSeries: [], fallback: true, error: msg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
