import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export type PolledApiState<T> = {
  value: T;
  loading: boolean;
  live: boolean;
  error: string | null;
};

type PolledApiOptions<TResponse, TValue> = {
  path: string;
  intervalMs: number;
  initial: TValue;
  enabled?: boolean;
  trackLoading?: boolean;
  clearOnError?: boolean;
  select: (response: TResponse) => TValue;
  isLive?: (value: TValue, response: TResponse) => boolean;
  getError?: (value: TValue, response: TResponse) => string | null;
};

const defaultIsLive = <T,>(value: T) => Array.isArray(value) ? value.length > 0 : Boolean(value);
const defaultGetError = () => null;

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * Small polling wrapper for read-only market/event feeds.
 * Keeps cancellation, interval cleanup, loading, and soft error state in one place.
 */
export function usePolledApi<TResponse, TValue>({
  path,
  intervalMs,
  initial,
  enabled = true,
  trackLoading = false,
  clearOnError = false,
  select,
  isLive = defaultIsLive,
  getError = defaultGetError,
}: PolledApiOptions<TResponse, TValue>): PolledApiState<TValue> {
  const [state, setState] = useState<PolledApiState<TValue>>({
    value: initial,
    loading: trackLoading && enabled,
    live: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const load = async () => {
      if (trackLoading) setState((s) => ({ ...s, loading: true }));
      try {
        const response = await apiGet<TResponse>(path);
        if (cancelled) return;
        const value = select(response);
        setState({
          value,
          loading: false,
          live: isLive(value, response),
          error: getError(value, response),
        });
      } catch (error) {
        if (cancelled) return;
        setState((s) => ({
          value: clearOnError ? initial : s.value,
          loading: false,
          live: false,
          error: errorMessage(error),
        }));
      }
    };

    load();
    const id = window.setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [clearOnError, enabled, getError, initial, intervalMs, isLive, path, select, trackLoading]);

  return state;
}
