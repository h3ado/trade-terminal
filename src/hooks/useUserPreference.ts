import { useEffect, useRef, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';

/**
 * Persists a piece of state per-user in `user_preferences` (cloud) with a
 * localStorage fallback for unauthenticated users. Debounces writes by 400ms.
 * All hook instances sharing the same `key` stay in sync via a window event.
 */
const PREF_EVENT = 'lovable:user-preference';

export function useUserPreference<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const loggedInRef = useRef(false);
  const skipNextSave = useRef(true);
  const instanceId = useRef(Math.random().toString(36).slice(2));

  // Load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const map = await apiGet('/api/preferences') as Record<string, any>;
        loggedInRef.current = true;
        if (!cancelled && map[key] !== undefined && map[key] !== null) {
          setValue(map[key] as T);
        }
      } catch {
        loggedInRef.current = false;
        try {
          const raw = localStorage.getItem(`pref:${key}`);
          if (!cancelled && raw) setValue(JSON.parse(raw) as T);
        } catch { /* ignore */ }
      }
      if (!cancelled) {
        skipNextSave.current = true;
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  // Listen for updates from other instances of this same preference key
  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ key: string; value: unknown; from: string }>;
      if (e.detail.key !== key || e.detail.from === instanceId.current) return;
      skipNextSave.current = true;
      setValue(e.detail.value as T);
    };
    window.addEventListener(PREF_EVENT, handler as EventListener);
    return () => window.removeEventListener(PREF_EVENT, handler as EventListener);
  }, [key]);

  // Save (debounced) + broadcast immediately
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }

    // Notify other instances right away
    window.dispatchEvent(new CustomEvent(PREF_EVENT, {
      detail: { key, value, from: instanceId.current },
    }));

    const id = window.setTimeout(async () => {
      if (loggedInRef.current) {
        try {
          await apiPut('/api/preferences/' + key, { value: value as any });
        } catch { /* ignore */ }
      } else {
        try { localStorage.setItem(`pref:${key}`, JSON.stringify(value)); } catch { /* ignore */ }
      }
    }, 400);
    return () => clearTimeout(id);
  }, [value, loaded, key]);

  return [value, setValue, loaded] as const;
}
