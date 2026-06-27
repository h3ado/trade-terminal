import { usePolledApi } from './usePolledApi';

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
const EMPTY_QUAKES: LiveQuake[] = [];
const selectQuakes = (data: { quakes?: LiveQuake[] }) => data.quakes ?? EMPTY_QUAKES;

export function useLiveQuakes() {
  const { value: quakes, loading, error } = usePolledApi({
    path: '/api/market/events/usgs-quakes',
    intervalMs: REFRESH_MS,
    initial: EMPTY_QUAKES,
    trackLoading: true,
    select: selectQuakes,
  });
  return { quakes, loading, error };
}
