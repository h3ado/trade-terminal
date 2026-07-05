// INDX — Market Indicators Dashboard (BREADTH / MOMENTUM / CORRELATION / PARTICIPATION)
// All data: seeded() deterministic model data — footer shows MODEL DATA
import { useState } from 'react';
import { seeded } from '@/components/options/shared/mockSeries';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// ── palette ────────────────────────────────────────────────────────────────────
const A = '#f97316'; // accent orange
const POS = '#22c55e';
const NEG = '#ef4444';
const AMB = '#f59e0b';
const GRID = '#1a1a2e';
const BG = '#0a0a0f';
const TEXT = '#8b8b9e';

// ── shared seeded data ─────────────────────────────────────────────────────────
const rng = seeded('INDX', 'main');
const rng60 = seeded('INDX', '60d');
const rng90 = seeded('INDX', '90d');

function sparkSeries(salt: string, n = 30, base = 50, range = 30) {
  const r = seeded('INDX', salt);
  let v = base;
  return Array.from({ length: n }, (_, i) => {
    v = Math.max(5, Math.min(95, v + (r() - 0.5) * range * 0.4));
    return { i, v: +v.toFixed(1) };
  });
}

function corrMatrix(salt: string) {
  const r = seeded('CORR', salt);
  const tickers = ['SPX', 'TLT', 'GLD', 'USO', 'BTC', 'DXY', 'VIX'];
  const n = tickers.length;
  const mat: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    mat[i][i] = 1;
    for (let j = i + 1; j < n; j++) {
      const v = parseFloat(((r() - 0.5) * 2).toFixed(2));
      mat[i][j] = v; mat[j][i] = v;
    }
  }
  return { tickers, mat };
}

