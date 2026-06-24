// FFIP — Fed-Funds Implied Probabilities. Sub-tabs: MATRIX, CURVE, SHIFT,
// SCENARIOS. WIRP-style synthetic model: linear path to user-set terminal
// with √t-growing Gaussian uncertainty around each meeting's expected rate.
import { useMemo, useState } from 'react';
import { useFRED } from '@/hooks/useFRED';
import { FOMC_MEETINGS } from '@/data/fomc';
import CmdShell from './_shell/CmdShell';
import CmdTabs from './_shell/CmdTabs';
import { Sparkline } from './_shell/charts';

type Tab = 'MATRIX' | 'CURVE' | 'SHIFT' | 'SCENARIOS';

function ncdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * ax);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1.0 + sign * y);
}

function bucketProbs(expected: number, sigma: number, buckets: number[]): number[] {
  const half = 0.125;
  const raw = buckets.map((b, i) => {
    const lo = i === 0 ? -Infinity : (b - half - expected) / sigma;
    const hi = (b + half - expected) / sigma;
    return ncdf(hi) - ncdf(lo);
  });
  const sum = raw.reduce((s, p) => s + p, 0);
  return raw.map(p => p / sum);
}

const heat = (p: number) => {
  if (p < 0.02) return 'bg-transparent text-muted-foreground/50';
  if (p < 0.10) return 'bg-accent/10 text-foreground';
  if (p < 0.25) return 'bg-accent/25 text-foreground font-bold';
  if (p < 0.50) return 'bg-accent/45 text-background font-bold';
  return 'bg-accent text-background font-bold';
};

const SCENARIOS = [
  { id: 'easing', label: 'Easing 100bp', dTerm: -1.00, dSigma: 0.0,  desc: 'Soft landing; 4 cuts over 12mo' },
  { id: 'base',   label: 'Base Case',    dTerm: -0.50, dSigma: 0.0,  desc: 'Linear path to terminal − 50bp' },
  { id: 'hold',   label: 'Hold',         dTerm:  0.00, dSigma: 0.0,  desc: 'Higher for longer' },
  { id: 'hike',   label: 'Re-Hike 50bp', dTerm: +0.50, dSigma: +0.1, desc: 'Sticky inflation forces re-tightening' },
  { id: 'shock',  label: 'Recession Shock', dTerm: -1.75, dSigma: +0.25, desc: 'Hard landing; emergency cuts' },
];

