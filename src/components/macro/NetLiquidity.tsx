// NETLIQ — Fed Net Liquidity Model. Fed BST − TGA − RRP = Net Liquidity, overlaid on SPX.
import { useState, useEffect } from 'react';
import CmdShell from './cmd/_shell/CmdShell';
import CmdTabs from './cmd/_shell/CmdTabs';

type Tab = 'chart' | 'table' | 'pace';
const TABS: { id: Tab; label: string }[] = [
  { id: 'chart', label: 'CHART' },
  { id: 'table', label: 'TABLE' },
  { id: 'pace',  label: 'QT PACE' },
];

interface NetLiqRow {
  date: string;
  walcl: number;
  tga: number | null;
  rrp: number | null;
  netliq: number | null;
  spx: number | null;
}

interface NetLiqData {
  series: NetLiqRow[];
  latest: NetLiqRow | null;
  weeklyChange: number | null;
  synthetic: boolean;
  fetchedAt?: number;
  error?: string;
}

function fmt(v: number | null, d = 2): string { return v == null ? '—' : v.toFixed(d); }
function fmtT(v: number | null): string { return v == null ? '—' : `$${v.toFixed(2)}T`; }
function chgCls(v: number | null) { return v == null ? 'text-muted-foreground' : v >= 0 ? 'text-positive' : 'text-negative'; }

// ─── Dual-axis line chart ─────────────────────────────────────────────────────

function DualChart({ series }: { series: NetLiqRow[] }) {
  if (series.length < 4) return <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px]">Loading…</div>;

  const nlVals = series.map(r => r.netliq).filter((v): v is number => v != null);
  const spxVals = series.map(r => r.spx).filter((v): v is number => v != null);
  const nlMin = Math.min(...nlVals), nlMax = Math.max(...nlVals);
  const spxMin = Math.min(...spxVals), spxMax = Math.max(...spxVals);

  const W = 800, H = 200, padL = 8, padR = 8, padT = 12, padB = 20;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = series.length;

  const xOf = (i: number) => padL + (i / (n - 1)) * innerW;
  const yNL  = (v: number) => padT + innerH - ((v - nlMin) / (nlMax - nlMin || 1)) * innerH;
  const ySPX = (v: number) => padT + innerH - ((v - spxMin) / (spxMax - spxMin || 1)) * innerH;

  const nlPts  = series.map((r, i) => r.netliq != null ? `${xOf(i).toFixed(1)},${yNL(r.netliq).toFixed(1)}`  : null).filter(Boolean).join(' ');
  const spxPts = series.map((r, i) => r.spx    != null ? `${xOf(i).toFixed(1)},${ySPX(r.spx).toFixed(1)}`   : null).filter(Boolean).join(' ');

  // Year labels on x-axis
  const years: { i: number; label: string }[] = [];
  series.forEach((r, i) => { if (r.date.endsWith('-01-07') || r.date.endsWith('-01-04') || r.date.endsWith('-01-06')) years.push({ i, label: r.date.slice(0, 4) }); });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full flex-1" preserveAspectRatio="none">
      {/* Zero line for NL */}
      {nlMin < 0 && <line x1={padL} y1={yNL(0)} x2={W - padR} y2={yNL(0)} stroke="hsl(var(--border))" strokeWidth="0.6" strokeDasharray="4,4" />}

      {/* SPX (right axis, muted) */}
      <polyline points={spxPts} fill="none" stroke="hsl(var(--foreground)/0.25)" strokeWidth="1.2" />

      {/* Net Liquidity */}
      <polyline points={nlPts} fill="none" stroke="hsl(var(--accent))" strokeWidth="1.5" />

      {/* Year labels */}
      {years.map(y => (
        <text key={y.label} x={xOf(y.i)} y={H - 3} fontSize="6" fill="hsl(var(--muted-foreground))" textAnchor="middle">{y.label}</text>
      ))}

      {/* Axis labels */}
      <text x={padL} y={padT - 2} fontSize="6" fill="hsl(var(--accent))">NL $T (L)</text>
      <text x={W - padR} y={padT - 2} fontSize="6" fill="hsl(var(--foreground)/0.4)" textAnchor="end">SPX (R)</text>
    </svg>
  );
}

