/**
 * NASA EONET open natural events — volcanoes, storms, drought, etc.
 * Refreshed every 30 min — matches the edge cache.
 */
import { usePolledApi } from './usePolledApi';

export type EonetEvent = {
  id: string;
  title: string;
  category: string;
  categoryTitle: string;
  date: string | null;
  source: string | null;
  lat: number;
  lng: number;
};

const REFRESH_MS = 30 * 60_000;
const EMPTY_EVENTS: EonetEvent[] = [];
const selectEvents = (data: { events?: EonetEvent[] }) => data.events ?? EMPTY_EVENTS;

export function useLiveEonet() {
  const { value: events, live, error } = usePolledApi({
    path: '/api/market/events/nasa-eonet',
    intervalMs: REFRESH_MS,
    initial: EMPTY_EVENTS,
    select: selectEvents,
  });
  return { events, live, error };
}
