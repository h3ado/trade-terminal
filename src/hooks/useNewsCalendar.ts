import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';

export type CalendarRelease = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  importance: 1 | 2 | 3;
  source: string;
};

export function useNewsCalendar(intervalMs = 5 * 60_000) {
  const [releases, setReleases] = useState<CalendarRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  const fetchNow = async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const data = await apiGet<{ releases?: CalendarRelease[] }>('/api/market/calendar/econ');
      if (id !== reqId.current) return;
      setReleases(data.releases ?? []);
    } catch {
      if (id === reqId.current) setReleases([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNow();
    const t = setInterval(fetchNow, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  // upcoming = future releases, sorted ascending
  const now = Date.now();
  const upcoming = releases
    .filter((r) => new Date(r.date).getTime() + 86_400_000 > now)
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];

  return { releases, upcoming, next, loading, refetch: fetchNow };
}
