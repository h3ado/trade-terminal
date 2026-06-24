import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type LiveFire = {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  frp: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  daynight: string;
  bin: '24h';
};

const REFRESH_MS = 15 * 60_000; // 15 minutes

export function useLiveFires() {
  const [fires, setFires] = useState<LiveFire[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ fires?: LiveFire[] }>('/api/market/events/nasa-fires');
        if (cancelled) return;
        setFires((data?.fires ?? []) as LiveFire[]);
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

  return { fires, loading, error };
}
