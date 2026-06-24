import { useMemo } from 'react';
import type { NewsArticle } from '@/hooks/useGdeltNews';

interface Props {
  articles: NewsArticle[];
  redact?: boolean;
  onSelect?: (id: string) => void;
}

function toneColor(tone: number) {
  const t = Math.max(-10, Math.min(10, tone));
  if (t >= 0) return `hsl(140, 70%, ${35 + t * 2}%)`;
  return `hsl(0, 75%, ${40 + Math.abs(t) * 2}%)`;
}

function ageMs(seendate: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(seendate);
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Date.now() - Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

const COLS = 5;
const ROWS = 20;

export default function ToneHeatGrid({ articles, redact, onSelect }: Props) {
  const cells = useMemo(() => articles.slice(0, COLS * ROWS), [articles]);
  const maxAge = Math.max(...cells.map((c) => ageMs(c.seendate)), 1);

  return (
    <div className="border-t border-border bg-surface-deep">
      <div className="px-2 py-1 flex items-center justify-between border-b border-border">
        <span className="text-[9px] font-mono uppercase text-accent font-bold">Tone Heat-Grid · last {cells.length}</span>
        <span className="text-[8px] font-mono text-muted-foreground">red ↘ neg · green ↗ pos</span>
      </div>
      <div
        className="p-1 grid gap-px"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {cells.map((a) => {
          const opacity = redact ? 0.5 : Math.max(0.25, 1 - ageMs(a.seendate) / maxAge);
          return (
            <button
              key={a.id}
              onClick={() => onSelect?.(a.id)}
              title={`${a.title} · ${a.domain} · tone ${a.tone.toFixed(2)}`}
              className="aspect-square hover:ring-1 hover:ring-accent transition-all"
              style={{ backgroundColor: redact ? 'hsl(var(--muted))' : toneColor(a.tone), opacity }}
            />
          );
        })}
        {Array.from({ length: Math.max(0, COLS * ROWS - cells.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square bg-surface-elevated/40" />
        ))}
      </div>
    </div>
  );
}
