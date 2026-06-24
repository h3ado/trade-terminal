// Simple horizontal week strip showing earnings + macro markers.
import { useMemo } from "react";

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export default function EarnCalendarRail({ ticker }: { ticker: string }) {
  const days = useMemo(() => {
    const r = rng(hash(ticker + ":cal"));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() + i * 86400000);
      const markers: string[] = [];
      if (r() > 0.78) markers.push("ERN");
      if (r() > 0.9) markers.push("CPI");
      if (r() > 0.92) markers.push("FOMC");
      if (r() > 0.88) markers.push("NFP");
      return { d, markers };
    });
  }, [ticker]);

  return (
    <div className="flex gap-px bg-border border border-border overflow-x-auto">
      {days.map((x, i) => (
        <div key={i} className="bg-surface-deep px-2 py-1 min-w-[64px]">
          <div className="text-[8px] font-mono text-muted-foreground uppercase">{x.d.toUTCString().slice(0, 3)}</div>
          <div className="text-[10px] font-mono text-foreground">{x.d.getUTCMonth()+1}/{x.d.getUTCDate()}</div>
          <div className="flex gap-0.5 mt-0.5 flex-wrap">
            {x.markers.map(m => (
              <span key={m} className="text-[8px] font-mono px-1 border border-accent text-accent">{m}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
