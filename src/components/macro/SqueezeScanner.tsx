// SQZZ — TTM Squeeze Scanner. Bollinger inside Keltner = low-vol coil → breakout alert.
import { useState, useEffect } from 'react';
import CmdShell from './cmd/_shell/CmdShell';
import CmdTabs from './cmd/_shell/CmdTabs';

type Tab = 'all' | 'sqz' | 'fired' | 'sector';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',    label: 'ALL' },
  { id: 'sqz',    label: 'IN SQUEEZE' },
  { id: 'fired',  label: 'FIRED' },
  { id: 'sector', label: 'BY SECTOR' },
];

interface SqzRow {
  sym: string;
  squeeze: boolean;
  fired: boolean;
  barsInSqueeze: number;
  momentum: number;
  spark: number[];
  close: number;
}

const SECTOR_MAP: Record<string, string> = {
  SPY: 'Broad Market', QQQ: 'Broad Market', IWM: 'Broad Market', DIA: 'Broad Market',
  AAPL: 'Technology', NVDA: 'Technology', META: 'Technology', MSFT: 'Technology', GOOG: 'Technology', AMD: 'Technology',
  TSLA: 'Consumer', AMZN: 'Consumer',
  COIN: 'Crypto', PLTR: 'Technology', MSTR: 'Crypto',
  XLF: 'Financials', XLE: 'Energy', XLK: 'Technology', XLV: 'Healthcare',
  GLD: 'Commodities', TLT: 'Fixed Income', BTCUSD: 'Crypto',
};

