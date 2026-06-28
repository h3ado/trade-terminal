import { Router } from 'express';
import prisma from '../../lib/prisma';
import { verifyJwt, AuthRequest } from '../../middleware/auth';

const router = Router();

// ─── Shared helpers ───────────────────────────────────────────────────────────

function makeCache<T>(ttlMs: number) {
  const store = new Map<string, { ts: number; data: T }>();
  return {
    get: (key: string) => { const e = store.get(key); return e && Date.now() - e.ts < ttlMs ? e.data : null; },
    set: (key: string, data: T) => { store.set(key, { ts: Date.now(), data }); return data; },
  };
}

async function callAI(messages: { role: string; content: string }[], model = 'claude-sonnet-4-6', jsonMode = false): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const body: any = {
    model,
    max_tokens: 1024,
    messages,
  };
  if (jsonMode) {
    // Prepend system instruction to return JSON
    const sys = messages.find(m => m.role === 'system');
    if (sys) sys.content = sys.content + '\n\nRespond with valid JSON only.';
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (r.status === 429) throw Object.assign(new Error('rate_limit'), { status: 429 });
  if (!r.ok) throw new Error(`anthropic ${r.status}`);
  const j = await r.json() as any;
  return j?.content?.[0]?.text ?? '';
}

// ─── GDELT news ───────────────────────────────────────────────────────────────

const COUNTRY_NAME: Record<string, string> = {
  US: 'United States', UK: 'United Kingdom', EU: 'European Union', JP: 'Japan',
  CN: 'China', DE: 'Germany', FR: 'France', CA: 'Canada', AU: 'Australia',
  IN: 'India', BR: 'Brazil', KR: 'South Korea', MX: 'Mexico', CH: 'Switzerland',
  RU: 'Russia', IL: 'Israel', IR: 'Iran', SA: 'Saudi Arabia', TR: 'Turkey',
};

const TIER1 = new Set(['reuters.com','ft.com','wsj.com','bloomberg.com','cnbc.com','bbc.com','bbc.co.uk','nytimes.com','economist.com','apnews.com','federalreserve.gov','ecb.europa.eu','bankofengland.co.uk','boj.or.jp','sec.gov']);
const TOPIC_RULES = [
  { re: /\b(fed|fomc|powell|ecb|lagarde|boe|boj|rate hike|rate cut|policy)\b/i, topic: 'central-bank' },
  { re: /\b(earnings|guidance|revenue|eps|beats|misses|profit)\b/i, topic: 'earnings' },
  { re: /\b(war|missile|sanction|invasion|election|coup|tariff|trade war)\b/i, topic: 'geopolitics' },
  { re: /\b(oil|opec|brent|wti|gas|lng|crude)\b/i, topic: 'energy' },
  { re: /\b(bitcoin|btc|ethereum|eth|crypto|defi)\b/i, topic: 'crypto' },
  { re: /\b(sec|cftc|doj|antitrust|regulator|lawsuit|fine|probe)\b/i, topic: 'regulation' },
];

const STOP = new Set(['this','that','with','from','have','been','will','they','what','when','which','their','into','then','than','more','also','such','other','over','after','about','most','some','there']);

function classifyTopic(title: string) { for (const r of TOPIC_RULES) if (r.re.test(title)) return r.topic; return 'macro'; }
function tierOf(domain: string): 1 | 2 | 3 { return TIER1.has(domain) ? 1 : /\.(gov|edu)$/.test(domain) ? 1 : 2; }
function timespanParam(t: string) { return ({ '1h': '1h', '6h': '6h', '24h': '1d', '72h': '3d', '7d': '1w' } as any)[t] ?? '1d'; }

function clusterKey(title: string) {
  const tokens = title.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
  return tokens.slice(0, 5).sort().join('|');
}

