import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';

export type LiveFlight = {
  id: string;
  callsign: string;
  country: string;
  lat: number;
  lng: number;
  altFt: number | null;
  speedKts: number | null;
  trackDeg: number;
  vertRateFpm: number;
  onGround: boolean;
};

export type Bbox = { lamin: number; lamax: number; lomin: number; lomax: number };

const REFRESH_MS = 5 * 60_000; // matches backend 5-min cache

type RawFlight = {
  icao24: string;
  callsign?: string;
  country?: string;
  lat: number;
  lng: number;
  altitude?: number | null;
  onGround?: boolean;
  velocity?: number | null;
  heading?: number | null;
};

let globalCache: { at: number; raw: RawFlight[] } | null = null;

function mapFlight(f: RawFlight): LiveFlight {
  return {
    id: f.icao24,
    callsign: f.callsign ?? '',
    country: f.country ?? '',
    lat: f.lat,
    lng: f.lng,
    altFt: f.altitude != null ? Math.round(f.altitude * 3.28084) : null,
    speedKts: f.velocity != null ? Math.round(f.velocity * 1.94384) : null,
    trackDeg: f.heading ?? 0,
    vertRateFpm: 0,
    onGround: f.onGround ?? false,
  };
}

function filterByBbox(raw: RawFlight[], bbox: Bbox | null): LiveFlight[] {
  const filtered = bbox
    ? raw.filter(f => f.lat >= bbox.lamin && f.lat <= bbox.lamax && f.lng >= bbox.lomin && f.lng <= bbox.lomax)
    : raw;
  return filtered.map(mapFlight);
}

export function useLiveFlights(bbox: Bbox | null, enabled: boolean) {
  const [flights, setFlights] = useState<LiveFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bboxRef = useRef(bbox);
  bboxRef.current = bbox;

  useEffect(() => {
    if (!enabled) { setFlights([]); return; }
    let cancelled = false;

    const load = async () => {
      if (globalCache && Date.now() - globalCache.at < REFRESH_MS) {
        if (!cancelled) setFlights(filterByBbox(globalCache.raw, bboxRef.current));
        return;
      }
      if (!cancelled) setLoading(true);
      try {
        const data = await apiGet<{ flights?: RawFlight[] }>('/api/market/events/opensky-flights');
        const raw = (data?.flights ?? []) as RawFlight[];
        globalCache = { at: Date.now(), raw };
        if (!cancelled) {
          setFlights(filterByBbox(raw, bboxRef.current));
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled]);

  // Re-filter on bbox change without refetching
  useEffect(() => {
    if (!enabled || !globalCache) return;
    setFlights(filterByBbox(globalCache.raw, bbox));
  }, [bbox?.lamin, bbox?.lamax, bbox?.lomin, bbox?.lomax, enabled]);

  return { flights, loading, error };
}
