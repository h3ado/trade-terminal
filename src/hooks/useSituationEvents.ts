/**
 * Unified situation event stream — merges ACLED conflict events, GDELT
 * geopolitical density, NASA EONET disasters, USGS quakes, and NASA fires
 * into a single normalized list with category + S1..S5 severity. Polled
 * every 15 s; consumers can diff against `prevIds` to animate new arrivals.
 */
import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useLiveGdelt } from './useLiveGdelt';
import { useLiveEonet } from './useLiveEonet';
import { useLiveQuakes } from './useLiveQuakes';
import { useLiveFires } from './useLiveFires';

export type SitCategory = 'conflict' | 'political' | 'disaster' | 'humanitarian' | 'economic';
export type SitSeverity = 1 | 2 | 3 | 4 | 5;

export type SitEvent = {
  id: string;
  source: 'acled' | 'gdelt' | 'eonet' | 'usgs' | 'nasa-fires';
  category: SitCategory;
  severity: SitSeverity;
  title: string;
  location: string;
  country?: string;
  lat: number;
  lng: number;
  ts: number;
  url?: string;
};

type AcledRaw = Omit<SitEvent, 'category'> & { category: 'conflict' };

const POLL_MS = 15_000;

function quakeSeverity(mag: number): SitSeverity {
  if (mag >= 7) return 5;
  if (mag >= 6) return 4;
  if (mag >= 5) return 3;
  if (mag >= 4) return 2;
  return 1;
}

function fireSeverity(frp: number): SitSeverity {
  if (frp >= 500) return 5;
  if (frp >= 200) return 4;
  if (frp >= 80) return 3;
  if (frp >= 25) return 2;
  return 1;
}

function eonetSeverity(category: string): SitSeverity {
  const c = category.toLowerCase();
  if (c.includes('volcano') || c.includes('severe')) return 4;
  if (c.includes('storm') || c.includes('cyclone')) return 4;
  if (c.includes('flood')) return 3;
  if (c.includes('drought')) return 2;
  return 2;
}

function gdeltSeverity(count: number): SitSeverity {
  if (count >= 30) return 5;
  if (count >= 15) return 4;
  if (count >= 8) return 3;
  if (count >= 3) return 2;
  return 1;
}

export function useSituationEvents() {
  const [acled, setAcled] = useState<AcledRaw[]>([]);
  const [acledErr, setAcledErr] = useState<string | null>(null);
  const { cells: gdeltCells } = useLiveGdelt();
  const { events: eonet } = useLiveEonet();
  const { quakes } = useLiveQuakes();
  const { fires } = useLiveFires();

  // Poll ACLED separately on the 15s heartbeat (server caches 30 min so
  // calls are cheap, and the diff animation looks live).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ events?: AcledRaw[] }>('/api/market/events/acled-events');
        if (cancelled) return;
        setAcled((data?.events ?? []) as AcledRaw[]);
        setAcledErr(null);
      } catch (e: any) {
        if (!cancelled) setAcledErr(String(e?.message ?? e));
      }
    };
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  // Same heartbeat: bump a tick state to force re-merge so age-based filters
  // (like 6H / 24H windows) update without waiting on slower upstream caches.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick(t => t + 1), POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  const events = useMemo<SitEvent[]>(() => {
    void tick;
    const out: SitEvent[] = [];

    for (const e of acled) {
      out.push({ ...e, category: 'conflict' });
    }

    for (const c of gdeltCells) {
      // Each cell is "country-level political news pulse". We only emit
      // the cell as a single event so the feed isn't drowned.
      const sev = gdeltSeverity(c.count);
      const title = c.sample[0] ?? `${c.count} headlines`;
      out.push({
        id: `gdelt-${c.lng},${c.lat}`,
        source: 'gdelt',
        category: 'political',
        severity: sev,
        title,
        location: (c as any).country ?? `${c.lat.toFixed(0)},${c.lng.toFixed(0)}`,
        lat: c.lat, lng: c.lng,
        ts: Date.now() - 5 * 60_000, // recent-ish placeholder
      });
    }

    for (const e of eonet) {
      out.push({
        id: `eonet-${e.id}`,
        source: 'eonet',
        category: 'disaster',
        severity: eonetSeverity(e.categoryTitle ?? e.category),
        title: e.title,
        location: e.categoryTitle,
        lat: e.lat, lng: e.lng,
        ts: e.date ? Date.parse(e.date) : Date.now(),
        url: e.source ?? undefined,
      });
    }

    for (const q of quakes) {
      out.push({
        id: `usgs-${q.id}`,
        source: 'usgs',
        category: 'disaster',
        severity: quakeSeverity(q.mag),
        title: `M${q.mag.toFixed(1)} ${q.region ?? 'earthquake'}`,
        location: q.region ?? `${q.lat.toFixed(2)}, ${q.lng.toFixed(2)}`,
        lat: q.lat, lng: q.lng,
        ts: Date.now() - q.age * 3_600_000,
        url: q.url,
      });
    }

    for (const f of fires) {
      const sev = fireSeverity(f.frp);
      if (sev < 3) continue; // suppress low-intensity fires from feed
      out.push({
        id: `fire-${f.id}`,
        source: 'nasa-fires',
        category: 'disaster',
        severity: sev,
        title: `Active fire — FRP ${f.frp.toFixed(0)} MW`,
        location: `${f.lat.toFixed(2)}, ${f.lng.toFixed(2)}`,
        lat: f.lat, lng: f.lng,
        ts: Date.parse(`${f.acqDate}T${f.acqTime.padStart(4,'0').slice(0,2)}:${f.acqTime.padStart(4,'0').slice(2)}:00Z`) || Date.now(),
      });
    }

    out.sort((a, b) => b.ts - a.ts);
    return out;
  }, [acled, gdeltCells, eonet, quakes, fires, tick]);

  return { events, acledError: acledErr };
}

export const SIT_CATEGORY_COLOR: Record<SitCategory, string> = {
  conflict:     'hsl(0 84% 55%)',
  political:    'hsl(280 70% 60%)',
  disaster:     'hsl(28 95% 55%)',
  humanitarian: 'hsl(155 70% 45%)',
  economic:     'hsl(48 95% 55%)',
};

export const SIT_CATEGORY_LABEL: Record<SitCategory, string> = {
  conflict: 'Conflict',
  political: 'Political',
  disaster: 'Disaster',
  humanitarian: 'Humanitarian',
  economic: 'Economic',
};