function ChartTab({ data }: { data: NetLiqData }) {
  const latest = data.latest;
  const prev2 = data.series[data.series.length - 5] ?? null;
  const spxChg = latest?.spx && prev2?.spx ? ((latest.spx - prev2.spx) / prev2.spx * 100) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* KPI strip */}
      <div className="flex border-b border-border bg-surface-deep flex-shrink-0">
        {[
          { label: 'Net Liquidity', value: fmtT(latest?.netliq ?? null), sub: `Δ1W ${latest && data.weeklyChange != null ? (data.weeklyChange >= 0 ? '+' : '') + data.weeklyChange.toFixed(2) + 'T' : '—'}`, tone: (data.weeklyChange ?? 0) >= 0 ? 'pos' : 'neg' },
          { label: 'Fed Balance Sheet', value: fmtT(latest?.walcl ?? null), tone: 'neu' },
          { label: 'TGA', value: fmtT(latest?.tga ?? null), tone: 'neg' },
          { label: 'ON-RRP', value: fmtT(latest?.rrp ?? null), tone: 'neg' },
          { label: 'S&P 500', value: latest?.spx ? latest.spx.toFixed(0) : '—', sub: spxChg != null ? `${spxChg >= 0 ? '+' : ''}${spxChg.toFixed(1)}% (5W)` : '', tone: (spxChg ?? 0) >= 0 ? 'pos' : 'neg' },
        ].map(k => (
          <div key={k.label} className="flex flex-col px-3 py-1.5 border-r border-border/50 last:border-r-0">
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest">{k.label}</span>
            <span className={`text-[13px] font-bold font-mono tabular-nums leading-tight ${k.tone === 'pos' ? 'text-positive' : k.tone === 'neg' ? 'text-negative' : 'text-foreground'}`}>{k.value}</span>
            {k.sub && <span className="text-[8px] text-muted-foreground">{k.sub}</span>}
          </div>
        ))}
        {data.synthetic && (
          <div className="ml-auto px-3 flex items-center">
            <span className="text-[8px] text-accent/60 uppercase">SYNTHETIC · Add FRED_API_KEY for live data</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-3 py-1 border-b border-border/40 bg-surface-deep flex-shrink-0 text-[8px] font-mono">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-accent inline-block" /> Net Liquidity ($T, left axis)</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-foreground/25 inline-block" /> S&P 500 (right axis)</span>
        <span className="ml-auto text-muted-foreground">Formula: Fed BST − TGA − ON-RRP</span>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 flex flex-col p-2">
        <DualChart series={data.series} />
      </div>
    </div>
  );
}

