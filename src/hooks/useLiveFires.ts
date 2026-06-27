import { usePolledApi } from './usePolledApi';

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
const EMPTY_FIRES: LiveFire[] = [];
const selectFires = (data: { fires?: LiveFire[] }) => data.fires ?? EMPTY_FIRES;

export function useLiveFires() {
  const { value: fires, loading, error } = usePolledApi({
    path: '/api/market/events/nasa-fires',
    intervalMs: REFRESH_MS,
    initial: EMPTY_FIRES,
    trackLoading: true,
    select: selectFires,
  });
  return { fires, loading, error };
}
