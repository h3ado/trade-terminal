// MINT — Market Internals. TICK, TRIN, A/D, breadth, McClellan, Put/Call.
// Uses seeded deterministic data for intraday; swap with real feed when available.
import { useMemo, useState, useEffect } from 'react';
import CmdShell from './cmd/_shell/CmdShell';
import CmdTabs from './cmd/_shell/CmdTabs';

type Tab = 'breadth' | 'tick' | 'pcr' | 'ma';
const TABS: { id: Tab; label: string }[] = [
  { id: 'breadth', label: 'BREADTH' },
  { id: 'tick',    label: 'TICK/TRIN' },
  { id: 'pcr',     label: 'PUT/CALL' },
  { id: 'ma',      label: 'MA%' },
];

// ─── Seeded helpers ───────────────────────────────────────────────────────────
function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function seed(key: string, lo: number, hi: number) { return lo + (hash(key) / 0xffffffff) * (hi - lo); }

// Build 78 intraday bars (minute-level, 9:30→4:00)
function buildIntradayBars(todayKey: string) {
  const r = rng(hash(todayKey));
  const bars: { t: string; tick: number; adv: number; dec: number; uvol: number; dvol: number }[] = [];
  let cumTick = 0;
  for (let i = 0; i < 78; i++) {
    const h = 9 + Math.floor((30 + i * 5) / 60);
    const m = (30 + i * 5) % 60;
    const t = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    const tick = Math.round((r() - 0.5) * 1600);
    cumTick += tick * 0.1;
    const adv = Math.round(1200 + r() * 1400);
    const dec = Math.round(3400 - adv);
    const uvol = Math.round(500 + r() * 800);
    const dvol = Math.round(1300 - uvol * 0.5 + r() * 200);
    bars.push({ t, tick, adv, dec, uvol, dvol });
  }
  return bars;
}

