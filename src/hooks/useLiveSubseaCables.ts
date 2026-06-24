/**
 * Live subsea cable feed via the `subsea-cables` edge function.
 * Falls back to curated SUBSEA_CABLES if the upstream is unreachable.
 */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { SUBSEA_CABLES, type SubseaCable } from '@/components/globe/map2d/subseaCables';

const REFRESH_MS = 12 * 60 * 60_000; // 12 hours — cable map barely changes

export function useLiveSubseaCables() {
  const [cables, setCables] = useState<SubseaCable[]>(SUBSEA_CABLES);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ cables?: SubseaCable[] }>('/api/market/events/subsea-cables');
        if (cancelled) return;
        const next = (data?.cables ?? []) as SubseaCable[];
        if (next.length > 0) {
          setCables(next);
          setLive(true);
          setError(null);
        } else {
          throw new Error('empty feed');
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message ?? e));
          setLive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { cables, live, loading, error };
}
