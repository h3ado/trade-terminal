/** OpenAQ live PM2.5 stations. Refreshed every 10 min. */
import { usePolledApi } from './usePolledApi';

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
const EMPTY_STATIONS: AirStation[] = [];
const selectStations = (data: { stations?: AirStation[] }) => data.stations ?? EMPTY_STATIONS;

export function useLiveAirQuality(enabled: boolean) {
  const { value: stations, live, error } = usePolledApi({
    path: '/api/market/events/openaq-air',
    intervalMs: REFRESH_MS,
    initial: EMPTY_STATIONS,
    enabled,
    select: selectStations,
  });
  return { stations, live, error };
}