function buildGdeltQuery({ country, keyword, tone }: { country?: string; keyword?: string; tone?: string }) {
  const parts: string[] = [];
  if (keyword?.trim()) parts.push(`(${keyword.trim()})`);
  else parts.push('(market OR economy OR central bank OR oil OR inflation OR rates OR earnings OR geopolitics)');
  if (country) { const name = COUNTRY_NAME[country.toUpperCase()]; if (name) parts.push(`sourcecountry:"${name}"`); }
  if (tone === 'pos') parts.push('tone>3'); else if (tone === 'neg') parts.push('tone<-3');
  return parts.join(' ');
}

const gdeltCache = makeCache<unknown>(60_000);

router.get('/gdelt', async (req, res) => {
  const { country, keyword, timespan = '24h', tone = 'all', mode = 'artlist', max = '75' } = req.query as Record<string, string>;
  const opts = { country, keyword, timespan, tone, mode, max: Math.min(parseInt(max) || 75, 75) };
  const cacheKey = JSON.stringify(opts);
  const hit = gdeltCache.get(cacheKey);
  if (hit) { res.json(hit); return; }
  try {
    const query = buildGdeltQuery(opts);
    const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    url.searchParams.set('query', query);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('format', 'JSON');
    url.searchParams.set('timespan', timespanParam(timespan));
    url.searchParams.set('maxrecords', String(opts.max));
    url.searchParams.set('sort', 'DateDesc');
    url.searchParams.set('trans', 'googtrans');
    const r = await fetch(url.toString(), { headers: { 'User-Agent': 'Mozilla/5.0 trade-terminal/1.0' } });
    if (!r.ok) throw new Error(`GDELT ${r.status}`);
    const j = await r.json() as any;
    const articles = (j?.articles ?? []).map((a: any) => ({
      id: a.url, url: a.url, title: a.title, domain: a.domain,
      seendate: a.seendate, language: a.language ?? 'English',
      tone: a.tone ?? 0, country: a.sourcecountry ?? '',
      tier: tierOf(a.domain), topic: classifyTopic(a.title),
    }));
    const buckets = new Map<string, any[]>();
    for (const a of articles) { const k = clusterKey(a.title) || a.id; const l = buckets.get(k); if (l) l.push(a); else buckets.set(k, [a]); }
    const clustered: any[] = [];
    for (const list of buckets.values()) {
      list.sort((a: any, b: any) => a.seendate < b.seendate ? 1 : -1);
      const head = { ...list[0], sourceCount: list.length, sources: list.map((x: any) => ({ url: x.url, domain: x.domain })), tone: list.reduce((s: number, x: any) => s + x.tone, 0) / list.length };
      clustered.push(head);
    }
    clustered.sort((a, b) => a.seendate < b.seendate ? 1 : -1);
    const payload = { articles: clustered, fetchedAt: Date.now(), query: opts };
    gdeltCache.set(cacheKey, payload);
    res.json(payload);
  } catch (e) { res.json({ articles: [], fetchedAt: Date.now(), fallback: true, error: String(e) }); }
});

// ─── RSS news wires ───────────────────────────────────────────────────────────

const FEEDS = [
  { url: 'https://feeds.reuters.com/reuters/businessNews', domain: 'reuters.com', tier: 1, topic: 'macro' },
  { url: 'https://feeds.reuters.com/reuters/marketsNews', domain: 'reuters.com', tier: 1, topic: 'macro' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', domain: 'cnbc.com', tier: 1, topic: 'macro' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', domain: 'bbc.com', tier: 1, topic: 'macro' },
  { url: 'https://www.federalreserve.gov/feeds/press_all.xml', domain: 'federalreserve.gov', tier: 1, topic: 'central-bank', country: 'US' },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', domain: 'coindesk.com', tier: 2, topic: 'crypto' },
  // Expanded feeds
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/', domain: 'marketwatch.com', tier: 2, topic: '' },
  { url: 'https://www.theguardian.com/uk/business/rss', domain: 'theguardian.com', tier: 2, topic: '' },
  { url: 'https://www.kitco.com/rss/news/kitco-news.rss', domain: 'kitco.com', tier: 2, topic: 'energy' },
  { url: 'https://oilprice.com/rss/main', domain: 'oilprice.com', tier: 2, topic: 'energy' },
  { url: 'https://finance.yahoo.com/news/rssindex', domain: 'finance.yahoo.com', tier: 2, topic: '' },
];