// Build McClellan series (last 40 days)
function buildMcClellan(todayKey: string) {
  const r = rng(hash(todayKey + ':mcc'));
  let ema19 = 0, ema39 = 0, sum = 0;
  return Array.from({ length: 40 }, (_, i) => {
    const breadth = Math.round((r() - 0.48) * 400);
    ema19 = ema19 + (breadth - ema19) * (2 / 20);
    ema39 = ema39 + (breadth - ema39) * (2 / 40);
    sum += (ema19 - ema39);
    return { i, osc: +(ema19 - ema39).toFixed(1), sum: +sum.toFixed(0) };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiBox({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'pos' | 'neg' | 'neu' }) {
  const cls = tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-foreground';
  return (
    <div className="flex flex-col px-3 py-1.5 border-r border-border/50 last:border-r-0">
      <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`text-[13px] font-bold font-mono tabular-nums leading-tight ${cls}`}>{value}</span>
      {sub && <span className="text-[8px] text-muted-foreground tabular-nums">{sub}</span>}
    </div>
  );
}

function MiniBar({ v, max, pos }: { v: number; max: number; pos: boolean }) {
  const w = Math.min(100, Math.abs(v) / max * 100);
  return (
    <div className="flex-1 h-1.5 bg-surface-deep rounded-sm overflow-hidden">
      <div className={`h-full rounded-sm ${pos ? 'bg-positive' : 'bg-negative'}`} style={{ width: `${w}%` }} />
    </div>
  );
}

function TickChart({ bars }: { bars: { t: string; tick: number }[] }) {
  const maxAbs = Math.max(...bars.map(b => Math.abs(b.tick)), 500);
  const W = 600, H = 100, pad = 4;
  const x = (i: number) => pad + (i / (bars.length - 1)) * (W - 2 * pad);
  const y = (v: number) => H / 2 - (v / maxAbs) * (H / 2 - pad);
  const pts = bars.map((b, i) => `${x(i).toFixed(1)},${y(b.tick).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="none">
      <line x1={pad} y1={H/2} x2={W-pad} y2={H/2} stroke="hsl(var(--border))" strokeWidth="0.5" />
      <line x1={pad} y1={y(1000)} x2={W-pad} y2={y(1000)} stroke="hsl(var(--positive)/0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
      <line x1={pad} y1={y(-1000)} x2={W-pad} y2={y(-1000)} stroke="hsl(var(--negative)/0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
      <polyline points={pts} fill="none" stroke="hsl(var(--accent))" strokeWidth="1" />
    </svg>
  );
}

function ADChart({ bars }: { bars: { t: string; adv: number; dec: number }[] }) {
  let cum = 0;
  const series = bars.map(b => { cum += b.adv - b.dec; return cum; });
  const minV = Math.min(...series), maxV = Math.max(...series);
  const W = 600, H = 80, pad = 4;
  const x = (i: number) => pad + (i / (series.length - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - minV) / (maxV - minV || 1)) * (H - 2 * pad);
  const area = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline points={area} fill="none" stroke="hsl(var(--positive))" strokeWidth="1.2" />
    </svg>
  );
}

function OscChart({ pts }: { pts: { i: number; osc: number }[] }) {
  const maxAbs = Math.max(...pts.map(p => Math.abs(p.osc)), 10);
  const W = 300, H = 60, pad = 3;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - 2 * pad);
  const yMid = H / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <line x1={pad} y1={yMid} x2={W - pad} y2={yMid} stroke="hsl(var(--border))" strokeWidth="0.5" />
      {pts.map((p, i) => {
        const barH = (Math.abs(p.osc) / maxAbs) * (H / 2 - pad);
        const isPos = p.osc >= 0;
        return <rect key={i} x={x(i) - 2} y={isPos ? yMid - barH : yMid} width={4} height={barH} fill={`hsl(var(--${isPos ? 'positive' : 'negative'}) / 0.7)`} />;
      })}
    </svg>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function BreadthTab({ bars, mcl }: { bars: ReturnType<typeof buildIntradayBars>; mcl: ReturnType<typeof buildMcClellan> }) {
  const latest = bars[bars.length - 1];
  const totalAdv = bars.reduce((s, b) => s + b.adv, 0) / bars.length;
  const totalDec = bars.reduce((s, b) => s + b.dec, 0) / bars.length;
  const latestMcl = mcl[mcl.length - 1];
  const prevMcl   = mcl[mcl.length - 2];
  const mclTone = latestMcl.osc > 0 ? 'pos' : 'neg';
  const adDelta = latest.adv - latest.dec;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      {/* KPI strip */}
      <div className="flex border-b border-border bg-surface-deep flex-shrink-0">
        <KpiBox label="Adv/Dec" value={`${latest.adv}/${latest.dec}`} sub={`Δ ${adDelta > 0 ? '+' : ''}${adDelta}`} tone={adDelta > 0 ? 'pos' : 'neg'} />
        <KpiBox label="Up Vol / Dn Vol" value={`${latest.uvol}M/${latest.dvol}M`} tone={latest.uvol > latest.dvol ? 'pos' : 'neg'} />
        <KpiBox label="McClellan Osc" value={latestMcl.osc.toFixed(1)} sub={`Δ ${(latestMcl.osc - prevMcl.osc).toFixed(1)}`} tone={mclTone} />
        <KpiBox label="Summation Idx" value={latestMcl.sum.toFixed(0)} tone={latestMcl.sum > 0 ? 'pos' : 'neg'} />
        <KpiBox label="52W Highs/Lows" value={`${Math.round(seed('nh', 80, 280))}/${Math.round(seed('nl', 10, 90))}`} />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-0 overflow-hidden">
        {/* A/D Line */}
        <div className="border-r border-border flex flex-col p-2">
          <span className="text-[8px] text-accent font-bold uppercase tracking-widest mb-1">NYSE Cumulative A/D Line</span>
          <ADChart bars={bars} />
          <div className="mt-1 flex gap-4 text-[8px] font-mono text-muted-foreground">
            <span>Avg Adv: <b className="text-positive">{totalAdv.toFixed(0)}</b></span>
            <span>Avg Dec: <b className="text-negative">{totalDec.toFixed(0)}</b></span>
          </div>
        </div>

        {/* McClellan */}
        <div className="flex flex-col p-2">
          <span className="text-[8px] text-accent font-bold uppercase tracking-widest mb-1">McClellan Oscillator · 40D</span>
          <OscChart pts={mcl} />
          <div className="mt-2 text-[8px] font-mono text-muted-foreground">
            <span className="mr-3">Osc: <b className={latestMcl.osc > 0 ? 'text-positive' : 'text-negative'}>{latestMcl.osc}</b></span>
            <span>Sum: <b className={latestMcl.sum > 0 ? 'text-positive' : 'text-negative'}>{latestMcl.sum.toFixed(0)}</b></span>
          </div>
        </div>

        {/* Adv/Dec Bar table */}
        <div className="col-span-2 border-t border-border p-2 flex flex-col min-h-0">
          <span className="text-[8px] text-accent font-bold uppercase tracking-widest mb-1">Intraday Advance / Decline (last 20 bars)</span>
          <div className="flex flex-col gap-0.5 overflow-y-auto">
            {bars.slice(-20).map((b, i) => {
              const total = b.adv + b.dec;
              const advPct = total > 0 ? b.adv / total : 0.5;
              return (
                <div key={i} className="flex items-center gap-2 text-[8px] font-mono">
                  <span className="w-8 text-muted-foreground shrink-0">{b.t}</span>
                  <span className="w-10 text-right text-positive shrink-0">{b.adv}</span>
                  <div className="flex-1 h-2 bg-surface-deep rounded-sm overflow-hidden flex">
                    <div className="h-full bg-positive" style={{ width: `${advPct * 100}%` }} />
                    <div className="h-full bg-negative" style={{ width: `${(1 - advPct) * 100}%` }} />
                  </div>
                  <span className="w-10 text-left text-negative shrink-0">{b.dec}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TickTrinTab({ bars }: { bars: ReturnType<typeof buildIntradayBars> }) {
  const latest = bars[bars.length - 1];
  const trin = +(( (latest.adv / latest.dec) / (latest.uvol / latest.dvol) )).toFixed(2);
  const trinTone = trin < 0.85 ? 'pos' : trin > 1.25 ? 'neg' : 'neu';
  const tickTone = latest.tick > 600 ? 'pos' : latest.tick < -600 ? 'neg' : 'neu';

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex border-b border-border bg-surface-deep flex-shrink-0">
        <KpiBox label="NYSE TICK" value={latest.tick > 0 ? `+${latest.tick}` : `${latest.tick}`} sub="Current" tone={tickTone} />
        <KpiBox label="TICK Extreme" value={`±1000`} sub="Bull/Bear threshold" tone="neu" />
        <KpiBox label="TRIN (Arms)" value={trin.toFixed(2)} sub={trin < 1 ? 'Bullish' : 'Bearish'} tone={trinTone} />
        <KpiBox label="Up Volume" value={`${latest.uvol}M`} tone="pos" />
        <KpiBox label="Down Volume" value={`${latest.dvol}M`} tone="neg" />
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-1 gap-0 p-2 overflow-y-auto">
        <div>
          <span className="text-[8px] text-accent font-bold uppercase tracking-widest">NYSE TICK — Intraday (5-min bars)</span>
          <div className="mt-1 text-[8px] text-muted-foreground mb-1">Bands: ±1000 extreme zones shown dashed</div>
          <TickChart bars={bars} />
        </div>
        <div className="mt-3">
          <span className="text-[8px] text-accent font-bold uppercase tracking-widest">TRIN Reading Interpretation</span>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[9px] font-mono">
            {[
              { range: '< 0.75', label: 'Very Bullish', tone: 'text-positive' },
              { range: '0.75–1.00', label: 'Bullish', tone: 'text-positive/70' },
              { range: '1.00', label: 'Neutral', tone: 'text-muted-foreground' },
              { range: '1.00–1.25', label: 'Bearish', tone: 'text-negative/70' },
              { range: '> 1.25', label: 'Very Bearish', tone: 'text-negative' },
              { range: '> 2.00', label: 'Oversold / Capitulation', tone: 'text-accent' },
            ].map(r => (
              <div key={r.range} className="border border-border/40 p-1.5 rounded">
                <div className="text-[8px] text-muted-foreground">{r.range}</div>
                <div className={`font-bold ${r.tone}`}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PCRTab() {
  const equityPCR = +seed('epcr', 0.55, 0.95).toFixed(2);
  const indexPCR  = +seed('ipcr', 0.9, 1.6).toFixed(2);
  const cboe      = +seed('cpcr', 0.7, 1.1).toFixed(2);
  const isee      = Math.round(seed('isee', 70, 140));

  const spark = (key: string, lo: number, hi: number) =>
    Array.from({ length: 20 }, (_, i) => +(lo + (hash(key + i) / 0xffffffff) * (hi - lo)).toFixed(2));

  const pcrSeries = spark('epcr20', 0.5, 1.0);
  const W = 300, H = 60, pad = 4;
  const minV = Math.min(...pcrSeries), maxV = Math.max(...pcrSeries);
  const pts = pcrSeries.map((v, i) => {
    const x = pad + (i / (pcrSeries.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((v - minV) / (maxV - minV)) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const rows = [
    { label: 'CBOE Equity P/C Ratio', value: equityPCR, lo: 0.5, hi: 1.0, bullish: equityPCR < 0.7 },
    { label: 'CBOE Index P/C Ratio',  value: indexPCR,  lo: 0.9, hi: 1.6, bullish: indexPCR < 1.1 },
    { label: 'CBOE Total P/C Ratio',  value: cboe,      lo: 0.7, hi: 1.1, bullish: cboe < 0.85 },
    { label: 'ISEE Sentiment Index',  value: isee,      lo: 70,  hi: 140, bullish: isee > 110 },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex border-b border-border bg-surface-deep flex-shrink-0">
        <KpiBox label="Equity PCR" value={equityPCR.toFixed(2)} tone={equityPCR < 0.7 ? 'pos' : equityPCR > 0.9 ? 'neg' : 'neu'} />
        <KpiBox label="Index PCR"  value={indexPCR.toFixed(2)}  tone={indexPCR < 1.1 ? 'pos' : 'neg'} />
        <KpiBox label="CBOE Total" value={cboe.toFixed(2)}      tone={cboe < 0.85 ? 'pos' : 'neg'} />
        <KpiBox label="ISEE Index" value={isee.toString()}       sub={isee > 110 ? 'Bullish' : isee < 90 ? 'Bearish' : 'Neutral'} tone={isee > 110 ? 'pos' : isee < 90 ? 'neg' : 'neu'} />
      </div>
      <div className="flex-1 p-3 space-y-4">
        <div>
          <span className="text-[8px] text-accent font-bold uppercase tracking-widest">Equity PCR — 20-Day History</span>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14 mt-1" preserveAspectRatio="none">
            <line x1={pad} y1={H - pad - ((0.7 - minV)/(maxV - minV))*(H-2*pad)} x2={W-pad} y2={H - pad - ((0.7 - minV)/(maxV - minV))*(H-2*pad)} stroke="hsl(var(--positive)/0.4)" strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1={pad} y1={H - pad - ((0.9 - minV)/(maxV - minV))*(H-2*pad)} x2={W-pad} y2={H - pad - ((0.9 - minV)/(maxV - minV))*(H-2*pad)} stroke="hsl(var(--negative)/0.4)" strokeWidth="0.8" strokeDasharray="3,3" />
            <polyline points={pts} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.2" />
          </svg>
          <div className="flex text-[8px] text-muted-foreground justify-between mt-0.5">
            <span className="text-positive">{'< 0.7 Bullish'}</span>
            <span className="text-negative">{'> 0.9 Bearish'}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-3 text-[9px] font-mono">
              <span className="w-44 text-muted-foreground truncate">{r.label}</span>
              <span className={`w-10 text-right font-bold tabular-nums ${r.bullish ? 'text-positive' : 'text-negative'}`}>{r.value}</span>
              <div className="flex-1">
                <MiniBar v={r.value - r.lo} max={r.hi - r.lo} pos={r.bullish} />
              </div>
              <span className={`w-14 text-[8px] ${r.bullish ? 'text-positive' : 'text-negative'}`}>{r.bullish ? '▲ Bullish' : '▼ Bearish'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MAPercentTab() {
  const indices = [
    { name: 'S&P 500', sym: 'SPX' },
    { name: 'Nasdaq 100', sym: 'NDX' },
    { name: 'Russell 2000', sym: 'RUT' },
    { name: 'Dow Jones', sym: 'DJIA' },
  ];
  const mas = ['20MA', '50MA', '200MA'];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto p-2">
      <div className="text-[8px] text-muted-foreground mb-2">% of index members trading above moving average · Readings {'>'} 80% overbought, {'<'} 20% oversold</div>
      {indices.map(idx => {
        const vals = mas.map((m, mi) => +(seed(idx.sym + m, mi === 2 ? 30 : mi === 1 ? 40 : 50, mi === 2 ? 75 : 85) * 1).toFixed(1));
        return (
          <div key={idx.sym} className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-bold text-accent">{idx.sym}</span>
              <span className="text-[8px] text-muted-foreground">{idx.name}</span>
            </div>
            {vals.map((v, i) => {
              const tone = v > 80 ? 'text-negative' : v < 20 ? 'text-positive' : v > 60 ? 'text-positive/80' : 'text-muted-foreground';
              return (
                <div key={i} className="flex items-center gap-2 mb-1 text-[9px] font-mono">
                  <span className="w-12 text-muted-foreground">{mas[i]}</span>
                  <div className="flex-1 h-2 bg-surface-deep rounded-sm overflow-hidden">
                    <div className={`h-full rounded-sm ${v > 60 ? 'bg-positive' : v < 40 ? 'bg-negative' : 'bg-accent/60'}`} style={{ width: `${v}%` }} />
                  </div>
                  <span className={`w-10 text-right tabular-nums font-bold ${tone}`}>{v.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MarketInternals() {
  const [tab, setTab] = useState<Tab>('breadth');
  const [tick, setTick] = useState(0);

  // Cycle tick to simulate live data
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 5000); return () => clearInterval(id); }, []);

  const todayKey = `mint:${new Date().toISOString().slice(0, 10)}:${tick}`;
  const bars = useMemo(() => buildIntradayBars(todayKey), [todayKey]);
  const mcl  = useMemo(() => buildMcClellan(todayKey), [todayKey]);

  const latest = bars[bars.length - 1];
  const adDelta = latest.adv - latest.dec;

  return (
    <CmdShell
      code="MINT"
      title="Market Internals"
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="NYSE · NASDAQ breadth · TICK · TRIN · McClellan"
      footerRight={`A/D ${adDelta > 0 ? '+' : ''}${adDelta} · TICK ${latest.tick > 0 ? '+' : ''}${latest.tick} · SYNTHETIC DATA`}
    >
      {tab === 'breadth' && <BreadthTab bars={bars} mcl={mcl} />}
      {tab === 'tick'    && <TickTrinTab bars={bars} />}
      {tab === 'pcr'     && <PCRTab />}
      {tab === 'ma'      && <MAPercentTab />}
    </CmdShell>
  );
}
