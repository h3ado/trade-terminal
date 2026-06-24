// TapeFeed: dense scannable list with sticky hour-bucket headers.
import { Fragment, useMemo } from 'react';
import HeadlineRow from '@/components/news/HeadlineRow';
import type { NewsArticle } from '@/hooks/useGdeltNews';
import type { NewsDensity } from '@/hooks/useNewsPrefs';

interface Props {
  articles: NewsArticle[];
  density: NewsDensity;
  activeId?: string;
  pins: string[];
  onSelect: (i: number, id: string) => void;
  onTogglePin: (id: string) => void;
  redact?: boolean;
}

function bucketLabel(ts: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})/.exec(ts);
  if (!m) return 'UNKNOWN';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4]));
  const diff = Date.now() - d.getTime();
  if (diff < 60 * 60_000) return 'LAST HOUR';
  if (diff < 6 * 3600_000) return d.toUTCString().slice(17, 22) + 'Z';
  if (diff < 24 * 3600_000) return d.toUTCString().slice(0, 22) + 'Z';
  return d.toISOString().slice(0, 13).replace('T', ' ') + ':00Z';
}

export default function TapeFeed({ articles, density, activeId, pins, onSelect, onTogglePin, redact }: Props) {
  const grouped = useMemo(() => {
    const out: { bucket: string; items: { article: NewsArticle; idx: number }[] }[] = [];
    let last = '';
    articles.forEach((a, idx) => {
      const b = bucketLabel(a.seendate);
      if (b !== last) {
        out.push({ bucket: b, items: [] });
        last = b;
      }
      out[out.length - 1].items.push({ article: a, idx });
    });
    return out;
  }, [articles]);

  return (
    <div className="font-mono">
      {grouped.map((g) => (
        <Fragment key={g.bucket}>
          <div className={`sticky top-0 z-10 px-2 uppercase font-bold tracking-wider bg-surface-deep/95 backdrop-blur border-y border-border text-muted-foreground flex items-center gap-2 ${density === 'bloomberg' ? 'py-0 text-[8px]' : 'py-0.5 text-[9px]'}`}>
            <span className="text-accent">▸</span>
            <span>{g.bucket}</span>
            <span className="text-border">·</span>
            <span>{g.items.length}</span>
          </div>
          {g.items.map(({ article, idx }) => (
            <HeadlineRow
              key={article.id}
              article={article}
              active={article.id === activeId}
              redact={redact}
              density={density}
              pinned={pins.includes(article.id)}
              onTogglePin={() => onTogglePin(article.id)}
              onClick={() => onSelect(idx, article.id)}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
