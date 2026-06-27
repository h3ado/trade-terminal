import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewType } from '@/types/trade';
import type { MacroTab } from '@/config/views';
import type { FxTab } from '@/config/fx';

export interface NavEntry {
  view: ViewType;
  macroTab?: MacroTab;
  fxTab?: FxTab;
  label: string;
  trail: string[]; // breadcrumb segments e.g. ['MACRO', 'YIELD CURVE (YCRV)']
}

const eq = (a: NavEntry, b: NavEntry) =>
  a.view === b.view && a.macroTab === b.macroTab && a.fxTab === b.fxTab;

export function useNavHistory(initial: NavEntry) {
  const [stack, setStack] = useState<NavEntry[]>([initial]);
  const [index, setIndex] = useState(0);
  const suppressRef = useRef(false);

  const push = useCallback((entry: NavEntry) => {
    if (suppressRef.current) { suppressRef.current = false; return; }
    setStack(prev => {
      const cur = prev[index];
      if (cur && eq(cur, entry)) return prev;
      const next = prev.slice(0, index + 1);
      next.push(entry);
      // cap stack
      const capped = next.slice(-50);
      setIndex(capped.length - 1);
      return capped;
    });
  }, [index]);

  const back = useCallback(() => {
    setIndex(i => {
      if (i <= 0) return i;
      suppressRef.current = true;
      return i - 1;
    });
  }, []);

  const forward = useCallback(() => {
    setIndex(i => {
      if (i >= stack.length - 1) return i;
      suppressRef.current = true;
      return i + 1;
    });
  }, [stack.length]);

  // Alt+Arrow keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); forward(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [back, forward]);

  return {
    current: stack[index],
    canBack: index > 0,
    canForward: index < stack.length - 1,
    push,
    back,
    forward,
    suppressNext: () => { suppressRef.current = true; },
  };
}
