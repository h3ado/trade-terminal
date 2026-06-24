// TOP — Top News firehose monitor.
import { useGdeltNews } from '@/hooks/useGdeltNews';
import MonitorTable, { MonitorCol } from './MonitorTable';

interface Row {
  id: string;
  time: string;
  src: string;
  tier: number;
  topic: string;
  headline: string;
  url: string;
  tone: number;
}

const ago = (seendate: string) => {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(seendate);
  if (!m) return '—';
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const diff = Math.max(0, Date.now() - t);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export default function TOPMonitor() {
  const { articles, loading, fetchedAt } = useGdeltNews({ scope: 'global', value: '', timespan: '24h', tone: 'all' });

  const rows: Row[] = articles.slice(0, 200).map(a => ({
    id: a.id,
    time: ago(a.seendate),
    src: a.domain || '—',
    tier: a.tier ?? 2,
    topic: a.topic ?? '—',
    headline: a.title,
    url: a.url,
    tone: a.tone,
  }));

  const toneCls = (n: number) => n > 1 ? 'text-positive' : n < -1 ? 'text-negative' : 'text-muted-foreground';

  const cols: MonitorCol<Row>[] = [
    { key: 'time', label: 'Age', width: 'w-12', render: r => <span className="text-muted-foreground">{r.time}</span> },
    { key: 'tier', label: 'T', width: 'w-6', align: 'center', render: r => (
      <span className={r.tier === 1 ? 'text-accent font-bold' : 'text-muted-foreground'}>{r.tier}</span>
    ) },
    { key: 'src', label: 'Source', width: 'w-32', render: r => <span className="text-muted-foreground truncate">{r.src}</span> },
    { key: 'topic', label: 'Topic', width: 'w-24', render: r => <span className="text-accent uppercase text-[9px]">{r.topic}</span> },
    {
      key: 'headline', label: 'Headline', render: r => (
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-accent transition-colors block truncate"
          title={r.headline}
        >
          {r.headline}
        </a>
      ),
    },
    { key: 'tone', label: 'Tone', align: 'right', width: 'w-12', render: r => (
      <span className={toneCls(r.tone)}>{r.tone >= 0 ? '+' : ''}{r.tone.toFixed(1)}</span>
    ) },
  ];

  return (
    <MonitorTable
      title="Top News (Global Firehose)"
      code="TOP"
      cols={cols}
      rows={rows}
      loading={loading}
      ts={fetchedAt || null}
      rowKey={r => r.id}
    />
  );
}
