// SquawkPlayer: floating mini-player that reads new T1 headlines aloud
// using the browser's native SpeechSynthesis. Zero external dependency.
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';
import type { NewsArticle } from '@/hooks/useGdeltNews';

type Filter = 'T1' | 'T1+SEC' | 'ALL';

interface Props {
  articles: NewsArticle[];
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'lovable:newsv5:squawk';

function isEligible(a: NewsArticle, filter: Filter): boolean {
  const tier = a.tier ?? 2;
  if (filter === 'ALL') return tier <= 2;
  if (filter === 'T1+SEC') return tier === 1 || a.topic === 'filings';
  return tier === 1;
}

export default function SquawkPlayer({ articles, open, onClose }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [filter, setFilter] = useState<Filter>('T1');
  const [voiceName, setVoiceName] = useState<string>('');
  const [rate, setRate] = useState(1.05);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const playedIds = useRef<Set<string>>(new Set());
  const queue = useRef<NewsArticle[]>([]);
  const [nowPlaying, setNowPlaying] = useState<NewsArticle | null>(null);
  const speakingRef = useRef(false);

  // Load prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.enabled === 'boolean') setEnabled(p.enabled);
        if (p.filter) setFilter(p.filter);
        if (p.voiceName) setVoiceName(p.voiceName);
        if (p.rate) setRate(p.rate);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, filter, voiceName, rate })); } catch {}
  }, [enabled, filter, voiceName, rate]);

  // Initialize seen set on first mount with current articles so we don't replay history.
  useEffect(() => {
    if (playedIds.current.size === 0) {
      articles.forEach((a) => playedIds.current.add(a.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Voices
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices() ?? [];
      setVoices(v);
      if (!voiceName && v.length) {
        const en = v.find((x) => x.lang.startsWith('en')) ?? v[0];
        setVoiceName(en.name);
      }
    };
    load();
    window.speechSynthesis?.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', load);
  }, [voiceName]);

  // Detect new headlines and enqueue
  useEffect(() => {
    if (!enabled) return;
    const fresh = articles.filter((a) => !playedIds.current.has(a.id) && isEligible(a, filter));
    fresh.forEach((a) => playedIds.current.add(a.id));
    if (fresh.length === 0) return;
    queue.current.push(...fresh.slice(0, 5));
    pump();
  }, [articles, enabled, filter]);

  const pump = () => {
    if (!enabled) return;
    if (speakingRef.current) return;
    const next = queue.current.shift();
    if (!next) { setNowPlaying(null); return; }
    speakingRef.current = true;
    setNowPlaying(next);
    try {
      const u = new SpeechSynthesisUtterance(`${next.domain.replace(/^@/, '')}. ${next.title}`);
      const voice = voices.find((v) => v.name === voiceName);
      if (voice) u.voice = voice;
      u.rate = rate; u.pitch = 1; u.volume = 1;
      u.onend = () => { speakingRef.current = false; pump(); };
      u.onerror = () => { speakingRef.current = false; pump(); };
      window.speechSynthesis.speak(u);
    } catch {
      speakingRef.current = false;
    }
  };

  const skip = () => {
    try { window.speechSynthesis.cancel(); } catch {}
    speakingRef.current = false;
    pump();
  };

  const stopAll = () => {
    try { window.speechSynthesis.cancel(); } catch {}
    queue.current = [];
    setNowPlaying(null);
    speakingRef.current = false;
  };

  // External controls via CLI events
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ action: 'on' | 'off' | 'toggle' | 'filter'; filter?: Filter }>;
      const d = ev.detail;
      if (d.action === 'on') setEnabled(true);
      else if (d.action === 'off') { setEnabled(false); stopAll(); }
      else if (d.action === 'toggle') setEnabled((v) => { if (v) stopAll(); return !v; });
      else if (d.action === 'filter' && d.filter) setFilter(d.filter);
    };
    window.addEventListener('lovable:squawk', handler);
    return () => window.removeEventListener('lovable:squawk', handler);
  }, []);

  // Stop speaking on disable / unmount
  useEffect(() => { if (!enabled) stopAll(); }, [enabled]);
  useEffect(() => () => stopAll(), []);

  if (!open) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 w-72 bg-surface-deep border border-accent/40 font-mono shadow-2xl">
      <div className="flex items-center gap-1 border-b border-border bg-background px-2 py-1">
        <span className={`text-[9px] uppercase font-bold ${enabled ? 'text-accent animate-pulse' : 'text-muted-foreground'}`}>
          {enabled ? '● SQUAWK' : '○ SQUAWK'}
        </span>
        <span className="text-[9px] text-muted-foreground">· {filter}</span>
        <button
          onClick={() => setEnabled((v) => !v)}
          className="ml-auto text-[9px] uppercase font-bold text-accent hover:underline px-1"
        >
          {enabled ? 'PAUSE' : 'PLAY'}
        </button>
        <button onClick={onClose} className="text-[9px] uppercase font-bold text-muted-foreground hover:text-accent px-1">×</button>
      </div>

      <div className="px-2 py-2 space-y-2">
        <div className="flex items-center gap-1">
          {(['T1', 'T1+SEC', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] py-0.5 px-1.5 uppercase font-bold border ${
                filter === f ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:bg-surface-elevated'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={skip}
            disabled={!nowPlaying}
            className="ml-auto text-[9px] uppercase font-bold text-muted-foreground hover:text-accent flex items-center gap-1 disabled:opacity-30"
            title="Skip"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        <div className="text-[10px] text-foreground min-h-[42px] leading-tight">
          {nowPlaying ? (
            <>
              <div className="text-[9px] uppercase text-accent font-bold flex items-center gap-1">
                <Volume2 className="w-3 h-3 animate-pulse" /> playing
                <span className="ml-auto flex items-end gap-[2px] h-3" aria-hidden>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <span
                      key={i}
                      className="w-[2px] bg-accent"
                      style={{
                        height: `${30 + Math.abs(Math.sin((Date.now() / 120) + i) * 70)}%`,
                        animation: `squawkbar 0.${5 + i}s ease-in-out infinite alternate`,
                      }}
                    />
                  ))}
                </span>
              </div>
              <div className="line-clamp-2">{nowPlaying.title}</div>
              <style>{`@keyframes squawkbar { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
            </>
          ) : (
            <div className="text-muted-foreground flex items-center gap-1">
              <VolumeX className="w-3 h-3" /> {enabled ? `Listening for ${filter} headlines…` : 'Squawk paused'}
              {queue.current.length > 0 && <span>· {queue.current.length} queued</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">VOICE</span>
          <select
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="flex-1 bg-background border border-border text-[9px] text-foreground p-0.5"
          >
            {voices
              .filter((v) => v.lang.startsWith('en'))
              .slice(0, 12)
              .map((v) => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">RATE</span>
          <input
            type="range" min={0.7} max={1.6} step={0.05}
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-[9px] text-foreground w-8">{rate.toFixed(2)}×</span>
        </div>
      </div>
    </div>
  );
}
