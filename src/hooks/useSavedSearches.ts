import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { NewsScope } from './useGdeltNews';

export interface SavedSearch {
  id: string;
  name: string;
  scope: NewsScope;
  value: string;
  alert_enabled: boolean;
  created_at: string;
}

export function useSavedSearches() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/saved-searches') as SavedSearch[];
      setItems(data ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (name: string, scope: NewsScope, value: string, alert_enabled = false) => {
    await apiPost('/api/saved-searches', { name, scope, value, alert_enabled });
    load();
  };

  const remove = async (id: string) => {
    await apiDelete('/api/saved-searches/' + id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    await apiPatch('/api/saved-searches/' + id, { alertEnabled: enabled });
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, alert_enabled: enabled } : x));
  };

  return { items, loading, add, remove, toggleAlert, refresh: load };
}
