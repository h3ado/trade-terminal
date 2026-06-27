/**
 * Direct ACLED conflict events feed for the 2D map. Server-cached 30 min;
 * we re-poll every 5 min so heat clusters animate in roughly real time.
 */
import { usePolledApi } from './usePolledApi';

export type AcledEvent = {
  id: string;
  subType: string;
  severity: 1 | 2 | 3 | 4 | 5;
  title: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  ts: number;
  fatalities: number;
  url?: string;
};

const REFRESH_MS = 5 * 60_000;
const EMPTY_EVENTS: AcledEvent[] = [];
const selectEvents = (data: { events?: AcledEvent[] }) => data.events ?? EMPTY_EVENTS;

export function useAcledEvents(enabled: boolean) {
  const { value: events, live, error } = usePolledApi({
    path: '/api/market/events/acled-events',
    intervalMs: REFRESH_MS,
    initial: EMPTY_EVENTS,
    enabled,
    select: selectEvents,
  });
  return { events, live, error };
}
