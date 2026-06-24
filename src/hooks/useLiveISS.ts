/** Live ISS position. Polls every 5s when enabled. */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type ISSPosition = { lat: number; lng: number; ts: number };
export type Astronaut = { name: string; craft: string };

const REFRESH_MS = 5_000;

export function useLiveISS(enabled: boolean) {
  const [iss, setIss] = useState<ISSPosition | null>(null);
  const [crew, setCrew] = useState<Astronaut[]>([]);
  const [trail, setTrail] = useState<ISSPosition[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ iss?: ISSPosition; crew?: Astronaut[] }>('/api/market/events/iss-position');
        if (cancelled) return;
        const pos = data?.iss as ISSPosition | null;
        if (pos) {
          setIss(pos);
          setLive(true);
          setTrail(prev => {
            const next = [...prev, pos];
            return next.length > 60 ? next.slice(-60) : next;
          });
        }
        setCrew((data?.crew ?? []) as Astronaut[]);
      } catch {
        if (!cancelled) setLive(false);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled]);

  return { iss, crew, trail, live };
}
