/** Live lightning strikes (Blitzortung relay, last 30 min). Polls every 30s. */
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type LightningStrike = { id: string; lat: number; lng: number; ageS: number };

const REFRESH_MS = 30_000;

export function useLiveLightning(enabled: boolean) {
  const [strikes, setStrikes] = useState<LightningStrike[]>([]);
  const [source, setSource] = useState<'blitzortung' | 'synthetic' | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ strikes?: LightningStrike[]; source?: 'blitzortung' | 'synthetic' }>('/api/market/events/lightning-strikes');
        if (cancelled) return;
        setStrikes((data?.strikes ?? []) as LightningStrike[]);
        setSource(data?.source ?? null);
        setLive(data?.source === 'blitzortung');
      } catch {
        if (!cancelled) setLive(false);
      }
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled]);

  return { strikes, source, live };
}
