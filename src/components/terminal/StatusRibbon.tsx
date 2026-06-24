// Top status ribbon: clocks, conn, latency, queue depth, T1/min counter.
import { useEffect, useState } from 'react';

interface Props {
  conn?: 'live' | 'delayed' | 'off';
  latencyMs?: number;
  queueDepth?: number;
  t1PerMin?: number;
  storyCount?: number;
  fetchedAt?: number;
}

function fmtClock(d: Date, tz: string) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: tz, hour12: false }).format(d);
}

export default function StatusRibbon({ conn = 'live', latencyMs, queueDepth = 0, t1PerMin = 0, storyCount, fetchedAt }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dot = conn === 'live' ? '●' : conn === 'delayed' ? '◐' : '○';
  const dotCls = conn === 'live' ? 'text-positive animate-pulse' : conn === 'delayed' ? 'text-accent' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface-deep px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider tabular-nums flex-shrink-0">
      <span className={`${dotCls} font-bold`}>{dot} {conn}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-accent font-bold">UTC</span><span className="text-foreground">{fmtClock(now, 'UTC')}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">NY</span><span className="text-foreground">{fmtClock(now, 'America/New_York')}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">LDN</span><span className="text-foreground">{fmtClock(now, 'Europe/London')}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">TKO</span><span className="text-foreground">{fmtClock(now, 'Asia/Tokyo')}</span>

      <div className="ml-auto flex items-center gap-2 text-[9px]">
        {typeof latencyMs === 'number' && (
          <>
            <span className="text-muted-foreground">LAT</span>
            <span className={latencyMs < 800 ? 'text-positive' : latencyMs < 2000 ? 'text-accent' : 'text-negative'}>
              {latencyMs}ms
            </span>
            <span className="text-muted-foreground">·</span>
          </>
        )}
        <span className="text-muted-foreground">Q</span>
        <span className={queueDepth > 0 ? 'text-accent font-bold' : 'text-foreground'}>{queueDepth}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">T1/MIN</span>
        <span className={t1PerMin > 5 ? 'text-accent font-bold animate-pulse' : 'text-foreground'}>{t1PerMin}</span>
        {typeof storyCount === 'number' && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">N</span>
            <span className="text-foreground font-bold">{storyCount}</span>
          </>
        )}
        {fetchedAt ? (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">UPD {new Date(fetchedAt).toLocaleTimeString('en-GB', { hour12: false })}</span>
          </>
        ) : null}
        <span className="text-muted-foreground">·</span>
        <span className="text-accent font-bold">@h3ado</span>
      </div>
    </div>
  );
}
