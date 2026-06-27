/** Live lightning strikes (Blitzortung relay, last 30 min). Polls every 30s. */
import { usePolledApi } from './usePolledApi';

export type LightningStrike = { id: string; lat: number; lng: number; ageS: number };

const REFRESH_MS = 30_000;
const EMPTY_STRIKES: LightningStrike[] = [];
const INITIAL_LIGHTNING = { strikes: EMPTY_STRIKES, source: null as 'blitzortung' | 'synthetic' | null };
const selectLightning = (data: { strikes?: LightningStrike[]; source?: 'blitzortung' | 'synthetic' }) => ({
  strikes: data.strikes ?? EMPTY_STRIKES,
  source: data.source ?? null,
});
const isLiveLightning = (_value: typeof INITIAL_LIGHTNING, data: { source?: 'blitzortung' | 'synthetic' }) =>
  data.source === 'blitzortung';

export function useLiveLightning(enabled: boolean) {
  const { value, live } = usePolledApi({
    path: '/api/market/events/lightning-strikes',
    intervalMs: REFRESH_MS,
    initial: INITIAL_LIGHTNING,
    enabled,
    select: selectLightning,
    isLive: isLiveLightning,
  });
  const { strikes, source } = value;
  return { strikes, source, live };
}
