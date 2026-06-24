import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';

export type NewsArticle = {
  id: string;
  url: string;
  title: string;
  domain: string;
  seendate: string;
  language: string;
  tone: number;
  country: string;
  sourceCountry?: string;
  image?: string;
  sources?: { url: string; domain: string }[];
  sourceCount?: number;
  tier?: 1 | 2 | 3;
  topic?: string;
  speaker?: string;
  print?: string; // numeric print extracted from headline (e.g. "-4.2Mbbl")
};

export type GeoEvent = {
  id: string; lat: number; lng: number; ts: number;
  event_type: string; headline: string; country: string;
  fatalities: number; source: string; url?: string;
};

export type ToneTick = { t: string; tone: number };

export type NewsScope = 'global' | 'country' | 'ticker' | 'keyword';

export interface NewsQuery {
  scope: NewsScope;
  value: string;
  timespan: '1h' | '6h' | '24h' | '72h' | '7d';
  tone: 'pos' | 'neg' | 'all';
  topic?: string; // optional topic filter (central-bank, earnings, energy, crypto, …)
}

export interface NewsResult {
  articles: NewsArticle[];
  toneSeries: ToneTick[];
  geoEvents: GeoEvent[];
  fetchedAt: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function ageMs(seendate: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(seendate);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return Date.now() - t;
}

export function useGdeltNews(q: NewsQuery, intervalMs = 60_000): NewsResult {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [toneSeries, setToneSeries] = useState<ToneTick[]>([]);
  const [geoEvents, setGeoEvents] = useState<GeoEvent[]>([]);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const fetchNow = async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.scope === 'country' && q.value) params.set('country', q.value);
      if ((q.scope === 'ticker' || q.scope === 'keyword') && q.value) params.set('keyword', q.value);
      params.set('timespan', q.timespan);
      params.set('tone', q.tone);

      const wireParams = new URLSearchParams();
      if (q.topic) wireParams.set('topic', q.topic);
      if (q.scope === 'country' && q.value) wireParams.set('country', q.value);

      type ArticleData = { articles?: NewsArticle[] };
      type GdeltData = { articles?: NewsArticle[]; toneSeries?: ToneTick[]; fetchedAt?: number };
      type GeoData = { articles?: NewsArticle[]; geoEvents?: GeoEvent[] };

      const safe = <T,>(p: Promise<T>): Promise<T | ArticleData> =>
        p.catch(() => ({ articles: [] } as ArticleData));

      const gdeltApiParams: Record<string, string> = {};
      params.forEach((v, k) => { gdeltApiParams[k] = v; });

      const wireApiParams: Record<string, string> = {};
      wireParams.forEach((v, k) => { wireApiParams[k] = v; });

      const earningsApiParams: Record<string, string> =
        q.scope === 'ticker' && q.value ? { ticker: q.value } : {};

      const [
        gdelt, wires, xs, fed, geo,
        sec, wirePro, congress, ratings, earnings,
        cbank, geopol, cmdty, crypto, alt, legal,
      ] = await Promise.all([
        apiGet<GdeltData>('/api/market/news/gdelt', gdeltApiParams),
        safe(apiGet<ArticleData>('/api/market/news/wires', wireApiParams)),
        safe(apiGet<ArticleData>('/api/market/news/x')),
        safe(apiGet<ArticleData>('/api/market/news/fed')),
        safe(apiGet<GeoData>('/api/market/news/energy-geo')),
        safe(apiGet<ArticleData>('/api/market/news/sec')),
        safe(apiGet<ArticleData>('/api/market/news/wires-pro')),
        safe(apiGet<ArticleData>('/api/market/news/congress')),
        safe(apiGet<ArticleData>('/api/market/news/ratings')),
        safe(apiGet<ArticleData>('/api/market/news/earnings', earningsApiParams)),
        safe(apiGet<ArticleData>('/api/market/news/cbank-speeches')),
        safe(apiGet<ArticleData>('/api/market/news/geopolitics')),
        safe(apiGet<ArticleData>('/api/market/news/commodities')),
        safe(apiGet<ArticleData>('/api/market/news/crypto')),
        safe(apiGet<ArticleData>('/api/market/news/altdata')),
        safe(apiGet<ArticleData>('/api/market/news/legal')),
      ]);
      if (id !== reqId.current) return;

      const filterByQuery = (arr: NewsArticle[]) => arr.filter((w) => {
        if ((q.scope === 'ticker' || q.scope === 'keyword') && q.value) {
          return w.title.toUpperCase().includes(q.value.toUpperCase());
        }
        if (q.scope === 'country' && q.value) {
          return !w.country || w.country.toUpperCase() === q.value.toUpperCase();
        }
        return true;
      });
      const filterByTopic = (arr: NewsArticle[]) =>
        q.topic ? arr.filter((a) => a.topic === q.topic || (q.topic === 'geopolitics' && a.topic === 'potus')) : arr;

      const extra = filterByTopic(filterByQuery([
        ...(wires.articles ?? []),
        ...(xs.articles ?? []),
        ...(fed.articles ?? []),
        ...(geo.articles ?? []),
        ...(sec.articles ?? []),
        ...(wirePro.articles ?? []),
        ...(congress.articles ?? []),
        ...(ratings.articles ?? []),
        ...(earnings.articles ?? []),
        ...(cbank.articles ?? []),
        ...(geopol.articles ?? []),
        ...(cmdty.articles ?? []),
        ...(crypto.articles ?? []),
        ...(alt.articles ?? []),
        ...(legal.articles ?? []),
      ]));

      const merged: NewsArticle[] = [...extra, ...(gdelt.articles ?? [])];
      // Dedup by URL
      const seen = new Set<string>();
      const dedup = merged.filter((a) => {
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
      });
      // Sort: tier asc (1 first), then recency
      dedup.sort((a, b) => {
        const ta = a.tier ?? 2, tb = b.tier ?? 2;
        if (ta !== tb) return ta - tb;
        return ageMs(a.seendate) - ageMs(b.seendate);
      });

      setArticles(dedup);
      setToneSeries(gdelt.toneSeries ?? []);
      setGeoEvents(geo.geoEvents ?? []);
      setFetchedAt(gdelt.fetchedAt ?? Date.now());
    } catch (e: unknown) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNow();
    const t = setInterval(fetchNow, intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.scope, q.value, q.timespan, q.tone, q.topic, intervalMs]);

  return { articles, toneSeries, geoEvents, fetchedAt, loading, error, refetch: fetchNow };
}