function TableTab({ data }: { data: NetLiqData }) {
  const rows = [...data.series].reverse().slice(0, 52);
  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <table className="w-full text-[9px] font-mono">
        <thead className="sticky top-0 bg-surface-deep border-b border-border">
          <tr>
            {['Date', 'Fed BST ($T)', 'TGA ($T)', 'ON-RRP ($T)', 'Net Liq ($T)', 'Δ NL', 'SPX'].map(h => (
              <th key={h} className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const prev = rows[i + 1];
            const nlDelta = r.netliq != null && prev?.netliq != null ? r.netliq - prev.netliq : null;
            return (
              <tr key={r.date} className="border-b border-border/20 hover:bg-surface-elevated">
                <td className="px-2 py-0.5 text-muted-foreground">{r.date}</td>
                <td className="px-2 py-0.5 text-foreground">{fmtT(r.walcl)}</td>
                <td className="px-2 py-0.5 text-negative">{fmtT(r.tga)}</td>
                <td className="px-2 py-0.5 text-negative">{fmtT(r.rrp)}</td>
                <td className="px-2 py-0.5 font-bold text-accent">{fmtT(r.netliq)}</td>
                <td className={`px-2 py-0.5 font-bold ${chgCls(nlDelta)}`}>{nlDelta != null ? `${nlDelta >= 0 ? '+' : ''}${nlDelta.toFixed(3)}` : '—'}</td>
                <td className="px-2 py-0.5 text-foreground">{r.spx?.toFixed(0) ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaceTab({ data }: { data: NetLiqData }) {
  const recent = data.series.slice(-12);
  const qtPace = recent.length >= 2
    ? (recent[recent.length - 1].walcl - recent[0].walcl) / (recent.length - 1)
    : null;
  const rrpRecent = data.series.slice(-8);
  const rrpDrain = rrpRecent.length >= 2 && rrpRecent[0].rrp != null && rrpRecent[rrpRecent.length - 1].rrp != null
    ? (rrpRecent[rrpRecent.length - 1].rrp! - rrpRecent[0].rrp!) / (rrpRecent.length - 1)
    : null;

  // Forward projection (12 weeks)
  const latest = data.latest;
  const projections = Array.from({ length: 13 }, (_, i) => {
    if (!latest?.netliq || qtPace == null || rrpDrain == null) return null;
    const wksOut = i;
    const futureWalcl = latest.walcl + qtPace * wksOut;
    const futureRRP = Math.max(0, (latest.rrp ?? 0) + rrpDrain * wksOut);
    const futureTGA = latest.tga ?? 0.4;
    return {
      date: `+${wksOut}W`,
      netliq: +(futureWalcl - futureTGA - futureRRP).toFixed(3),
      walcl:  +futureWalcl.toFixed(3),
      rrp:    +futureRRP.toFixed(3),
    };
  }).filter(Boolean) as { date: string; netliq: number; walcl: number; rrp: number }[];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto p-3 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'QT Pace (weekly)', value: qtPace != null ? `${qtPace >= 0 ? '+' : ''}${qtPace.toFixed(3)}T/wk` : '—', desc: 'Fed balance sheet change', tone: (qtPace ?? 0) < 0 ? 'neg' : 'pos' },
          { label: 'RRP Drain Rate', value: rrpDrain != null ? `${rrpDrain.toFixed(3)}T/wk` : '—', desc: 'ON-RRP weekly drain', tone: (rrpDrain ?? 0) < 0 ? 'pos' : 'neg' },
          { label: 'Net Liq (current)', value: fmtT(latest?.netliq ?? null), desc: 'BST − TGA − RRP', tone: 'neu' },
        ].map(k => (
          <div key={k.label} className="border border-border/50 p-2 bg-surface-deep">
            <div className="text-[8px] text-muted-foreground uppercase">{k.label}</div>
            <div className={`text-[14px] font-bold font-mono mt-1 ${k.tone === 'pos' ? 'text-positive' : k.tone === 'neg' ? 'text-negative' : 'text-foreground'}`}>{k.value}</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">{k.desc}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[8px] text-accent font-bold uppercase tracking-widest mb-2">12-Week Forward Projection (at current pace)</div>
        <table className="w-full text-[9px] font-mono">
          <thead className="border-b border-border">
            <tr>
              {['Week', 'Fed BST', 'ON-RRP', 'Net Liq (proj)', 'Δ vs Now'].map(h => (
                <th key={h} className="text-left px-2 py-0.5 text-[8px] text-muted-foreground font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projections.map((p, i) => {
              const delta = latest?.netliq != null ? p.netliq - latest.netliq : null;
              return (
                <tr key={i} className="border-b border-border/20 hover:bg-surface-elevated">
                  <td className="px-2 py-0.5 text-muted-foreground">{p.date}</td>
                  <td className="px-2 py-0.5">{fmtT(p.walcl)}</td>
                  <td className="px-2 py-0.5 text-negative">{fmtT(p.rrp)}</td>
                  <td className={`px-2 py-0.5 font-bold ${i === 0 ? 'text-foreground' : p.netliq > (latest?.netliq ?? 0) ? 'text-positive' : 'text-negative'}`}>{fmtT(p.netliq)}</td>
                  <td className={`px-2 py-0.5 ${chgCls(delta)}`}>{delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}T` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NetLiquidity() {
  const [tab, setTab] = useState<Tab>('chart');
  const [data, setData] = useState<NetLiqData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/market/net-liquidity')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const latest = data?.latest;

  return (
    <CmdShell
      code="NETLIQ"
      title="Net Liquidity Model"
      tabs={<CmdTabs tabs={TABS} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="Fed Balance Sheet − TGA − ON-RRP  ·  Source: FRED (St. Louis Fed)"
      footerRight={data?.synthetic ? 'SYNTHETIC DATA — set FRED_API_KEY for live' : latest ? `As of ${latest.date}` : ''}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono">Loading FRED data…</div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center text-negative text-[10px] font-mono">Failed to load</div>
      ) : (
        <>
          {tab === 'chart' && <ChartTab data={data} />}
          {tab === 'table' && <TableTab data={data} />}
          {tab === 'pace'  && <PaceTab data={data} />}
        </>
      )}
    </CmdShell>
  );
}