function MomentumBar({ v, max = 6 }: { v: number; max?: number }) {
  const w = Math.min(100, Math.abs(v) / max * 100);
  const isPos = v >= 0;
  return (
    <div className="flex items-center gap-1 flex-1">
      <div className="flex-1 h-2 flex">
        <div className="flex-1 flex justify-end">
          {!isPos && <div className="h-full bg-negative rounded-l-sm" style={{ width: `${w}%` }} />}
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1">
          {isPos && <div className="h-full bg-positive rounded-r-sm" style={{ width: `${w}%` }} />}
        </div>
      </div>
    </div>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const W = 50, H = 18;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min || 1)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function SqzDot({ squeeze, fired }: { squeeze: boolean; fired: boolean }) {
  if (squeeze) return <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" title="In Squeeze" />;
  if (fired)   return <span className="inline-block w-2 h-2 rounded-full bg-positive" title="Squeeze Fired" />;
  return         <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30" title="No Squeeze" />;
}

function RowTable({ rows, interval }: { rows: SqzRow[]; interval: string }) {
  return (
    <div className="overflow-y-auto flex-1 min-h-0">
      <table className="w-full text-[9px] font-mono">
        <thead className="sticky top-0 bg-surface-deep border-b border-border z-10">
          <tr>
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal w-6" />
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">SYM</th>
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">STATUS</th>
            <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">BARS</th>
            <th className="text-left px-3 py-1 text-[8px] text-muted-foreground font-normal">MOMENTUM</th>
            <th className="text-right px-2 py-1 text-[8px] text-muted-foreground font-normal">LAST</th>
            <th className="px-2 py-1 text-[8px] text-muted-foreground font-normal">SPARK ({interval})</th>
            <th className="text-left px-2 py-1 text-[8px] text-muted-foreground font-normal">SECTOR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const momCls = r.momentum > 0 ? 'text-positive' : r.momentum < 0 ? 'text-negative' : 'text-muted-foreground';
            return (
              <tr key={r.sym} className="border-b border-border/20 hover:bg-surface-elevated">
                <td className="px-2 py-1"><SqzDot squeeze={r.squeeze} fired={r.fired} /></td>
                <td className="px-2 py-1 font-bold text-accent">{r.sym}</td>
                <td className="px-2 py-1">
                  {r.squeeze
                    ? <span className="text-accent font-bold">● SQUEEZE</span>
                    : r.fired
                    ? <span className="text-positive font-bold">▲ FIRED</span>
                    : <span className="text-muted-foreground/50">—</span>}
                </td>
                <td className="px-2 py-1 text-right tabular-nums">{r.barsInSqueeze > 0 ? r.barsInSqueeze : '—'}</td>
                <td className="px-3 py-1">
                  <div className="flex items-center gap-1.5">
                    <MomentumBar v={r.momentum} />
                    <span className={`w-10 text-right tabular-nums text-[8px] shrink-0 ${momCls}`}>{r.momentum > 0 ? '+' : ''}{r.momentum}</span>
                  </div>
                </td>
                <td className="px-2 py-1 text-right tabular-nums">{r.close.toFixed(2)}</td>
                <td className="px-2 py-1">
                  <Spark data={r.spark} color={r.momentum >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />
                </td>
                <td className="px-2 py-1 text-muted-foreground text-[8px]">{SECTOR_MAP[r.sym] ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SectorTab({ rows }: { rows: SqzRow[] }) {
  const sectors: Record<string, SqzRow[]> = {};
  rows.forEach(r => { const s = SECTOR_MAP[r.sym] ?? 'Other'; (sectors[s] ??= []).push(r); });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
      {Object.entries(sectors).sort((a, b) => b[1].length - a[1].length).map(([sec, secRows]) => {
        const squeezing = secRows.filter(r => r.squeeze).length;
        const fired = secRows.filter(r => r.fired).length;
        return (
          <div key={sec} className="border border-border/50 bg-surface-deep p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-accent">{sec}</span>
              <div className="flex gap-2 text-[8px] font-mono">
                {squeezing > 0 && <span className="text-accent">● {squeezing} sqz</span>}
                {fired > 0 && <span className="text-positive">▲ {fired} fired</span>}
              </div>
            </div>
            <div className="space-y-0.5">
              {secRows.map(r => (
                <div key={r.sym} className="flex items-center gap-2 text-[8px] font-mono">
                  <SqzDot squeeze={r.squeeze} fired={r.fired} />
                  <span className={r.squeeze ? 'text-accent font-bold' : r.fired ? 'text-positive font-bold' : 'text-foreground'}>{r.sym}</span>
                  <span className={r.momentum >= 0 ? 'text-positive' : 'text-negative'}>{r.momentum > 0 ? '+' : ''}{r.momentum}</span>
                  {r.barsInSqueeze > 0 && <span className="text-muted-foreground">{r.barsInSqueeze}b</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SqueezeScanner() {
  const [tab, setTab] = useState<Tab>('all');
  const [interval, setInterval] = useState('1day');
  const [rows, setRows] = useState<SqzRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [synthetic, setSynthetic] = useState(false);
  const [ts, setTs] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/squeeze?interval=${interval}`)
      .then(r => r.json())
      .then(d => {
        setRows(d.rows ?? []);
        setSynthetic(!!d.synthetic);
        setTs(d.fetchedAt ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [interval]);

  const squeezing = rows.filter(r => r.squeeze);
  const fired = rows.filter(r => r.fired);

  const visibleRows =
    tab === 'sqz'    ? squeezing :
    tab === 'fired'  ? fired :
    tab === 'sector' ? rows :
    [...rows].sort((a, b) => {
      if (a.squeeze && !b.squeeze) return -1;
      if (!a.squeeze && b.squeeze) return 1;
      if (a.fired && !b.fired) return -1;
      if (!a.fired && b.fired) return 1;
      return b.barsInSqueeze - a.barsInSqueeze;
    });

  return (
    <CmdShell
      code="SQZZ"
      title="Squeeze Scanner"
      headerRight={
        <div className="flex gap-1">
          {(['1day', '1week'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setInterval(tf)}
              className={`px-2 py-0.5 text-[9px] font-mono uppercase border transition-colors ${interval === tf ? 'bg-accent text-accent-foreground border-accent' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}
            >{tf === '1day' ? 'Daily' : 'Weekly'}</button>
          ))}
        </div>
      }
      tabs={<CmdTabs tabs={TABS.map(t => t.id === 'sqz' ? { ...t, label: `IN SQUEEZE (${squeezing.length})` } : t.id === 'fired' ? { ...t, label: `FIRED (${fired.length})` } : t)} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="TTM Squeeze: Bollinger Band inside Keltner Channel · BB(20,2) · KC(20,1.5×ATR14)"
      footerRight={synthetic ? 'SYNTHETIC — add TWELVE_DATA_API_KEY for live' : ts ? `Updated ${new Date(ts).toLocaleTimeString()}` : ''}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono">Scanning universe…</div>
      ) : (
        <>
          {/* Legend strip */}
          <div className="flex items-center gap-4 px-3 py-1 border-b border-border/40 bg-surface-deep flex-shrink-0 text-[8px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> In Squeeze (BB inside KC)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-positive inline-block" /> Just Fired (squeeze released)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block" /> No squeeze</span>
            <span className="ml-auto">Momentum = price − midpoint regression vs SMA20</span>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {tab === 'sector'
              ? <SectorTab rows={rows} />
              : <RowTable rows={visibleRows} interval={interval} />}
          </div>
        </>
      )}
    </CmdShell>
  );
}
