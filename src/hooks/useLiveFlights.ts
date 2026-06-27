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

const REFRESH_MS = 20_000;     // background poll cadence
const PAN_DEBOUNCE_MS = 350;   // wait for pan/zoom to settle before fetching
const CACHE_TTL_MS = 12_000;   // serve cached results for this long

// Module-level cache shared across hook instances.
type CacheEntry = { at: number; flights: LiveFlight[] };
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<LiveFlight[]>>();

// Quantize bbox to ~1° grid so micro-pans share the same key/cache entry.
function bboxKey(b: Bbox) {
  const q = (n: number) => Math.round(n);
  return `${q(b.lamin)},${q(b.lamax)},${q(b.lomin)},${q(b.lomax)}`;
}

// Snap bbox outward to the 1° grid so the fetched region fully covers what's visible.
function snapBbox(b: Bbox): Bbox {
  return {
    lamin: Math.floor(b.lamin),
    lamax: Math.ceil(b.lamax),
    lomin: Math.floor(b.lomin),
    lomax: Math.ceil(b.lomax),
  };
}

async function fetchFlights(bbox: Bbox, signal: AbortSignal): Promise<LiveFlight[]> {
  const data = await apiGet<{ flights?: LiveFlight[] }>('/api/market/events/opensky-flights', {
    lamin: String(bbox.lamin),
    lamax: String(bbox.lamax),
    lomin: String(bbox.lomin),
    lomax: String(bbox.lomax),
  });
  signal.throwIfAborted();
  return (data?.flights ?? []).map((f: any) => ({
    id: f.id ?? f.icao24,
    callsign: f.callsign ?? '',
    country: f.country ?? '',
    lat: f.lat,
    lng: f.lng,
    altFt: f.altFt ?? (f.altitude == null ? null : Math.round(Number(f.altitude) * 3.28084)),
    speedKts: f.speedKts ?? (f.velocity == null ? null : Math.round(Number(f.velocity) * 1.94384)),
    trackDeg: f.trackDeg ?? f.heading ?? 0,
    vertRateFpm: f.vertRateFpm ?? 0,
    onGround: !!f.onGround,
  })) as LiveFlight[];
}

/**
 * Fetch live aircraft within a viewport bbox.
 * - Quantizes the bbox to a 1° grid so panning doesn't spam requests.
 * - Debounces 350ms after the bbox changes.
 * - Caches results for 12s and de-duplicates concurrent requests.
 * - Polls every 20s in the background while enabled.
 */
export function useLiveFlights(bbox: Bbox | null, enabled: boolean) {
  const [flights, setFlights] = useState<LiveFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    if (!enabled || !bbox) {
      setFlights([]);
      return;
    }

    const snapped = snapBbox(bbox);
    const key = bboxKey(snapped);
    lastKeyRef.current = key;

    let cancelled = false;
    const ctrl = new AbortController();

    const serveCacheImmediately = () => {
      const cached = cache.get(key);
      if (cached) {
        setFlights(cached.flights);
        // If still fresh, no fetch needed yet.
        return Date.now() - cached.at < CACHE_TTL_MS;
      }
      return false;
    };

    const load = async (force: boolean) => {
      const cached = cache.get(key);
      if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
        if (!cancelled) setFlights(cached.flights);
        return;
      }
      // De-dupe concurrent requests for the same key.
      let promise = inflight.get(key);
      if (!promise) {
        promise = fetchFlights(snapped, ctrl.signal)
          .then((res) => {
            cache.set(key, { at: Date.now(), flights: res });
            return res;
          })
          .finally(() => inflight.delete(key));
        inflight.set(key, promise);
      }
      if (!cancelled) setLoading(true);
      try {
        const res = await promise;
        if (!cancelled && lastKeyRef.current === key) {
          setFlights(res);
          setError(null);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        if (!cancelled) setError(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // 1) Show cached data instantly (if any) so the map never goes empty.
    const fresh = serveCacheImmediately();

    // 2) Debounce the initial fetch so rapid pan/zoom only triggers one request.
    const debounce = window.setTimeout(() => {
      if (!fresh) load(false);
    }, PAN_DEBOUNCE_MS);

    // 3) Background poll for live updates.
    const poll = window.setInterval(() => load(true), REFRESH_MS);

    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(debounce);
      clearInterval(poll);
    };
  }, [enabled, bbox ? bboxKey(snapBbox(bbox)) : null]);

  return { flights, loading, error };
}
