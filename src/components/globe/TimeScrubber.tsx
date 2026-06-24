import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Time scrubber for the globe — sweeps a virtual "now" within a ±RANGE_MIN
 * window so the day/night terminator and the econ-pin recency colors animate
 * forward/backward in time. The slider is in minutes; playback advances at
 * `playSpeedMinPerSec` minutes of virtual time per real second.
 *
 * Real "now" is offset 0; negative = past, positive = future.
 */

const RANGE_MIN = 7 * 24 * 60;       // ±7 days
const STEP_MIN = 30;                 // 30-minute slider step
const PLAY_SPEED_MIN_PER_SEC = 60;   // 1 hour of virtual time per real sec

function fmtOffset(min: number): string {
  if (Math.abs(min) < 1) return 'LIVE';
  const sign = min < 0 ? '-' : '+';
  const abs = Math.abs(min);
  const d = Math.floor(abs / 1440);
  const h = Math.floor((abs % 1440) / 60);
  const m = abs % 60;
  if (d > 0) return `${sign}${d}d ${h}h`;
  if (h > 0) return `${sign}${h}h ${m}m`;
  return `${sign}${m}m`;
}

function fmtClock(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}Z`;
}

interface Props {
  offsetMin: number;
  setOffsetMin: (m: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  scrubbedNow: Date;
}

export function TimeScrubber({ offsetMin, setOffsetMin, playing, setPlaying, scrubbedNow }: Props) {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const offsetRef = useRef(offsetMin);
  offsetRef.current = offsetMin;

  // Playback loop — pure rAF so it stays smooth even while the globe re-renders.
  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // seconds
      lastTsRef.current = ts;
      const next = offsetRef.current + dt * PLAY_SPEED_MIN_PER_SEC;
      if (next >= RANGE_MIN) {
        setOffsetMin(RANGE_MIN);
        setPlaying(false);
        return;
      }
      setOffsetMin(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, setOffsetMin, setPlaying]);

  const isLive = Math.abs(offsetMin) < 1;
  const past = offsetMin < 0;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[min(640px,calc(100%-1rem))] bg-surface-deep/95 border border-accent/40 backdrop-blur font-mono">
      <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-surface-elevated">
        <span className="text-[9px] uppercase font-bold text-accent">Time Scrubber</span>
        <span className="text-[9px] text-muted-foreground">·</span>
        <span className={`text-[10px] font-bold tabular-nums ${isLive ? 'text-positive' : past ? 'text-[hsl(15,90%,65%)]' : 'text-[hsl(195,90%,65%)]'}`}>
          {fmtOffset(offsetMin)}
        </span>
        <span className="text-[9px] text-muted-foreground tabular-nums ml-auto">{fmtClock(scrubbedNow)}</span>
      </div>

      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          onClick={() => setOffsetMin(Math.max(-RANGE_MIN, offsetMin - 60))}
          title="Back 1h"
          className="p-1 border border-border hover:border-accent text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <button
          onClick={() => { setPlaying(!playing); }}
          title={playing ? 'Pause' : 'Play forward'}
          className={`p-1 border ${playing ? 'border-accent bg-accent/15 text-accent' : 'border-border text-muted-foreground hover:text-foreground'}`}
        >
          {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </button>
        <button
          onClick={() => setOffsetMin(Math.min(RANGE_MIN, offsetMin + 60))}
          title="Fwd 1h"
          className="p-1 border border-border hover:border-accent text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        <div className="relative flex-1 mx-1">
          <input
            type="range"
            min={-RANGE_MIN}
            max={RANGE_MIN}
            step={STEP_MIN}
            value={offsetMin}
            onChange={e => { setPlaying(false); setOffsetMin(parseFloat(e.target.value)); }}
            className="w-full h-1 accent-accent cursor-pointer"
          />
          {/* Day tick marks at -7..+7 */}
          <div className="absolute left-0 right-0 top-3 flex justify-between pointer-events-none">
            {[-7, -3, 0, 3, 7].map(d => (
              <span key={d} className={`text-[7px] tabular-nums ${d === 0 ? 'text-positive' : 'text-muted-foreground/60'}`}>
                {d === 0 ? 'NOW' : d > 0 ? `+${d}d` : `${d}d`}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setPlaying(false); setOffsetMin(0); }}
          title="Reset to LIVE"
          className="flex items-center gap-1 px-1.5 py-1 border border-border hover:border-positive text-muted-foreground hover:text-positive text-[9px] uppercase font-bold"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Live
        </button>
      </div>
    </div>
  );
}
