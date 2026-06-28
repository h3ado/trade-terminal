import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { apiGet } from '@/lib/api';

interface FGEntry { value: string; value_classification: string; timestamp: string; time_until_update?: string }
interface FGData  { current: FGEntry | null; history: FGEntry[] }

function classColor(c: string) {
  const l = c.toLowerCase();
  if (l.includes('extreme fear'))  return 'text-negative';
  if (l.includes('fear'))          return 'text-orange-400';
  if (l.includes('neutral'))       return 'text-muted-foreground';
  if (l.includes('extreme greed')) return 'text-positive';
  if (l.includes('greed'))         return 'text-green-500';
  return 'text-foreground';
}
function classBg(c: string) {
  const l = c.toLowerCase();
  if (l.includes('extreme fear'))  return 'bg-negative/15 border-negative/30';
  if (l.includes('fear'))          return 'bg-orange-400/15 border-orange-400/30';
  if (l.includes('neutral'))       return 'bg-border/30 border-border';
  if (l.includes('extreme greed')) return 'bg-positive/15 border-positive/30';
  if (l.includes('greed'))         return 'bg-green-500/15 border-green-500/30';
  return 'bg-surface-elevated border-border';
}

function fmtTs(ts: string) {
  try { return new Date(parseInt(ts) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return ts; }
}

// Arc gauge — semicircle, no SVG rotation hacks, pure path math
function ArcGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const angle = (pct / 100) * 180; // 0 = left, 180 = right
  const RAD = Math.PI / 180;
  const cx = 80; const cy = 72; const R = 55;
  // Start of arc = left (180°), end at current angle from left
  const arcEnd = 180 - angle; // angle from positive-x axis
  const ex = cx + R * Math.cos(arcEnd * RAD);
  const ey = cy - R * Math.sin(arcEnd * RAD);
  const largeArc = angle > 180 ? 1 : 0;
  // Colored arc segment color
  const col = pct < 25 ? '#d63333' : pct < 45 ? '#f97316' : pct < 55 ? '#737373' : pct < 75 ? '#22c55e' : '#38a838';
  // Needle tip
  const needleAngle = 180 - angle;
  const nx = cx + (R - 6) * Math.cos(needleAngle * RAD);
  const ny = cy - (R - 6) * Math.sin(needleAngle * RAD);

  return (
    <svg viewBox="0 0 160 90" className="w-full" style={{ maxHeight: 90 }}>
      {/* Track */}
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="butt" />
      {/* Filled arc */}
      {angle > 0 && (
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 ${largeArc} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
          fill="none" stroke={col} strokeWidth="10" strokeLinecap="butt" />
      )}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx.toFixed(1)} y2={ny.toFixed(1)} stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3" fill="hsl(var(--foreground))" />
      {/* Zone labels */}
      <text x="18" y="86" fontSize="6.5" fill="#d63333"   fontFamily="monospace" textAnchor="middle">FEAR</text>
      <text x="80" y="22" fontSize="6.5" fill="#737373"   fontFamily="monospace" textAnchor="middle">NEUTRAL</text>
      <text x="142" y="86" fontSize="6.5" fill="#38a838" fontFamily="monospace" textAnchor="middle">GREED</text>
    </svg>
  );
}

function Ph({ label, right }: { label: string; right?: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-[3px] border-b border-border bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{label}</span>
      {right && <span className="text-[7px] text-muted-foreground">{right}</span>}
    </div>
  );
}