// ── ArcDial SVG component ──────────────────────────────────────────────────────
function ArcDial({ score, size = 120 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size * 0.72;
  const r = size * 0.38;
  const startAngle = Math.PI, endAngle = 0; // left=0, right=100, semicircle
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const angle = startAngle - pct * Math.PI;
  const nx = cx + r * Math.cos(angle), ny = cy + r * Math.sin(angle);
  const bgPath = `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;
  const fgAngle = startAngle - pct * Math.PI;
  const fx = cx + r * Math.cos(fgAngle), fy = cy + r * Math.sin(fgAngle);
  const color = score >= 70 ? POS : score >= 55 ? '#86efac' : score >= 45 ? AMB : score >= 30 ? '#fca5a5' : NEG;
  const sweepPath = pct > 0
    ? `M ${cx - r},${cy} A ${r},${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${fx},${fy}`
    : '';
  const needleLen = r * 0.85;
  const nx2 = cx + needleLen * Math.cos(angle), ny2 = cy + needleLen * Math.sin(angle);

  return (
    <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
      <path d={bgPath} fill="none" stroke={GRID} strokeWidth={size * 0.06} strokeLinecap="round" />
      {sweepPath && <path d={sweepPath} fill="none" stroke={color} strokeWidth={size * 0.06} strokeLinecap="round" />}
      <line x1={cx} y1={cy} x2={nx2} y2={ny2} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.025} fill={color} />
      <text x={cx} y={cy - r * 0.25} textAnchor="middle" fill={color} fontSize={size * 0.14} fontFamily="monospace" fontWeight="bold">{score}</text>
    </svg>
  );
}

// ── GaugeBar (horizontal) ──────────────────────────────────────────────────────
function GaugeBar({ value, min, max, neutral, label, posLabel, negLabel }: {
  value: number; min: number; max: number; neutral: number; label: string; posLabel: string; negLabel: string;
}) {
  const range = max - min;
  const neutralPct = ((neutral - min) / range) * 100;
  const valPct = ((value - min) / range) * 100;
  const isBull = value > neutral;
  const color = isBull ? POS : NEG;
  const barLeft = isBull ? neutralPct : valPct;
  const barWidth = Math.abs(valPct - neutralPct);

  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
        <span>{label}</span>
        <span style={{ color }} className="font-bold">{value >= 0 ? '+' : ''}{value.toFixed(0)}</span>
      </div>
      <div className="relative h-3 bg-[#111827] rounded">
        <div className="absolute inset-y-0 rounded" style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: color, opacity: 0.8 }} />
        <div className="absolute inset-y-0 w-px bg-[#6b7280]" style={{ left: `${neutralPct}%` }} />
      </div>
      <div className="flex justify-between text-[8px] font-mono text-muted-foreground/60">
        <span>{negLabel}</span><span>{posLabel}</span>
      </div>
    </div>
  );
}

// ── MiniSpark ──────────────────────────────────────────────────────────────────
function MiniSpark({ data, color = A }: { data: { i: number; v: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1} fill={`url(#sg-${color.slice(1)})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── ── ── ── ── ── ── ── BREADTH TAB ── ── ── ── ── ── ── ────────────────────

const pct50 = +(40 + rng() * 40).toFixed(1);
const pct200 = +(30 + rng() * 40).toFixed(1);
const netAD = +((rng() - 0.5) * 2000).toFixed(0);
const nHigh = Math.floor(50 + rng() * 350);
const nLow = Math.floor(20 + rng() * 200);
const tick = +((rng() - 0.5) * 2200).toFixed(0);
const trin = +(0.3 + rng() * 2.5).toFixed(2);

const adSpark = sparkSeries('ad', 30, 50, 25);
const pct50Spark = sparkSeries('pct50', 30, pct50, 20);

function BreadthTab() {
  const kpis = [
    { label: '% > 50MA', value: pct50 + '%', color: pct50 > 55 ? POS : pct50 > 40 ? AMB : NEG },
    { label: '% > 200MA', value: pct200 + '%', color: pct200 > 55 ? POS : pct200 > 40 ? AMB : NEG },
    { label: 'Net A/D', value: (netAD >= 0 ? '+' : '') + netAD, color: netAD >= 0 ? POS : NEG },
    { label: 'New Highs', value: nHigh, color: POS },
    { label: 'New Lows', value: nLow, color: NEG },
    { label: 'NH/NL', value: (nHigh / (nLow || 1)).toFixed(2), color: nHigh > nLow ? POS : NEG },
  ];

  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      {/* KPI row */}
      <div className="grid grid-cols-6 gap-2">
        {kpis.map(kpi => (
          <div key={kpi.label} className="border border-[#1a1a2e] p-2 text-center">
            <div className="text-[8px] font-mono text-muted-foreground mb-0.5">{kpi.label}</div>
            <div className="text-[14px] font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-[#1a1a2e] p-3 space-y-2">
          <div className="text-[9px] font-mono text-muted-foreground">NYSE TICK</div>
          <GaugeBar value={tick} min={-2000} max={2000} neutral={0} label="TICK" posLabel="BULLISH +2000" negLabel="-2000 BEARISH" />
          <div className="text-[8px] font-mono text-muted-foreground/60 mt-1">
            {Math.abs(tick) > 1000 ? (tick > 0 ? 'Extreme buying pressure' : 'Extreme selling pressure') : 'Neutral / moderate activity'}
          </div>
        </div>
        <div className="border border-[#1a1a2e] p-3 space-y-2">
          <div className="text-[9px] font-mono text-muted-foreground">ARMS INDEX (TRIN)</div>
          <GaugeBar value={trin} min={0} max={3} neutral={1.0} label="TRIN" posLabel="BEARISH 3.0" negLabel="0.0 BULLISH" />
          <div className="text-[8px] font-mono text-muted-foreground/60 mt-1">
            {trin < 0.7 ? 'Very bullish (arms < 0.7)' : trin < 1.1 ? 'Slightly bullish / neutral' : trin < 2 ? 'Bearish (arms > 1)' : 'Very bearish (arms > 2)'}
          </div>
        </div>
      </div>

      {/* Sparklines */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-[#1a1a2e] p-3">
          <div className="text-[9px] font-mono text-muted-foreground mb-1">30D Advance/Decline</div>
          <MiniSpark data={adSpark} color={netAD >= 0 ? POS : NEG} />
        </div>
        <div className="border border-[#1a1a2e] p-3">
          <div className="text-[9px] font-mono text-muted-foreground mb-1">30D % above 50MA</div>
          <MiniSpark data={pct50Spark} color={pct50 > 55 ? POS : pct50 > 40 ? AMB : NEG} />
        </div>
      </div>

      <div className="text-[8px] font-mono text-muted-foreground/50 border-t border-[#1a1a2e] pt-2">
        BREADTH measures the participation of individual stocks in a market move. High breadth (most stocks rising) is healthy; low breadth (only a few large-caps driving gains) is a divergence warning.
      </div>
    </div>
  );
}

// ── ── ── ── ── ── ── ── MOMENTUM TAB ── ── ── ── ── ── ── ───────────────────

const indices = ['SPX', 'NDX', 'RUT', 'DJI', 'IWM'];
const indexData = indices.map(sym => {
  const r = seeded('IDXM', sym);
  return {
    sym,
    rsi: +(30 + r() * 60).toFixed(1),
    macd: r() > 0.5 ? 'BULL' : 'BEAR',
    stochK: +(15 + r() * 75).toFixed(1),
    adx: +(15 + r() * 50).toFixed(1),
  };
});
const compScore = Math.round(
  indexData.reduce((s, d) => s + ((d.rsi - 30) / 40 * 100 + (d.macd === 'BULL' ? 65 : 35) + d.stochK + Math.min(d.adx, 50)) / 4, 0) / indexData.length
);
const regimes = [
  { min: 75, label: 'STRONGLY BULLISH', color: POS },
  { min: 60, label: 'BULLISH', color: '#86efac' },
  { min: 40, label: 'NEUTRAL', color: AMB },
  { min: 25, label: 'BEARISH', color: '#fca5a5' },
  { min: 0, label: 'STRONGLY BEARISH', color: NEG },
];
const regime = regimes.find(r => compScore >= r.min) ?? regimes[regimes.length - 1];
const momSpark = sparkSeries('mom', 20, compScore, 20);

function MomentumTab() {
  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      {/* Composite dial */}
      <div className="flex items-start gap-6 border border-[#1a1a2e] p-4">
        <ArcDial score={compScore} size={140} />
        <div className="flex-1 space-y-2">
          <div className="text-[9px] font-mono text-muted-foreground">COMPOSITE MOMENTUM SCORE</div>
          <div className="text-[22px] font-mono font-bold text-foreground">{compScore}<span className="text-[12px] text-muted-foreground">/100</span></div>
          <div className="inline-block px-2 py-0.5 text-[9px] font-mono font-bold" style={{ backgroundColor: `${regime.color}22`, border: `1px solid ${regime.color}`, color: regime.color }}>
            {regime.label}
          </div>
          <div className="text-[8px] font-mono text-muted-foreground/70 mt-1">
            Normalized average of RSI percentile · MACD state · Stochastic K · ADX
          </div>
        </div>
      </div>

      {/* Per-index table */}
      <div className="border border-[#1a1a2e]">
        <div className="grid grid-cols-5 border-b border-[#1a1a2e] px-3 py-1.5 text-[8px] font-mono text-muted-foreground">
          <span>INDEX</span><span className="text-right">RSI 14</span><span className="text-right">MACD</span><span className="text-right">STOCH K</span><span className="text-right">ADX</span>
        </div>
        {indexData.map(d => (
          <div key={d.sym} className="grid grid-cols-5 px-3 py-1.5 border-b border-[#1a1a2e]/40 text-[9px] font-mono hover:bg-[#1a1a2e]/30">
            <span className="text-accent font-bold">{d.sym}</span>
            <span className="text-right" style={{ color: d.rsi > 60 ? POS : d.rsi < 40 ? NEG : TEXT }}>{d.rsi}</span>
            <span className="text-right" style={{ color: d.macd === 'BULL' ? POS : NEG }}>{d.macd}</span>
            <span className="text-right" style={{ color: d.stochK > 70 ? POS : d.stochK < 30 ? NEG : TEXT }}>{d.stochK}</span>
            <span className="text-right" style={{ color: d.adx > 30 ? '#e2e8f0' : TEXT }}>{d.adx}{d.adx > 25 ? ' ▲' : ''}</span>
          </div>
        ))}
      </div>

      {/* Rolling momentum sparkline */}
      <div className="border border-[#1a1a2e] p-3">
        <div className="text-[9px] font-mono text-muted-foreground mb-1">20D Rolling Composite</div>
        <MiniSpark data={momSpark} color={compScore >= 55 ? POS : compScore >= 45 ? AMB : NEG} />
      </div>
    </div>
  );
}

// ── ── ── ── ── ── ── ── CORRELATION TAB ── ── ── ── ── ── ──────────────────

const PERIOD_SALTS: Record<string, string> = { '30D': '30d', '60D': '60d', '90D': '90d' };

function corrCellColor(v: number): { bg: string; text: string } {
  if (v >= 1) return { bg: '#1e293b', text: '#94a3b8' };
  if (v >= 0.6) return { bg: `${NEG}33`, text: NEG };
  if (v <= -0.3) return { bg: `#3b82f633`, text: '#60a5fa' };
  return { bg: `${GRID}88`, text: TEXT };
}

function CorrelationTab() {
  const [period, setPeriod] = useState<'30D' | '60D' | '90D'>('30D');
  const { tickers, mat } = corrMatrix(PERIOD_SALTS[period]);

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono text-muted-foreground">PERIOD</span>
        <div className="flex border border-[#1a1a2e]">
          {(['30D', '60D', '90D'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-0.5 text-[8px] font-mono border-r border-[#1a1a2e] last:border-r-0 ${p === period ? 'bg-accent text-black font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-[#1a1a2e]'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="border border-[#1a1a2e] overflow-auto">
        <table className="w-full text-[8px] font-mono">
          <thead>
            <tr>
              <th className="w-10 p-1 text-right text-muted-foreground border-b border-r border-[#1a1a2e]" />
              {tickers.map(t => (
                <th key={t} className="p-1 text-center text-accent border-b border-r border-[#1a1a2e] last:border-r-0">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((row, ri) => (
              <tr key={row}>
                <td className="p-1 text-right text-accent font-bold border-r border-[#1a1a2e]">{row}</td>
                {tickers.map((col, ci) => {
                  const v = mat[ri][ci];
                  const { bg, text } = corrCellColor(v);
                  return (
                    <td key={col} className="p-1 text-center border-r border-b border-[#1a1a2e]/40 last:border-r-0" style={{ backgroundColor: bg, color: text }}>
                      {v.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[8px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block" style={{ backgroundColor: `${NEG}33`, border: `1px solid ${NEG}` }} /> {'>'} 0.60 Concentration risk</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block" style={{ backgroundColor: `${GRID}88`, border: `1px solid ${GRID}` }} /> -0.3 to 0.6 Diversifier</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block" style={{ backgroundColor: '#3b82f633', border: '1px solid #60a5fa' }} /> {'<'} -0.30 Hedge</span>
      </div>
    </div>
  );
}

// ── ── ── ── ── ── ── ── PARTICIPATION TAB ── ── ── ── ── ── ─────────────────

const SECTORS = ['Technology', 'Healthcare', 'Financials', 'Energy', 'Industrials', 'Materials', 'Utilities', 'Consumer Disc.', 'Consumer Staples', 'Comm. Services', 'Real Estate'];
const sectorData = SECTORS.map(s => {
  const r = seeded('PART', s);
  return { name: s, pct: +(20 + r() * 70).toFixed(1) };
});

const GLOBAL = ['SPX', 'EuroStoxx 50', 'Nikkei 225', 'FTSE 100', 'Hang Seng', 'ASX 200'];
const globalData = GLOBAL.map(g => {
  const r = seeded('GLOB', g);
  const pct = +(30 + r() * 60).toFixed(1);
  return { name: g, pct, trend: pct >= 55 ? 'UPTREND' : pct >= 45 ? 'NEUTRAL' : 'DOWNTREND' };
});

const bullCount = sectorData.filter(s => s.pct >= 55).length + globalData.filter(g => g.trend === 'UPTREND').length;
const totalSignals = SECTORS.length + GLOBAL.length;
const healthScore = Math.round((bullCount / totalSignals) * 100);

function ParticipationTab() {
  return (
    <div className="p-3 space-y-4 overflow-y-auto h-full">
      <div className="grid grid-cols-2 gap-4">
        {/* Sectors */}
        <div className="border border-[#1a1a2e] p-3 space-y-2">
          <div className="text-[9px] font-mono text-muted-foreground">S&P 500 SECTORS — % Above 50MA</div>
          {sectorData.map(s => {
            const color = s.pct >= 60 ? POS : s.pct >= 40 ? AMB : NEG;
            return (
              <div key={s.name} className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-mono">
                  <span className="text-muted-foreground truncate">{s.name}</span>
                  <span style={{ color }} className="font-bold ml-1">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-[#111827] rounded">
                  <div className="h-full rounded" style={{ width: `${s.pct}%`, backgroundColor: color, opacity: 0.85 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {/* Global indices */}
          <div className="border border-[#1a1a2e] p-3 space-y-1.5">
            <div className="text-[9px] font-mono text-muted-foreground">GLOBAL INDICES — % Above 200MA</div>
            {globalData.map(g => {
              const tcolor = g.trend === 'UPTREND' ? POS : g.trend === 'DOWNTREND' ? NEG : AMB;
              return (
                <div key={g.name} className="flex items-center justify-between text-[8px] font-mono">
                  <span className="text-muted-foreground truncate">{g.name}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-foreground">{g.pct}%</span>
                    <span className="px-1 py-0.5 text-[7px]" style={{ backgroundColor: `${tcolor}22`, border: `1px solid ${tcolor}55`, color: tcolor }}>{g.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Market health dial */}
          <div className="border border-[#1a1a2e] p-3">
            <div className="text-[9px] font-mono text-muted-foreground mb-2">MARKET HEALTH SCORE</div>
            <div className="flex items-center gap-4">
              <ArcDial score={healthScore} size={100} />
              <div>
                <div className="text-[20px] font-mono font-bold text-foreground">{bullCount}<span className="text-[10px] text-muted-foreground">/{totalSignals}</span></div>
                <div className="text-[8px] font-mono text-muted-foreground">Bullish signals</div>
                <div className="mt-1 h-1.5 w-24 bg-[#111827] rounded">
                  <div className="h-full rounded" style={{ width: `${healthScore}%`, backgroundColor: healthScore >= 60 ? POS : healthScore >= 40 ? AMB : NEG }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ── ── ── ── ── ── ── ROOT ── ── ── ── ── ── ── ────────────────────────────

const TABS = [
  { key: 'breadth', label: 'BREADTH' },
  { key: 'momentum', label: 'MOMENTUM' },
  { key: 'correlation', label: 'CORRELATION' },
  { key: 'participation', label: 'PARTICIPATION' },
] as const;

type Tab = typeof TABS[number]['key'];

export default function MarketIndicatorsView() {
  const [tab, setTab] = useState<Tab>('breadth');

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] text-foreground overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-[#1a1a2e] bg-[#0d0d14] shrink-0">
        <span className="text-accent font-bold text-[11px]">INDX</span>
        <span className="text-muted-foreground text-[9px]">Market Indicators Dashboard</span>
        <div className="flex border border-[#1a1a2e] ml-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-0.5 text-[8px] border-r border-[#1a1a2e] last:border-r-0 transition-colors ${t.key === tab ? 'bg-accent text-black font-bold' : 'text-muted-foreground hover:text-foreground hover:bg-[#1a1a2e]'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'breadth' && <BreadthTab />}
        {tab === 'momentum' && <MomentumTab />}
        {tab === 'correlation' && <CorrelationTab />}
        {tab === 'participation' && <ParticipationTab />}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 border-t border-[#1a1a2e] h-[14px] shrink-0">
        <span className="text-[7px] font-mono text-amber-500">MODEL DATA</span>
        <span className="text-[7px] font-mono text-muted-foreground">INDX · BREADTH · MOMENTUM · CORRELATION · PARTICIPATION</span>
      </div>
    </div>
  );
}
