import { useMemo, useState } from 'react';
import type { GeoEvent } from '@/hooks/useGdeltNews';

interface Props {
  events: GeoEvent[];
  redact?: boolean;
}

function project(lat: number, lng: number, w: number, h: number) {
  // Simple equirectangular
  const x = ((lng + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

function colorFor(ev: GeoEvent) {
  const t = ev.event_type.toLowerCase();
  if (t.includes('battle') || t.includes('explosion') || t.includes('remote')) return 'hsl(0, 75%, 55%)';
  if (t.includes('riot') || t.includes('protest')) return 'hsl(38, 92%, 55%)';
  return 'hsl(var(--muted-foreground))';
}

export default function NewsGlobeMap({ events, redact }: Props) {
  const [hover, setHover] = useState<GeoEvent | null>(null);
  const W = 320;
  const H = 160;

  const pts = useMemo(() => {
    const now = Date.now();
    return events.slice(0, 200).map((e) => {
      const { x, y } = project(e.lat, e.lng, W, H);
      const ageMin = (now - e.ts) / 60_000;
      const isFresh = ageMin < 60;
      const r = Math.min(5, 1 + Math.log10(1 + e.fatalities));
      return { e, x, y, r, isFresh, color: colorFor(e) };
    });
  }, [events]);

  return (
    <div className="border-t border-border bg-surface-deep">
      <div className="px-2 py-1 text-[9px] font-mono uppercase text-accent font-bold border-b border-border flex items-center justify-between">
        <span>Live Events · ACLED 24h</span>
        <span className="text-[8px] text-muted-foreground">{redact ? '•••' : `${events.length} pts`}</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block bg-background">
          {/* graticule */}
          <g stroke="hsl(var(--border))" strokeWidth="0.3" fill="none" opacity={0.4}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((lng) => (
              <line key={`v${lng}`} x1={(lng / 360) * W} y1={0} x2={(lng / 360) * W} y2={H} />
            ))}
            {[30, 60, 90, 120, 150].map((lat) => (
              <line key={`h${lat}`} x1={0} y1={(lat / 180) * H} x2={W} y2={(lat / 180) * H} />
            ))}
            {/* equator */}
            <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="hsl(var(--accent))" strokeWidth="0.3" opacity={0.5} />
          </g>
          {/* dots */}
          {pts.map(({ e, x, y, r, isFresh, color }) => (
            <g key={e.id}>
              {isFresh && (
                <circle cx={x} cy={y} r={r * 2} fill="none" stroke={color} strokeWidth="0.6" opacity={0.6}>
                  <animate attributeName="r" from={r} to={r * 4} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x} cy={y} r={r}
                fill={color}
                opacity={isFresh ? 0.95 : 0.7}
                onMouseEnter={() => setHover(e)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          ))}
        </svg>
        {hover && !redact && (
          <div className="absolute bottom-1 left-1 right-1 px-2 py-1 bg-background/95 border border-border text-[9px] font-mono leading-tight pointer-events-none">
            <div className="text-accent uppercase font-bold">{hover.event_type} · {hover.country}</div>
            <div className="text-foreground line-clamp-2">{hover.headline}</div>
            <div className="text-muted-foreground">{hover.fatalities ? `${hover.fatalities} killed · ` : ''}{new Date(hover.ts).toUTCString().slice(5, 22)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