function stripTags(s: string) { return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim(); }
function pickTag(xml: string, tag: string) { const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(xml); return m ? stripTags(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1')) : ''; }
function parseRss(xml: string) {
  const items: { title: string; link: string; pubDate: string }[] = [];
  const itemRe = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[2];
    const title = pickTag(block, 'title');
    let link = pickTag(block, 'link');
    if (!link) { const lm = /<link[^>]*href="([^"]+)"/i.exec(block); if (lm) link = lm[1]; }
    const pubDate = pickTag(block, 'pubDate') || pickTag(block, 'updated') || new Date().toISOString();
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

const wiresCache = makeCache<unknown>(120_000);

router.get('/wires', async (_req, res) => {
  const hit = wiresCache.get('all');
  if (hit) { res.json(hit); return; }
  const results = await Promise.allSettled(FEEDS.map(async feed => {
    const r = await fetch(feed.url, { headers: { 'User-Agent': 'trade-terminal/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`${feed.domain} ${r.status}`);
    const xml = await r.text();
    return parseRss(xml).slice(0, 20).map(item => ({ id: item.link, url: item.link, title: item.title, domain: feed.domain, seendate: new Date(item.pubDate).toISOString(), language: 'English', tone: 0, country: (feed as any).country ?? '', tier: feed.tier, topic: (feed as any).topic ?? classifyTopic(item.title) }));
  }));
  const articles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  articles.sort((a, b) => a.seendate < b.seendate ? 1 : -1);
  const data = { articles, fetchedAt: Date.now() };
  wiresCache.set('all', data);
  res.json(data);
});

// ─── AI-powered news brief ───────────────────────────────────────────────────

const BRIEF_SYSTEM = `You are a Bloomberg-desk macro analyst. Given a cluster of news headlines, produce:
1) A 5-bullet brief, each bullet <=22 words, fact-only, no fluff.
2) "Market angle:" one line on what this means for traders (assets, regions, sectors).
3) "Risk:" a single integer 0-10 (10 = systemic).
Use Markdown. Cite domains in parentheses, not URLs. Never invent facts beyond the supplied headlines.`;

router.post('/ai-brief', verifyJwt, async (req: AuthRequest, res) => {
  const { scope, value = '', headlines = [] } = req.body as { scope: string; value?: string; headlines?: any[] };
  if (!headlines.length) { res.status(400).json({ error: 'no_headlines' }); return; }
  try {
    // Rate limit: 10 briefs / hour / user
    const since = new Date(Date.now() - 3600_000);
    const count = await prisma.newsBriefLog.count({ where: { userId: req.userId, createdAt: { gte: since } } });
    if (count >= 10) { res.status(429).json({ error: 'rate_limit', message: '10 briefs/hour limit reached' }); return; }

    const text = headlines.slice(0, 40).map((h: any, i: number) => `${i + 1}. [${h.domain ?? '?'}] ${h.title}`).join('\n');
    const answer = await callAI([{ role: 'user', content: `Scope: ${scope}${value ? ` (${value})` : ''}\n\nHeadlines:\n${text}` }].map(m => ({ ...m })).concat([{ role: 'system', content: BRIEF_SYSTEM }] as any).reverse());

    await prisma.newsBriefLog.create({ data: { userId: req.userId!, scope, value } });
    res.json({ brief: answer, scope, value });
  } catch (e: any) { res.status(e.status ?? 502).json({ error: String(e.message ?? e) }); }
});

// ─── AI thesis ───────────────────────────────────────────────────────────────

const THESIS_SYSTEM = `You are a senior macro PM. Output STRICT JSON. Schema:
{"stance":"bullish"|"bearish"|"neutral","conviction":integer 0-100,"key_drivers":string[],"counter_drivers":string[],"catalysts_next_7d":string[],"suggested_trades":string[],"summary":string}`;

router.post('/thesis', verifyJwt, async (req: AuthRequest, res) => {
  const { scope, value = '', headlines = [], cot } = req.body as any;
  const scopeKey = `${scope}:${value || '_'}`;
  try {
    const cached = await prisma.newsThesisCache.findUnique({ where: { scopeKey } });
    if (cached && Date.now() - new Date(cached.generatedAt).getTime() < 15 * 60_000) {
      res.json({ ...(cached.payload as any), cached: true }); return;
    }
    const text = headlines.slice(0, 50).map((h: any, i: number) => `${i + 1}. [${h.domain ?? '?'}] ${h.title}`).join('\n');
    const cotText = cot ? `\n\nCOT context:\n${JSON.stringify(cot).slice(0, 800)}` : '';
    const content = await callAI([{ role: 'system', content: THESIS_SYSTEM }, { role: 'user', content: `Scope: ${scope}${value ? ` (${value})` : ''}\n\nHeadlines:\n${text}${cotText}` }], 'claude-sonnet-4-6', true);
    let thesis: unknown;
    try { thesis = JSON.parse(content); } catch { thesis = { error: 'parse_failed', raw: content }; }
    await prisma.newsThesisCache.upsert({ where: { scopeKey }, update: { payload: thesis as any, generatedAt: new Date() }, create: { scopeKey, payload: thesis as any } });
    res.json(thesis);
  } catch (e: any) { res.status(e.status ?? 502).json({ error: String(e.message ?? e) }); }
});

// ─── AI Q&A ───────────────────────────────────────────────────────────────────

router.post('/qa', verifyJwt, async (req: AuthRequest, res) => {
  const { question, headline, context = [], history = [] } = req.body as any;
  if (!question || !headline) { res.status(400).json({ error: 'question and headline required' }); return; }
  const system = 'You are a sell-side analyst answering trader questions about a specific headline. Be concise (<= 120 words), factual. If unsure, say so.';
  const ctx = context.length ? `\n\nRelated:\n${context.slice(0, 15).map((c: any, i: number) => `${i + 1}. [${c.domain ?? '?'}] ${c.title}`).join('\n')}` : '';
  const userPrompt = `Headline: [${headline.domain ?? '?'}] ${headline.title}${ctx}\n\nQuestion: ${question}`;
  try {
    const messages = [{ role: 'system', content: system }, ...history.map((h: any) => ({ role: h.role, content: h.content })), { role: 'user', content: userPrompt }];
    const answer = await callAI(messages);
    await prisma.newsQaLog.create({ data: { userId: req.userId!, headlineUrl: headline.url ?? '', question, answer } });
    res.json({ answer });
  } catch (e: any) { res.status(e.status ?? 502).json({ error: String(e.message ?? e) }); }
});

// ─── Daily wrap ───────────────────────────────────────────────────────────────

const WRAP_SYSTEM = `You are a Bloomberg desk closer. Produce a 6-bullet end-of-day market wrap.
Output STRICT JSON: {"headline":string,"bullets":[{"label":"MOVERS"|"DATA"|"GEOPOL"|"CB"|"ENERGY"|"TOMORROW","text":string}],"tomorrow_catalysts":string[]}
Each bullet text <= 30 words. Be specific (numbers, tickers).`;

router.get('/wrap', async (_req, res) => {
  const wraps = await prisma.newsDailyWrap.findMany({ orderBy: { wrapDate: 'desc' }, take: 7 });
  res.json({ wraps });
});

router.post('/wrap', verifyJwt, async (_req: AuthRequest, res) => {
  const { headlines = [], force = false } = _req.body as any;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  try {
    if (!force) {
      const existing = await prisma.newsDailyWrap.findUnique({ where: { wrapDate: today } });
      if (existing) { res.json(existing); return; }
    }
    if (!headlines.length) { res.status(400).json({ error: 'no_headlines' }); return; }
    const text = headlines.slice(0, 100).map((h: any, i: number) => `${i + 1}. [${h.domain ?? '?'}] ${h.title}`).join('\n');
    const content = await callAI([{ role: 'system', content: WRAP_SYSTEM }, { role: 'user', content: `Today: ${today.toISOString().slice(0, 10)}\n\nHeadlines:\n${text}` }], 'claude-sonnet-4-6', true);
    let summary: unknown;
    try { summary = JSON.parse(content); } catch { summary = {}; }
    const row = await prisma.newsDailyWrap.upsert({ where: { wrapDate: today }, update: { summary: summary as any, generatedAt: new Date() }, create: { wrapDate: today, summary: summary as any } });
    res.json(row);
  } catch (e: any) { res.status(e.status ?? 502).json({ error: String(e.message ?? e) }); }
});

// ─── Deep search (Perplexity) ────────────────────────────────────────────────

router.post('/deepsearch', verifyJwt, async (_req: AuthRequest, res) => {
  const { query, recency = 'day' } = _req.body as { query: string; recency?: string };
  if (!query) { res.status(400).json({ error: 'query required' }); return; }
  const pkey = process.env.PERPLEXITY_API_KEY;
  if (!pkey) { res.status(503).json({ error: 'PERPLEXITY_API_KEY not configured' }); return; }
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pkey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'sonar-pro', messages: [{ role: 'system', content: 'You are a markets research analyst. Be concise, factual, cite all claims. Use bullet points.' }, { role: 'user', content: query }], search_recency_filter: recency }),
    });
    if (!r.ok) { res.status(502).json({ error: `perplexity ${r.status}` }); return; }
    const j = await r.json() as any;
    res.json({ answer: j?.choices?.[0]?.message?.content ?? '', citations: j?.citations ?? [] });
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

// ─── Quiz ────────────────────────────────────────────────────────────────────

const QUIZ_SYSTEM = `Generate a 5-question multiple-choice quiz about this week's market events.
Return STRICT JSON: {"questions":[{"q":string,"opts":string[],"answer":number,"explanation":string}]}
Each question has 4 options. answer is the 0-based index of the correct option.`;

router.get('/quiz', async (req, res) => {
  const now = new Date(); now.setUTCHours(0, 0, 0, 0);
  const day = now.getUTCDay();
  const weekStart = new Date(now.getTime() - day * 86400_000);
  try {
    const cached = await prisma.quizCache.findUnique({ where: { weekStart } });
    if (cached) { res.json(cached.payload); return; }
    res.status(404).json({ error: 'no_quiz', message: 'Quiz not yet generated for this week' });
  } catch (e) { res.status(502).json({ error: String(e) }); }
});

router.post('/quiz/generate', verifyJwt, async (_req: AuthRequest, res) => {
  const { headlines = [] } = _req.body as any;
  if (!headlines.length) { res.status(400).json({ error: 'headlines required' }); return; }
  const now = new Date(); now.setUTCHours(0, 0, 0, 0);
  const day = now.getUTCDay();
  const weekStart = new Date(now.getTime() - day * 86400_000);
  try {
    const text = headlines.slice(0, 60).map((h: any, i: number) => `${i + 1}. [${h.domain ?? '?'}] ${h.title}`).join('\n');
    const content = await callAI([{ role: 'system', content: QUIZ_SYSTEM }, { role: 'user', content: `Week of ${weekStart.toISOString().slice(0, 10)}\n\nHeadlines:\n${text}` }], 'claude-sonnet-4-6', true);
    let payload: unknown;
    try { payload = JSON.parse(content); } catch { payload = { error: 'parse_failed' }; }
    await prisma.quizCache.upsert({ where: { weekStart }, update: { payload: payload as any, generatedAt: new Date() }, create: { weekStart, payload: payload as any } });
    res.json(payload);
  } catch (e: any) { res.status(502).json({ error: String(e.message ?? e) }); }
});

// ─── Contradictions ───────────────────────────────────────────────────────────

const CONTRA_SYSTEM = `You are a media bias detector. Find contradictory narratives across these headlines.
Return STRICT JSON: {"clusters":[{"entity":string,"summary":string,"stance_variance":number,"headline_urls":string[]}]}
Each cluster groups headlines that contradict each other about the same entity.`;

router.post('/contradictions', verifyJwt, async (_req: AuthRequest, res) => {
  const { headlines = [] } = _req.body as any;
  if (!headlines.length) { res.status(400).json({ error: 'no_headlines' }); return; }
  try {
    const text = headlines.slice(0, 60).map((h: any, i: number) => `${i + 1}. [${h.url ?? ''}] [${h.domain ?? '?'}] ${h.title}`).join('\n');
    const content = await callAI([{ role: 'system', content: CONTRA_SYSTEM }, { role: 'user', content: text }], 'claude-sonnet-4-6', true);
    let result: any;
    try { result = JSON.parse(content); } catch { result = { clusters: [] }; }
    for (const cluster of result.clusters ?? []) {
      await prisma.newsContradictionCluster.create({ data: { entity: cluster.entity, headlineUrls: cluster.headline_urls ?? [], stanceVariance: cluster.stance_variance ?? 0, summary: cluster.summary } });
    }
    res.json(result);
  } catch (e: any) { res.status(502).json({ error: String(e.message ?? e) }); }
});

// ─── SEC EDGAR real filings ───────────────────────────────────────────────────

const secCache = makeCache<unknown>(10 * 60_000);
router.get('/sec', async (req, res) => {
  const ticker = (req.query.ticker as string | undefined)?.toUpperCase().trim();
  const cacheKey = ticker ?? 'all';
  const hit = secCache.get(cacheKey);
  if (hit) { res.json(hit); return; }

  const EDGAR_FORMS = ['8-K', '10-Q', '10-K'];
  try {
    const results = await Promise.allSettled(EDGAR_FORMS.map(async (type) => {
      const url = ticker
        ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(ticker)}&type=${type}&dateb=&owner=include&count=20&search_text=&output=atom`
        : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${type}&dateb=&owner=include&count=40&search_text=&output=atom`;
      const r = await fetch(url, { headers: { 'User-Agent': 'trade-terminal/1.0 contact@tradeterm.local' }, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`EDGAR ${type} ${r.status}`);
      const xml = await r.text();
      return parseRss(xml).slice(0, 20).map(item => ({
        id: item.link, url: item.link,
        title: item.title.includes('(') ? item.title : `${item.title} (${type})`,
        domain: 'sec.gov', seendate: new Date(item.pubDate).toISOString(),
        language: 'English', tone: 0, country: 'US',
        tier: 1 as const, topic: 'regulation',
        formType: type,
      }));
    }));
    const seen = new Set<string>();
    const articles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []).filter(a => !seen.has(a.id) && seen.add(a.id));
    articles.sort((a, b) => a.seendate < b.seendate ? 1 : -1);
    const data = { articles, fetchedAt: Date.now() };
    secCache.set(cacheKey, data);
    res.json(data);
  } catch (e) { res.json({ articles: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Central bank speeches (real CB RSS feeds) ────────────────────────────────

const cbSpeechCache = makeCache<unknown>(30 * 60_000);
router.get('/cbank-speeches', async (_req, res) => {
  const hit = cbSpeechCache.get('all');
  if (hit) { res.json(hit); return; }
  const CB_FEEDS = [
    { url: 'https://www.federalreserve.gov/feeds/speeches.xml', domain: 'federalreserve.gov', country: 'US' },
    { url: 'https://www.ecb.europa.eu/rss/press.html', domain: 'ecb.europa.eu', country: 'EU' },
    { url: 'https://www.bankofengland.co.uk/news-and-publications/2024.rss', domain: 'bankofengland.co.uk', country: 'UK' },
    { url: 'https://www.boj.or.jp/en/rss/whatsnew.xml', domain: 'boj.or.jp', country: 'JP' },
  ];
  const results = await Promise.allSettled(CB_FEEDS.map(async feed => {
    const r = await fetch(feed.url, { headers: { 'User-Agent': 'trade-terminal/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`${feed.domain} ${r.status}`);
    const xml = await r.text();
    return parseRss(xml).slice(0, 10).map(item => ({
      id: item.link, url: item.link, title: item.title, domain: feed.domain,
      seendate: new Date(item.pubDate).toISOString(), language: 'English',
      tone: 0, country: feed.country, tier: 1 as const, topic: 'central-bank',
    }));
  }));
  const articles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  articles.sort((a, b) => a.seendate < b.seendate ? 1 : -1);
  const data = { articles, fetchedAt: Date.now() };
  cbSpeechCache.set('all', data);
  res.json(data);
});

// ─── Earnings news (Finnhub + GDELT) ─────────────────────────────────────────

const earningsCache = makeCache<unknown>(5 * 60_000);
router.get('/earnings', async (_req, res) => {
  const hit = earningsCache.get('all');
  if (hit) { res.json(hit); return; }
  const fhKey = process.env.FINNHUB_API_KEY;
  const EARNINGS_RE = /\bearnings|EPS|revenue|quarterly|guidance|beat|miss|forecast|outlook\b/i;
  try {
    const [fhResult, gdeltResult] = await Promise.allSettled([
      fhKey ? (async () => {
        const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${fhKey}`, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error(`Finnhub ${r.status}`);
        const j = await r.json() as any[];
        return j.filter((a: any) => EARNINGS_RE.test(a.headline ?? '')).slice(0, 25).map((a: any) => {
          let domain = 'finnhub.io';
          try { domain = new URL(a.url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
          return { id: a.url, url: a.url, title: a.headline, domain, image: a.image,
            seendate: new Date((a.datetime ?? Date.now() / 1000) * 1000).toISOString(),
            language: 'English', tone: 0, country: '', tier: tierOf(domain), topic: 'earnings' as const };
        });
      })() : Promise.resolve([] as any[]),
      (async () => {
        const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
        url.searchParams.set('query', 'earnings quarterly results revenue EPS guidance beat miss');
        url.searchParams.set('mode', 'artlist'); url.searchParams.set('format', 'JSON');
        url.searchParams.set('timespan', '1d'); url.searchParams.set('maxrecords', '30'); url.searchParams.set('sort', 'DateDesc');
        const r = await fetch(url.toString(), { headers: { 'User-Agent': 'trade-terminal/1.0' } });
        if (!r.ok) return [] as any[];
        const j = await r.json() as any;
        return (j?.articles ?? []).map((a: any) => ({ id: a.url, url: a.url, title: a.title, domain: a.domain,
          seendate: a.seendate, language: 'English', tone: a.tone ?? 0, tier: tierOf(a.domain), topic: 'earnings' as const }));
      })(),
    ]);
    const seen = new Set<string>();
    const articles = [fhResult, gdeltResult]
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(a => a.url && !seen.has(a.url) && seen.add(a.url));
    articles.sort((a, b) => a.seendate < b.seendate ? 1 : -1);
    const data = { articles: articles.slice(0, 50), fetchedAt: Date.now() };
    earningsCache.set('all', data);
    res.json(data);
  } catch (e) { res.json({ articles: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Reddit financial sentiment ───────────────────────────────────────────────

const redditCache = makeCache<unknown>(10 * 60_000);
router.get('/reddit', async (_req, res) => {
  const hit = redditCache.get('all');
  if (hit) { res.json(hit); return; }
  const SUBS = [
    { sub: 'wallstreetbets', limit: 20 },
    { sub: 'stocks', limit: 20 },
    { sub: 'investing', limit: 15 },
  ];
  try {
    const results = await Promise.allSettled(SUBS.map(async ({ sub, limit }) => {
      const r = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${limit}&raw_json=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`Reddit r/${sub} ${r.status}`);
      const j = await r.json() as any;
      return (j?.data?.children ?? [])
        .map((c: any) => c.data)
        .filter((p: any) => p.score > 100 && p.title)
        .map((p: any) => ({
          id: `https://reddit.com${p.permalink}`, url: `https://reddit.com${p.permalink}`,
          title: p.title, domain: 'reddit.com',
          seendate: new Date(p.created_utc * 1000).toISOString(),
          language: 'English',
          tone: (p.upvote_ratio ?? 0.7) >= 0.9 ? 2 : (p.upvote_ratio ?? 0.7) < 0.7 ? -2 : 0,
          country: '', tier: 3 as const, topic: classifyTopic(p.title),
          sourceCount: p.num_comments,
        }));
    }));
    const seen = new Set<string>();
    const articles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []).filter(a => !seen.has(a.id) && seen.add(a.id));
    articles.sort((a, b) => a.seendate < b.seendate ? 1 : -1);
    const data = { articles: articles.slice(0, 40), fetchedAt: Date.now() };
    redditCache.set('all', data);
    res.json(data);
  } catch (e) { res.json({ articles: [], fetchedAt: Date.now(), error: String(e) }); }
});

// ─── Stub routes for remaining news functions ────────────────────────────────

const SIMPLE_GDELT_STUBS = ['fed', 'energy-geo', 'wires-pro', 'congress', 'ratings', 'geopolitics', 'commodities', 'crypto', 'altdata', 'legal', 'calendar', 'x'];

for (const name of SIMPLE_GDELT_STUBS) {
  const cache = makeCache<unknown>(120_000);
  router.get(`/${name}`, async (req, res) => {
    const hit = cache.get('all');
    if (hit) { res.json(hit); return; }
    // Forward to GDELT with a relevant query
    const QUERIES: Record<string, string> = {
      fed: 'Federal Reserve OR FOMC OR Powell OR interest rates OR monetary policy',
      'energy-geo': 'oil OR energy OR OPEC OR natural gas geopolitics',
      'wires-pro': 'market news OR trading OR financial',
      congress: 'Congress OR Senate OR House OR legislation finance',
      ratings: 'credit rating OR Moody OR S&P OR Fitch downgrade',
      geopolitics: 'geopolitics OR war OR sanctions OR election OR coup',
      commodities: 'commodities OR gold OR silver OR copper OR wheat OR corn',
      crypto: 'bitcoin OR ethereum OR crypto OR blockchain OR DeFi',
      altdata: 'alternative data OR satellite OR credit card spending',
      legal: 'lawsuit OR settlement OR fine OR probe OR investigation',
      calendar: 'economic calendar OR release OR data report',
      x: 'market sentiment OR trader OR analyst',
    };
    try {
      const query = QUERIES[name] ?? 'market news';
      const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
      url.searchParams.set('query', query); url.searchParams.set('mode', 'artlist'); url.searchParams.set('format', 'JSON'); url.searchParams.set('timespan', '1d'); url.searchParams.set('maxrecords', '50'); url.searchParams.set('sort', 'DateDesc');
      const r = await fetch(url.toString(), { headers: { 'User-Agent': 'trade-terminal/1.0' } });
      const j = r.ok ? await r.json() as any : { articles: [] };
      const data = { articles: (j?.articles ?? []).map((a: any) => ({ id: a.url, url: a.url, title: a.title, domain: a.domain, seendate: a.seendate, language: 'English', tone: a.tone ?? 0, tier: tierOf(a.domain), topic: classifyTopic(a.title) })), fetchedAt: Date.now() };
      cache.set('all', data);
      res.json(data);
    } catch (e) { res.json({ articles: [], fetchedAt: Date.now(), error: String(e) }); }
  });
}

// TV clips stub
router.post('/tv-clips', verifyJwt, async (_req, res) => {
  res.json({ clips: [], fetchedAt: Date.now(), message: 'TV clips require GDELT TV API integration' });
});

export default router;
