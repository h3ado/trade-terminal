/** OpenAQ live PM2.5 stations. Refreshed every 10 min. */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type AirStation = {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  pm25: number;
  unit: string;
  updatedAt: string | null;
  category: string;
  hue: number;
};

const REFRESH_MS = 10 * 60_000;

export function useLiveAirQuality(enabled: boolean) {
  const [stations, setStations] = useState<AirStation[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ stations?: AirStation[] }>('/api/market/events/openaq-air');
        if (cancelled) return;
        const next = (data?.stations ?? []) as AirStation[];
        setStations(next);
        setLive(next.length > 0);
        setError(null);
      } catch (e: any) {
        if (!cancelled) { setError(String(e?.message ?? e)); setLive(false); }
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled]);

  return { stations, live, error };
}
