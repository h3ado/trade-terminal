import { useMemo, useState } from 'react';
import { useIndices } from '@/hooks/useIndices';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

type Metric = 'pe' | 'fpe' | 'pb' | 'ps' | 'evEbitda' | 'dy' | 'roe' | 'ey' | 'erp' | 'cape';
const METRICS: { k: Metric; lbl: string; desc: string; cheapHi?: boolean }[] = [
  { k: 'pe', lbl: 'P/E ttm', desc: 'Price / trailing earnings' },
  { k: 'fpe', lbl: 'P/E fwd', desc: '12M forward earnings' },
  { k: 'pb', lbl: 'P/B', desc: 'Price / book' },
  { k: 'ps', lbl: 'P/S', desc: 'Price / sales' },
  { k: 'evEbitda', lbl: 'EV/EBITDA', desc: 'Enterprise value / EBITDA' },
  { k: 'dy', lbl: 'Div Yld%', desc: 'Trailing dividend yield', cheapHi: true },
  { k: 'roe', lbl: 'ROE%', desc: 'Return on equity', cheapHi: true },
  { k: 'ey', lbl: 'Earn Yld%', desc: '1 / P/E', cheapHi: true },
  { k: 'erp', lbl: 'ERP%', desc: 'Earnings yield − 10Y', cheapHi: true },
  { k: 'cape', lbl: 'CAPE', desc: 'Cyclically-adjusted P/E' },
];

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

const META: Record<string, { name: string; region: string; em?: boolean; ty10: number }> = {
  NYSE: { name: 'S&P 500',     region: 'AMER', ty10: 4.30 },
  NDAQ: { name: 'Nasdaq 100',  region: 'AMER', ty10: 4.30 },
  CME:  { name: 'Dow Jones',   region: 'AMER', ty10: 4.30 },
  TSX:  { name: 'S&P/TSX',     region: 'AMER', ty10: 3.40 },
  B3:   { name: 'Bovespa',     region: 'AMER', em: true, ty10: 11.0 },
  BMV:  { name: 'IPC Mexico',  region: 'AMER', em: true, ty10: 9.10 },
  LSE:  { name: 'FTSE 100',    region: 'EMEA', ty10: 4.50 },
  PAR:  { name: 'CAC 40',      region: 'EMEA', ty10: 3.10 },
  XETR: { name: 'DAX',         region: 'EMEA', ty10: 2.40 },
  SIX:  { name: 'SMI',         region: 'EMEA', ty10: 0.80 },
  AMS:  { name: 'AEX',         region: 'EMEA', ty10: 2.60 },
  BME:  { name: 'IBEX 35',     region: 'EMEA', ty10: 3.20 },
  BIT:  { name: 'FTSE MIB',    region: 'EMEA', ty10: 3.50 },
  JSE:  { name: 'JSE Top 40',  region: 'EMEA', em: true, ty10: 10.5 },
  TSE:  { name: 'Nikkei 225',  region: 'APAC', ty10: 1.10 },
  HKEX: { name: 'Hang Seng',   region: 'APAC', ty10: 3.50 },
  SSE:  { name: 'Shanghai',    region: 'APAC', em: true, ty10: 2.10 },
  KRX:  { name: 'KOSPI',       region: 'APAC', em: true, ty10: 3.10 },
  TWSE: { name: 'TAIEX',       region: 'APAC', em: true, ty10: 1.40 },
  ASX:  { name: 'ASX 200',     region: 'APAC', ty10: 4.20 },
  BSE:  { name: 'SENSEX',      region: 'APAC', em: true, ty10: 6.90 },
  SGX:  { name: 'STI',         region: 'APAC', ty10: 2.80 },
  IDX:  { name: 'Jakarta',     region: 'APAC', em: true, ty10: 6.80 },
};

