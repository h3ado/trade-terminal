// TV clip drawer: shows latest finance YouTube clips inline.
import { useEffect, useState } from 'react';
import { Tv, X } from 'lucide-react';
import { apiGet } from '@/lib/api';

type Clip = {
  id: string; url: string; title: string;
  domain: string; seendate: string; embedId?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

function timeAgo(ts: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(ts);
  if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function TVClipDrawer({ open, onClose }: Props) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [active, setActive] = useState<Clip | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    apiGet<{ clips?: Clip[] }>('/api/market/news/tv-clips')
      .then((data) => {
        if (cancelled) return;
        const cs = (data?.clips ?? []) as Clip[];
        setClips(cs);
        setActive(cs.find((c) => c.embedId) ?? cs[0] ?? null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed top-12 right-3 bottom-3 z-40 w-[380px] bg-surface-deep border border-accent/40 font-mono flex flex-col shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-background px-2 py-1 flex-shrink-0">
        <Tv className="w-3 h-3 text-accent" />
        <span className="text-[10px] uppercase font-bold text-accent">TV · CLIPS</span>
        <span className="text-[9px] text-muted-foreground">· {clips.length}</span>
        <button onClick={onClose} className="ml-auto text-[10px] text-muted-foreground hover:text-accent px-1">
          <X className="w-3 h-3" />
        </button>
      </div>

      {loading && (
        <div className="p-2 text-[10px] text-muted-foreground">Loading clips…</div>
      )}

      {active?.embedId ? (
        <div className="aspect-video bg-black flex-shrink-0 border-b border-border">
          <iframe
            key={active.embedId}
            src={`https://www.youtube.com/embed/${active.embedId}?autoplay=1&rel=0`}
            title={active.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : active ? (
        <a
          href={active.url} target="_blank" rel="noreferrer noopener"
          className="block p-3 text-[11px] text-accent hover:underline border-b border-border"
        >
          Open clip ↗ {active.title}
        </a>
      ) : null}

      {active && (
        <div className="px-2 py-1 border-b border-border bg-background/60">
          <div className="text-[10px] font-mono text-foreground line-clamp-2">{active.title}</div>
          <div className="text-[9px] text-muted-foreground">{active.domain} · {timeAgo(active.seendate)} ago</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {clips.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c)}
            className={`w-full text-left px-2 py-1.5 border-b border-border/40 ${
              active?.id === c.id ? 'bg-accent/15' : 'hover:bg-surface-elevated'
            }`}
          >
            <div className="text-[10px] font-mono text-foreground line-clamp-2">{c.title}</div>
            <div className="text-[9px] font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="text-accent">{c.domain}</span>
              <span>·</span>
              <span>{timeAgo(c.seendate)}</span>
              {c.embedId && <span className="ml-auto text-accent/60">▶ embed</span>}
            </div>
          </button>
        ))}
        {!loading && clips.length === 0 && (
          <div className="p-2 text-[10px] text-muted-foreground">No clips found in last hour.</div>
        )}
      </div>
    </div>
  );
}
