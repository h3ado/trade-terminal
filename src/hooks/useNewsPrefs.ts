import { useCallback, useEffect, useState } from 'react';
import { useUserPreference } from '@/hooks/useUserPreference';

export type NewsDensity = 'comfort' | 'compact' | 'tape' | 'bloomberg';

export function useNewsPins() {
  const [pins, setPinsRaw] = useUserPreference<string[]>('news.pins', []);
  const setPins = useCallback((p: string[]) => setPinsRaw(p), [setPinsRaw]);
  const toggle = useCallback((id: string) => {
    setPins(pins.includes(id) ? pins.filter((x) => x !== id) : [id, ...pins].slice(0, 50));
  }, [pins, setPins]);
  const remove = useCallback((id: string) => setPins(pins.filter((x) => x !== id)), [pins, setPins]);
  return { pins, toggle, remove, has: (id: string) => pins.includes(id) };
}

export function useNewsDensity() {
  const [density, setDensity] = useUserPreference<NewsDensity>('news.density', 'comfort');
  const cycle = useCallback(() => {
    const order: NewsDensity[] = ['comfort', 'compact', 'tape', 'bloomberg'];
    const idx = order.indexOf(density);
    setDensity(order[(idx + 1) % order.length]);
  }, [density, setDensity]);
  return { density, setDensity, cycle };
}

// Lightweight cross-component event for keyboard shortcuts triggered inside NewsView.
export function useNewsKeyboard(handlers: Partial<Record<string, () => void>>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const k = e.key.toLowerCase();
      const fn = handlers[k];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}

// no-op placeholder export so this file is importable as a module bundle.
export const __NEWS_HOOKS__ = true as const;
export const useNewsLocalState = (initial: string) => {
  const [v, setV] = useState(initial);
  return [v, setV] as const;
};
