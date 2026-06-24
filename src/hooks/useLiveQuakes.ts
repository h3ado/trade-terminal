import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type LiveQuake = {
  id: string;
  lat: number;
  lng: number;
  mag: number;
  depthKm: number;
  age: number; // hours
  region?: string;
  url?: string;
  tsunami?: boolean;
};

const REFRESH_MS = 5 * 60_000; // 5 minutes

export function useLiveQuakes() {
  const [quakes, setQuakes] = useState<LiveQuake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ quakes?: LiveQuake[] }>('/api/market/events/usgs-quakes');
        if (cancelled) return;
        setQuakes((data?.quakes ?? []) as LiveQuake[]);
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { quakes, loading, error };
}
