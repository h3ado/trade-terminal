import { useState } from 'react';
import { apiPost } from '@/lib/api';
import type { NewsArticle, NewsScope } from './useGdeltNews';

export interface NewsBrief {
  brief: string;
  citations: string[];
  riskScore: number | null;
}

export function useNewsBrief() {
  const [data, setData] = useState<NewsBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (scope: NewsScope | 'cluster', value: string, headlines: NewsArticle[]) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await apiPost<NewsBrief>('/api/market/news/ai-brief', {
        scope,
        value,
        headlines: headlines.slice(0, 30).map((h) => ({
          title: h.title,
          url: h.url,
          domain: h.domain,
          seendate: h.seendate,
          tone: h.tone,
        })),
      });
      setData(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Brief failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setData(null); setError(null); };

  return { data, loading, error, generate, reset };
}