export default function CryptoSentiment() {
  const [data, setData] = useState<FGData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiGet<FGData>('/api/market/crypto/fear-greed'); setData(d); }
    catch { setData(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cur = data?.current;
  const val = cur ? parseInt(cur.value) : 50;

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">

      {/* Header */}
      <div className="shrink-0 border-b border-border bg-surface-elevated flex items-center px-3 py-1.5 gap-2">
        <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Crypto Sentiment</span>
        {cur && (
          <span className={`text-[8px] font-bold uppercase px-2 py-0.5 border ${classBg(cur.value_classification)} ${classColor(cur.value_classification)}`}>
            {cur.value_classification}
          </span>
        )}
        {cur?.time_until_update && (
          <span className="text-[7px] text-muted-foreground">updates in {cur.time_until_update}</span>
        )}
        <button onClick={load} disabled={loading} className="ml-auto text-muted-foreground hover:text-accent disabled:opacity-40">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-[10px] animate-pulse">Loading…</div>
      )}

      {!loading && (
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* LEFT: Gauge */}
          <div className="w-[45%] shrink-0 border-r border-border flex flex-col min-h-0">
            <Ph label="Fear & Greed Index" right="Alternative.me" />

            {/* Gauge + big number */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-2">
              <ArcGauge value={val} />
              <div className="mt-1 text-center">
                <div className={`text-[36px] font-bold tabular-nums leading-none ${classColor(cur?.value_classification ?? '')}`}>
                  {val}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${classColor(cur?.value_classification ?? '')}`}>
                  {cur?.value_classification ?? '—'}
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="shrink-0 border-t border-border">
              <Ph label="Scale Reference" />
              <div className="px-2 py-1 space-y-0">
                {[
                  { r: '0–24',   l: 'Extreme Fear',  c: 'text-negative' },
                  { r: '25–44',  l: 'Fear',           c: 'text-orange-400' },
                  { r: '45–55',  l: 'Neutral',        c: 'text-muted-foreground' },
                  { r: '56–74',  l: 'Greed',          c: 'text-green-500' },
                  { r: '75–100', l: 'Extreme Greed',  c: 'text-positive' },
                ].map(s => (
                  <div key={s.r} className="flex justify-between py-[2px] border-b border-border/20">
                    <span className="text-[8px] text-muted-foreground tabular-nums">{s.r}</span>
                    <span className={`text-[8px] font-semibold ${s.c}`}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: 30-day chart + condensed history */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">

            {/* 30-day area chart */}
            <Ph label="30-Day Trend" right="Alternative.me" />
            <div className="h-[110px] shrink-0 border-b border-border px-1 py-1">
              {(data?.history ?? []).length > 0 && (() => {
                const chartData = [...(data?.history ?? [])].reverse().map(h => ({
                  date: fmtTs(h.timestamp),
                  value: parseInt(h.value),
                  fill: parseInt(h.value) < 25 ? '#d63333'
                      : parseInt(h.value) < 45 ? '#f97316'
                      : parseInt(h.value) < 55 ? '#737373'
                      : parseInt(h.value) < 75 ? '#22c55e'
                      : '#38a838',
                }));
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fg-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                      <ReferenceLine y={25} stroke="#d63333" strokeDasharray="2 2" strokeWidth={0.7} />
                      <ReferenceLine y={45} stroke="#737373" strokeDasharray="2 2" strokeWidth={0.7} />
                      <ReferenceLine y={55} stroke="#737373" strokeDasharray="2 2" strokeWidth={0.7} />
                      <ReferenceLine y={75} stroke="#38a838" strokeDasharray="2 2" strokeWidth={0.7} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--surface-elevated))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 9, padding: '3px 6px' }}
                        formatter={(v: number) => [v, 'Score']}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                      />
                      <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={1} fill="url(#fg-gradient)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            {/* Condensed 10-row history table */}
            <Ph label="Recent History" />
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-surface-deep">
                  <tr className="border-b border-border">
                    <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">Date</th>
                    <th className="text-center px-2 py-1 text-[8px] text-muted-foreground font-normal">Score</th>
                    <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.history ?? []).slice(0, 14).map((h, i) => {
                    const v = parseInt(h.value);
                    const col = classColor(h.value_classification);
                    return (
                      <tr key={i} className="border-b border-border/20 hover:bg-surface-elevated">
                        <td className="px-2 py-1 text-muted-foreground tabular-nums">{fmtTs(h.timestamp)}</td>
                        <td className="px-2 py-1 text-center">
                          <span className={`text-[11px] font-bold tabular-nums ${col}`}>{v}</span>
                        </td>
                        <td className={`px-2 py-1 text-right font-semibold text-[8px] ${col}`}>
                          {h.value_classification}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Market context */}
            <div className="shrink-0 border-t border-border">
              <Ph label="Market Context" />
              <div className="px-2 py-1 space-y-0">
                {[
                  { l: 'Below 20', v: 'Historically strong buy signal' },
                  { l: 'Above 80', v: 'Consider taking profits' },
                  { l: 'Inputs',   v: 'Volatility · Momentum · Social · Dominance' },
                ].map(r => (
                  <div key={r.l} className="flex gap-2 justify-between py-[2px] border-b border-border/20">
                    <span className="text-[7px] text-muted-foreground shrink-0">{r.l}</span>
                    <span className="text-[7px] text-foreground text-right">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