export default function FFIP() {
  const fred = useFRED();
  const current = fred.byKey['fed_funds']?.value ?? 4.50;
  const [tab, setTab] = useState<Tab>('MATRIX');
  const [terminal, setTerminal] = useState<number>(+(current - 0.50).toFixed(2));
  const [sigma, setSigma] = useState<number>(0.30);

  const upcoming = useMemo(() => FOMC_MEETINGS.filter(m => m.status === 'Upcoming').slice(0, 8), []);
  const buckets = useMemo(() => {
    const out: number[] = [];
    for (let i = -5; i <= 5; i++) out.push(+(current + i * 0.25).toFixed(2));
    return out;
  }, [current]);

  const matrix = useMemo(() => {
    const n = upcoming.length;
    return upcoming.map((m, i) => {
      const t = (i + 1) / Math.max(n, 1);
      const expected = current + (terminal - current) * t;
      const sd = sigma * Math.sqrt(i + 1);
      const probs = bucketProbs(expected, sd, buckets);
      const dBps = Math.round((expected - current) * 400) * 25;
      return { meeting: m, expected, sd, probs, dBps };
    });
  }, [upcoming, terminal, sigma, current, buckets]);

  const meetingMoves = matrix.map(row => {
    const idx = buckets.findIndex(b => Math.abs(b - current) < 0.01);
    const cut = row.probs.slice(0, idx).reduce((s, p) => s + p, 0);
    const hold = row.probs[idx] ?? 0;
    const hike = row.probs.slice(idx + 1).reduce((s, p) => s + p, 0);
    return { cut, hold, hike };
  });

  // Probability bands (10/50/90) for curve view
  const bands = matrix.map(row => {
    const mean = row.expected;
    return { date: row.meeting.date, lo: mean - 1.28 * row.sd, mid: mean, hi: mean + 1.28 * row.sd };
  });

  // Scenarios comparison — show implied 12mo terminal under each
  const scenarioRows = SCENARIOS.map(s => {
    const term = +(current + s.dTerm).toFixed(2);
    const sig = +(sigma + s.dSigma).toFixed(2);
    return {
      ...s, term, sig,
      delta: Math.round(s.dTerm * 400) * 25,
      curve: upcoming.map((_, i) => current + (term - current) * ((i + 1) / upcoming.length)),
    };
  });

  return (
    <CmdShell
      code="FFIP"
      title="Fed-Funds Implied Probabilities · WIRP-Style Synthetic Model"
      headerRight={<span className="text-[9px] font-mono text-muted-foreground uppercase">{upcoming.length} meetings forward · σ √t</span>}
      tabs={<CmdTabs tabs={[{ id: 'MATRIX', label: 'Matrix' }, { id: 'CURVE', label: 'Curve' }, { id: 'SHIFT', label: 'Shift' }, { id: 'SCENARIOS', label: 'Scenarios' }]} active={tab} onChange={setTab} />}
      kpis={
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1">
          <div className="border border-border bg-surface-deep p-2">
            <div className="text-[9px] font-mono uppercase text-muted-foreground">Current Fed Funds</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-accent">{current.toFixed(2)}%</div>
            <div className="text-[9px] font-mono text-muted-foreground">FRED DFEDTARU live</div>
          </div>
          <div className="border border-border bg-surface-deep p-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Implied Terminal (12mo)</span>
              <span className="text-[11px] font-mono font-bold tabular-nums">{terminal.toFixed(2)}%</span>
            </div>
            <input type="range" min={current - 2} max={current + 2} step={0.125} value={terminal} onChange={e => setTerminal(parseFloat(e.target.value))} className="w-full mt-1 accent-accent" />
            <div className={`text-[10px] font-mono mt-0.5 tabular-nums ${terminal < current ? 'text-positive' : terminal > current ? 'text-negative' : 'text-muted-foreground'}`}>
              Δ {Math.round((terminal - current) * 400) * 25} bps over horizon
            </div>
          </div>
          <div className="border border-border bg-surface-deep p-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Uncertainty σ (mtg 1)</span>
              <span className="text-[11px] font-mono font-bold tabular-nums">{sigma.toFixed(2)}%</span>
            </div>
            <input type="range" min={0.10} max={1.00} step={0.05} value={sigma} onChange={e => setSigma(parseFloat(e.target.value))} className="w-full mt-1 accent-accent" />
            <div className="text-[10px] font-mono mt-0.5 text-muted-foreground">σ grows √t per meeting</div>
          </div>
        </div>
      }
      footerLeft="FFIP <GO> · Model: Gaussian shock around linear path · σ grows √t"
      footerRight="Adjust terminal & σ above to back-out market-implied scenarios"
    >
      <div className="h-full overflow-auto p-1">

        {tab === 'MATRIX' && (
          <div className="space-y-1">
            <div className="border border-border bg-surface-deep">
              <div className="px-2 py-1 border-b border-border flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-accent">Rate Probability Matrix (%)</span>
                <span className="text-[9px] font-mono text-muted-foreground">Rows = meetings · Cols = rate level</span>
              </div>
              <div className="overflow-auto">
                <table className="w-full border-collapse">
                  <thead><tr className="border-b border-border">
                    <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase text-muted-foreground sticky left-0 bg-surface-deep">Meeting</th>
                    <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground">Exp.</th>
                    <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground">Δbps</th>
                    {buckets.map(b => (
                      <th key={b} className={`px-1 py-1 text-right text-[9px] font-mono font-bold uppercase ${Math.abs(b - current) < 0.01 ? 'text-accent' : 'text-muted-foreground'}`}>{b.toFixed(2)}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {matrix.map(row => (
                      <tr key={row.meeting.date} className="border-b border-border/40">
                        <td className="px-2 py-0.5 text-[11px] font-mono font-bold sticky left-0 bg-background">{row.meeting.date} <span className="text-[9px] text-muted-foreground ml-1">{row.meeting.type === 'SEP' ? 'SEP' : ''}</span></td>
                        <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-accent font-bold">{row.expected.toFixed(2)}%</td>
                        <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums font-bold ${row.dBps < 0 ? 'text-positive' : row.dBps > 0 ? 'text-negative' : 'text-muted-foreground'}`}>{row.dBps === 0 ? '0' : `${row.dBps > 0 ? '+' : ''}${row.dBps}`}</td>
                        {row.probs.map((p, i) => (
                          <td key={i} className={`px-1 py-0.5 text-right text-[10px] font-mono tabular-nums ${heat(p)}`}>{p < 0.005 ? '·' : (p * 100).toFixed(p > 0.10 ? 0 : 1)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-border bg-surface-deep">
              <div className="px-2 py-1 border-b border-border"><span className="text-[9px] font-mono uppercase tracking-wider text-accent">Per-Meeting Move Probability</span></div>
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-border">
                  {['Meeting', 'Cut', 'Hold', 'Hike', 'Most Likely'].map((h, i) => (
                    <th key={h} className={`px-2 py-1 text-[9px] font-mono font-bold uppercase text-muted-foreground ${i >= 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {matrix.map((row, i) => {
                    const m = meetingMoves[i];
                    const best = m.cut > m.hold && m.cut > m.hike ? 'CUT' : m.hike > m.hold ? 'HIKE' : 'HOLD';
                    const bestPct = Math.max(m.cut, m.hold, m.hike);
                    return (
                      <tr key={row.meeting.date} className="border-b border-border/40 hover:bg-surface-elevated">
                        <td className="px-2 py-0.5 text-[11px] font-mono font-bold">{row.meeting.date}</td>
                        <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-positive">{(m.cut * 100).toFixed(1)}%</td>
                        <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-foreground">{(m.hold * 100).toFixed(1)}%</td>
                        <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-negative">{(m.hike * 100).toFixed(1)}%</td>
                        <td className={`px-2 py-0.5 text-right text-[11px] font-mono font-bold ${best === 'CUT' ? 'text-positive' : best === 'HIKE' ? 'text-negative' : 'text-foreground'}`}>{best} <span className="text-muted-foreground">({(bestPct * 100).toFixed(0)}%)</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'CURVE' && (
          <div className="border border-border bg-surface-deep p-2">
            <div className="text-[9px] font-mono uppercase tracking-wider text-accent mb-1">Implied Rate Path with 80% Confidence Band</div>
            <div className="relative" style={{ height: 280 }}>
              {(() => {
                const W = 920, H = 260;
                const min = Math.min(...bands.map(b => b.lo)) - 0.25;
                const max = Math.max(...bands.map(b => b.hi)) + 0.25;
                const xs = (i: number) => 60 + (i / (bands.length - 1)) * (W - 80);
                const ys = (v: number) => H - ((v - min) / (max - min)) * H;
                const midPath = bands.map((b, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(b.mid)}`).join(' ');
                const areaPath = `M${xs(0)},${ys(bands[0].lo)} ` + bands.map((b, i) => `L${xs(i)},${ys(b.lo)}`).join(' ') + ` ` + bands.slice().reverse().map((b, j) => `L${xs(bands.length - 1 - j)},${ys(b.hi)}`).join(' ') + ' Z';
                return (
                  <svg width={W} height={H}>
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                      const y = t * H, r = max - (max - min) * t;
                      return <g key={t}><line x1={60} x2={W} y1={y} y2={y} className="stroke-border" /><text x={2} y={y + 3} className="fill-muted-foreground text-[9px] font-mono">{r.toFixed(2)}</text></g>;
                    })}
                    <path d={areaPath} className="fill-accent/20" />
                    <path d={midPath} className="stroke-accent" strokeWidth={2} fill="none" />
                    <line x1={60} x2={W} y1={ys(current)} y2={ys(current)} className="stroke-foreground" strokeDasharray="4,2" />
                    {bands.map((b, i) => <circle key={i} cx={xs(i)} cy={ys(b.mid)} r={4} className="fill-accent" />)}
                    {bands.map((b, i) => <text key={i} x={xs(i)} y={H - 2} className="fill-muted-foreground text-[8px] font-mono" textAnchor="middle">{b.date.slice(5)}</text>)}
                  </svg>
                );
              })()}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground mt-1">Solid line = expected path. Shaded band = 10–90% confidence (±1.28σ). Dashed = current rate.</div>
          </div>
        )}

        {tab === 'SHIFT' && (
          <div className="border border-border bg-surface-deep p-2 space-y-2">
            <div className="text-[9px] font-mono uppercase tracking-wider text-accent">Parallel Shift Sensitivity</div>
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-border">
                <th className="px-2 py-1 text-left text-[9px] font-mono font-bold uppercase text-muted-foreground">Shift</th>
                <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground">New Terminal</th>
                <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground">12mo Δ</th>
                <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground">P(Cut by mtg 4)</th>
                <th className="px-2 py-1 text-right text-[9px] font-mono font-bold uppercase text-muted-foreground">P(Cut by mtg 8)</th>
              </tr></thead>
              <tbody>
                {[-1.00, -0.75, -0.50, -0.25, 0, +0.25, +0.50, +0.75, +1.00].map(shift => {
                  const term = +(current + shift).toFixed(2);
                  const path = upcoming.map((_, i) => current + (term - current) * ((i + 1) / upcoming.length));
                  const idx = buckets.findIndex(b => Math.abs(b - current) < 0.01);
                  const pCut = (mtg: number) => {
                    const sd = sigma * Math.sqrt(mtg);
                    const exp = path[mtg - 1];
                    return bucketProbs(exp, sd, buckets).slice(0, idx).reduce((s, p) => s + p, 0);
                  };
                  return (
                    <tr key={shift} className={`border-b border-border/40 ${Math.abs(shift) < 0.01 ? 'bg-surface-elevated/50' : ''}`}>
                      <td className={`px-2 py-0.5 text-[11px] font-mono font-bold tabular-nums ${shift < 0 ? 'text-positive' : shift > 0 ? 'text-negative' : 'text-muted-foreground'}`}>{shift > 0 ? '+' : ''}{(shift * 100).toFixed(0)}bp</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums">{term.toFixed(2)}%</td>
                      <td className={`px-2 py-0.5 text-right text-[11px] font-mono tabular-nums ${shift < 0 ? 'text-positive' : shift > 0 ? 'text-negative' : 'text-muted-foreground'}`}>{shift > 0 ? '+' : ''}{Math.round(shift * 400) * 25}bp</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-positive">{(pCut(4) * 100).toFixed(1)}%</td>
                      <td className="px-2 py-0.5 text-right text-[11px] font-mono tabular-nums text-positive">{(pCut(8) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'SCENARIOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1">
            {scenarioRows.map(s => (
              <div key={s.id} className="border border-border bg-surface-deep p-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-mono font-bold text-accent uppercase">{s.label}</span>
                  <span className={`text-[10px] font-mono font-bold tabular-nums ${s.delta < 0 ? 'text-positive' : s.delta > 0 ? 'text-negative' : 'text-muted-foreground'}`}>{s.delta > 0 ? '+' : ''}{s.delta}bp</span>
                </div>
                <div className="text-2xl font-mono font-bold tabular-nums mt-1">{s.term.toFixed(2)}%</div>
                <div className="text-[10px] font-mono text-muted-foreground italic mt-0.5">{s.desc}</div>
                <div className="text-accent mt-2"><Sparkline data={[current, ...s.curve]} w={280} h={48} fill="currentColor" /></div>
                <button onClick={() => { setTerminal(s.term); setSigma(s.sig); setTab('CURVE'); }} className="mt-2 w-full text-[10px] font-mono uppercase border border-border hover:border-accent text-foreground hover:text-accent py-0.5">Apply scenario →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CmdShell>
  );
}