export default function WorldEquityValuations() {
  const { indices } = useIndices();
  const { privacyMode } = usePrivacy();
  const redact = (v: any) => privacyMode ? '•••••' : String(v);
  const [view, setView] = useState<'raw' | 'z'>('raw');
  const [selected, setSelected] = useState<string>('NYSE');

  const rows = useMemo(() => indices
    .filter(ix => META[ix.abbr])
    .map(ix => {
      const m = META[ix.abbr];
      const pe = 8 + seed(ix.abbr + 'pe', 0, 22);
      const fpe = pe * (0.85 + seed(ix.abbr + 'fp', 0, 0.25));
      const pb = 0.8 + seed(ix.abbr + 'pb', 0, 5);
      const ps = 0.5 + seed(ix.abbr + 'ps', 0, 4);
      const evEbitda = 5 + seed(ix.abbr + 'ev', 0, 17);
      const dy = 0.5 + seed(ix.abbr + 'dy', 0, 5);
      const roe = 5 + seed(ix.abbr + 'roe', 0, 22);
      const ey = (1 / pe) * 100;
      const erp = ey - m.ty10;
      const cape = pe * (1 + seed(ix.abbr + 'cape', -0.1, 0.5));
      const grw = seed(ix.abbr + 'g', -2, 18);
      return { abbr: ix.abbr, sym: ix.symbol, name: m.name, region: m.region, em: !!m.em,
        mcap: ix.mcap_usd_t, ty10: m.ty10,
        pe, fpe, pb, ps, evEbitda, dy, roe, ey, erp, cape, grw,
      };
    }), [indices]);

  // Compute z-scores per metric across rows (proxy for 10Y self-history)
  const stats = useMemo(() => {
    const out: Record<Metric, { mean: number; sd: number }> = {} as any;
    METRICS.forEach(m => {
      const vals = rows.map(r => r[m.k] as number);
      const mean = vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, vals.length));
      out[m.k] = { mean, sd };
    });
    return out;
  }, [rows]);

  const cellColor = (m: Metric, v: number) => {
    const { mean, sd } = stats[m];
    let z = sd === 0 ? 0 : (v - mean) / sd;
    const cheapHi = METRICS.find(x => x.k === m)?.cheapHi;
    if (cheapHi) z = -z; // higher = cheaper
    const clamped = Math.max(-2, Math.min(2, z));
    const intensity = Math.min(1, Math.abs(clamped) / 2);
    return clamped >= 0 ? `hsl(var(--negative) / ${intensity * 0.6})` : `hsl(var(--positive) / ${intensity * 0.6})`;
  };

  const sel = rows.find(r => r.abbr === selected) ?? rows[0];

  const historical = useMemo(() => {
    if (!sel) return [];
    const mean = sel.pe;
    const sd = Math.max(1.5, sel.pe * 0.18);
    return Array.from({ length: 120 }, (_, i) => {
      const t = i - 119;
      const wave = Math.sin(i / 9 + h(sel.abbr)) * sd * 0.7 + Math.cos(i / 17 + h(sel.abbr) * 0.3) * sd * 0.4;
      const drift = (i / 120) * sd * 0.3;
      const v = mean + wave + drift + seed(sel.abbr + i + 'h', -sd * 0.3, sd * 0.3);
      return { m: t, pe: +v.toFixed(2), mean: +mean.toFixed(2), up: +(mean + sd).toFixed(2), dn: +(mean - sd).toFixed(2) };
    });
  }, [sel]);

  const ranked = useMemo(() => {
    const arr = rows.map(r => {
      const { mean, sd } = stats.pe;
      const z = sd === 0 ? 0 : (r.pe - mean) / sd;
      return { ...r, zPe: z };
    });
    return arr.sort((a, b) => a.zPe - b.zPe);
  }, [rows, stats]);

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-bold text-xs uppercase">World P/E & Valuations</span>
        <span className="text-muted-foreground text-[9px]">WPE &lt;GO&gt;</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setView('raw')} className={`px-2 py-1 text-[10px] ${view === 'raw' ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>RAW</button>
          <button onClick={() => setView('z')} className={`px-2 py-1 text-[10px] ${view === 'z' ? 'bg-accent text-accent-foreground font-bold' : 'border border-border text-muted-foreground hover:bg-surface-elevated'}`}>Z-SCORE HEAT</button>
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="px-2 py-1.5 text-accent text-left">INDEX</th>
              <th className="px-2 py-1.5 text-accent text-left">REGION</th>
              {METRICS.map(m => (
                <th key={m.k} title={m.desc} className="px-2 py-1.5 text-accent text-right">{m.lbl}</th>
              ))}
              <th className="px-2 py-1.5 text-accent text-right">MCAP$T</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.abbr} onClick={() => setSelected(r.abbr)}
                className={`border-b border-grid-line cursor-pointer ${selected === r.abbr ? 'bg-accent/10' : i % 2 ? 'bg-surface-elevated/20' : ''} hover:bg-surface-elevated/60`}>
                <td className="px-2 py-1">
                  <div className="text-accent font-bold">{r.sym}</div>
                  <div className="text-muted-foreground text-[8px]">{r.name}</div>
                </td>
                <td className="px-2 py-1 text-muted-foreground">{r.region}{r.em ? ' · EM' : ''}</td>
                {METRICS.map(m => {
                  const v = r[m.k] as number;
                  const bg = view === 'z' ? cellColor(m.k, v) : undefined;
                  return (
                    <td key={m.k} className="px-2 py-1 text-right text-foreground" style={bg ? { backgroundColor: bg } : undefined}>
                      {redact(v.toFixed(m.k === 'cape' || m.k === 'evEbitda' ? 1 : 2))}
                    </td>
                  );
                })}
                <td className="px-2 py-1 text-right text-foreground">{r.mcap.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="border border-border bg-surface-primary p-3 lg:col-span-2">
          <div className="text-[10px] text-muted-foreground mb-1">{sel?.sym} P/E ttm · 10Y monthly · mean ±1σ bands</div>
          <ExpandableResponsiveContainer width="100%" height={240}>
            <AreaChart data={historical}>
              <XAxis dataKey="m" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <Area type="monotone" dataKey="up" stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} fill="hsl(var(--accent) / 0.06)" />
              <Area type="monotone" dataKey="dn" stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} fill="hsl(var(--background))" />
              <ReferenceLine y={sel?.pe} stroke="hsl(var(--accent))" strokeDasharray="3 3" label={{ value: 'NOW', fontSize: 9, fill: 'hsl(var(--accent))', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="pe" stroke="hsl(var(--accent))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="mean" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" dot={false} />
            </AreaChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] text-muted-foreground mb-1">RELATIVE VALUE · z(P/E)</div>
          <div className="text-[9px] text-positive mb-1">CHEAPEST →</div>
          {ranked.slice(0, 5).map(r => (
            <div key={r.abbr} className="flex justify-between py-0.5 text-[10px]">
              <span className="text-accent">{r.sym}</span>
              <span className="text-positive font-bold">{r.zPe.toFixed(2)}σ</span>
            </div>
          ))}
          <div className="text-[9px] text-negative mb-1 mt-2 pt-2 border-t border-grid-line">RICHEST →</div>
          {ranked.slice(-5).reverse().map(r => (
            <div key={r.abbr} className="flex justify-between py-0.5 text-[10px]">
              <span className="text-accent">{r.sym}</span>
              <span className="text-negative font-bold">+{r.zPe.toFixed(2)}σ</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] text-muted-foreground mb-1">P/E FWD vs EARNINGS GROWTH · bubble = mcap ($T)</div>
        <ExpandableResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <XAxis type="number" dataKey="grw" name="EPS growth %" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} label={{ value: 'EPS growth %', fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))', dy: 12 }} />
            <YAxis type="number" dataKey="fpe" name="P/E fwd" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <ZAxis type="number" dataKey="mcap" range={[40, 900]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}
              formatter={(v: any, n: any) => [Number(v).toFixed(2), n]}
              labelFormatter={() => ''} />
            <Scatter data={rows.map(r => ({ ...r, label: r.sym }))} fill="hsl(var(--accent))" shape={(props: any) => {
              const { cx, cy, payload, fill, node } = props as any;
              const radius = Math.sqrt(payload.mcap) * 4;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={radius} fill="hsl(var(--accent) / 0.45)" stroke="hsl(var(--accent))" strokeWidth={1} />
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize={8} fontFamily="monospace" fill="hsl(var(--foreground))">{payload.sym}</text>
                </g>
              );
            }} />
          </ScatterChart>
        </ExpandableResponsiveContainer>
      </div>
    </div>
  );
}
