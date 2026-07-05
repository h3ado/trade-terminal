import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { NewsArticle } from './useGdeltNews';

const TTL = 3 * 60_000;
let cache: { ts: number; articles: NewsArticle[] } | null = null;

/** Lightweight wire-only news fetch for the global news ribbon (3-min polling). */
export function useNewsHeadlines(): NewsArticle[] {
  const [articles, setArticles] = useState<NewsArticle[]>(cache?.articles ?? []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cache && Date.now() - cache.ts < TTL) {
        setArticles(cache.articles);
        return;
      }
      try {
        const data = await apiGet<{ articles?: NewsArticle[] }>('/api/market/news/wires');
        const rows = data?.articles ?? [];
        cache = { ts: Date.now(), articles: rows };
        if (!cancelled) setArticles(rows);
      } catch { /* silent — ribbon degrades gracefully */ }
    };
    load();
    const id = setInterval(load, TTL);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return articles;
}
