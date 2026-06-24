import { useState, useCallback } from "react";

export function useSeriesToggle() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = useCallback((key: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);
  return { hidden, toggle, isHidden };
}
