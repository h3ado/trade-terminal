import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

interface MacroItem { key: string; label: string; value: number | null; unit: string; change: number | null; }

const cache = new Map<string, { ts: number; items: MacroItem[] }>();
const TTL = 5 * 60_000;

async function fetchEia(): Promise<MacroItem[]> {
  const d = await apiGet<{ indicators?: any[] }>('/api/market/macro/eia-energy').catch(() => ({ indicators: [] }));
  return (d.indicators ?? [])
    .filter((i: any) => ['wti', 'brent', 'henry_hub'].includes(i.key))
    .map((i: any) => ({ key: i.key, label: i.key === 'henry_hub' ? 'NatGas' : i.key.toUpperCase(), value: i.value, unit: i.unit === '$/bbl' ? '/bbl' : '/MMBtu', change: i.change }));
}

async function fetchFred(): Promise<MacroItem[]> {
  const d = await apiGet<{ indicators?: any[] }>('/api/market/macro/fred-indicators').catch(() => ({ indicators: [] }));
  return (d.indicators ?? [])
    .filter((i: any) => ['cpi_yoy', 'fed_funds', 'unemployment'].includes(i.key))
    .map((i: any) => ({
      key: i.key,
      label: i.key === 'cpi_yoy' ? 'CPI' : i.key === 'fed_funds' ? 'Fed Funds' : 'Unemploy',
      value: i.value,
      unit: i.unit ?? '%',
      change: i.change ?? null,
    }));
}

export function useMacroContext(topic: string): MacroItem[] {
  const isEnergy = topic === 'energy';
  const isMacro = topic === 'central-bank' || topic === 'macro';
  const cacheKey = isEnergy ? 'eia' : isMacro ? 'fred' : '';

  const [items, setItems] = useState<MacroItem[]>(() => {
    if (!cacheKey) return [];
    const hit = cache.get(cacheKey);
    return hit && Date.now() - hit.ts < TTL ? hit.items : [];
  });

  useEffect(() => {
    if (!cacheKey) { setItems([]); return; }
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < TTL) { setItems(hit.items); return; }
    const fetcher = cacheKey === 'eia' ? fetchEia : fetchFred;
    fetcher().then(result => {
      cache.set(cacheKey, { ts: Date.now(), items: result });
      setItems(result);
    }).catch(() => {});
  }, [cacheKey]);

  return items;
}
