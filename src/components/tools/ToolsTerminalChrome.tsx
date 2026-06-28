// Bloomberg-style chrome for the left Trading Tools popout:
// CMD header strip, dense KPI tile row, function-key bar, marquee tape, status ribbon.
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useTrades } from '@/contexts/TradeContext';
import { calcWinRate, calcTotalPnl } from '@/types/trade';
import { apiGet } from '@/lib/api';

// ── CMD HEADER ──────────────────────────────────────────────────────
export function ToolsCmdHeader({
  onToggle,
  onEditToggle,
  editMode,
}: {
  onToggle: () => void;
  onEditToggle: () => void;
  editMode: boolean;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-accent bg-surface-deep px-2 h-7 flex-shrink-0">
      <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">TOOL</span>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">
        Trading Tools
      </span>
      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onEditToggle}
          className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${
            editMode ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
          }`}
          title="Edit widgets"
        >
          {editMode ? '✓ DONE' : '⚙ EDIT'}
        </button>
        <button onClick={onToggle} className="p-0.5 hover:bg-surface-elevated transition-colors" title="Hide Tools">
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ── KPI STRIP ───────────────────────────────────────────────────────
type Tone = 'pos' | 'neg' | 'accent' | 'neu';
const toneCls: Record<Tone, string> = {
  pos: 'text-positive',
  neg: 'text-negative',
  accent: 'text-accent',
  neu: 'text-foreground',
};

function Kpi({ label, value, sub, tone = 'neu' }: { label: string; value: string; sub?: string; tone?: Tone }) {
  return (
    <div className="bg-surface-deep px-2 py-1 min-w-0">
      <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground truncate">{label}</div>
      <div className={`text-[11px] font-mono font-bold tabular-nums truncate ${toneCls[tone]}`}>{value}</div>
      {sub && <div className="text-[8px] font-mono text-muted-foreground tabular-nums truncate">{sub}</div>}
    </div>
  );
}

export function ToolsKpiStrip() {
  const { trades } = useTrades();
  const { privacyMode, activeAccount, formatMoney } = usePrivacy();

  const stats = useMemo(() => {
    const totalPnl = calcTotalPnl(trades);
    const wr = calcWinRate(trades);
    const equity = (activeAccount?.balance || 0) + totalPnl;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const dayPnl = trades
      .filter(t => (t.date || '').slice(0, 10) === todayStr)
      .reduce((s, t) => s + t.pnl, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const wkPnl = trades
      .filter(t => new Date((t.date || '').replace(' ', 'T')) >= weekStart)
      .reduce((s, t) => s + t.pnl, 0);

    const mtdPnl = trades
      .filter(t => (t.date || '').slice(0, 7) === todayStr.slice(0, 7))
      .reduce((s, t) => s + t.pnl, 0);

    const open = trades.filter(t => !t.exit);
    const openCount = open.length;
    const exposure = equity > 0
      ? Math.min(999, (open.reduce((s, t) => s + Math.abs(t.entry * t.size), 0) / equity) * 100)
      : 0;
    const bp = equity * 4; // 4:1 reg-T-ish

    return { totalPnl, wr, equity, dayPnl, wkPnl, mtdPnl, openCount, exposure, bp };
  }, [trades, activeAccount]);

  const fmtPct = (v: number, sign = false) => (privacyMode ? '••' : `${sign && v >= 0 ? '+' : ''}${v.toFixed(2)}%`);
  const equityPct = activeAccount?.balance ? (stats.totalPnl / activeAccount.balance) * 100 : 0;

  return (
    <div className="grid grid-cols-4 gap-[1px] bg-border border-b border-border flex-shrink-0">
      <Kpi label="EQTY" value={formatMoney(stats.equity)} sub={fmtPct(equityPct, true)} tone={equityPct >= 0 ? 'pos' : 'neg'} />
      <Kpi label="DAY P&L" value={formatMoney(stats.dayPnl, { showSign: true })} tone={stats.dayPnl >= 0 ? 'pos' : 'neg'} />
      <Kpi label="WK P&L" value={formatMoney(stats.wkPnl, { showSign: true })} tone={stats.wkPnl >= 0 ? 'pos' : 'neg'} />
      <Kpi label="MTD P&L" value={formatMoney(stats.mtdPnl, { showSign: true })} tone={stats.mtdPnl >= 0 ? 'pos' : 'neg'} />
      <Kpi label="OPEN" value={privacyMode ? '••' : String(stats.openCount)} tone="accent" />
      <Kpi label="WIN%" value={privacyMode ? '••' : `${stats.wr.toFixed(0)}%`} tone={stats.wr >= 50 ? 'pos' : 'neg'} />
      <Kpi label="EXPO" value={fmtPct(stats.exposure)} tone={stats.exposure > 80 ? 'neg' : 'accent'} />
      <Kpi label="BP" value={formatMoney(stats.bp)} tone="neu" />
    </div>
  );
}

// ── FUNCTION-KEY BAR ────────────────────────────────────────────────
const F_KEYS: { key: string; label: string; cat: string }[] = [
  { key: 'F1', label: 'CALC', cat: 'trading' },
  { key: 'F2', label: 'MKTS', cat: 'flow' },
  { key: 'F3', label: 'MACRO', cat: 'macro' },
  { key: 'F4', label: 'PERF', cat: 'analytics' },
  { key: 'F5', label: 'NOTE', cat: 'tools' },
  { key: 'F6', label: 'MORE', cat: 'analytics' },
];

export function ToolsFKeyBar({ onJump }: { onJump: (cat: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const idx = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        onJump(F_KEYS[idx].cat);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onJump]);

  return (
    <div className="flex items-stretch border-b border-border bg-surface-deep flex-shrink-0">
      {F_KEYS.map(f => (
        <button
          key={f.key}
          onClick={() => onJump(f.cat)}
          className="flex-1 px-1 py-1 flex items-center justify-center gap-1 text-[8px] font-mono uppercase tracking-wider text-muted-foreground hover:text-accent hover:bg-surface-elevated transition-colors border-r border-border last:border-r-0"
          title={`Jump to ${f.label}`}
        >
          <span className="text-accent font-bold">{f.key}</span>
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── MARQUEE TAPE ────────────────────────────────────────────────────
const TAPE_FETCH_SYMBOLS = 'SPY,QQQ,AAPL,NVDA,TSLA,ES=F,NQ=F,CL=F,GC=F,BTC-USD,^VIX';

type TapeItem = { sym: string; val: string; chg: string; pos: boolean };

const TAPE_FALLBACK: TapeItem[] = [
  { sym: 'SPY', val: '—', chg: '—', pos: true },
  { sym: 'QQQ', val: '—', chg: '—', pos: true },
  { sym: 'AAPL', val: '—', chg: '—', pos: true },
  { sym: 'NVDA', val: '—', chg: '—', pos: true },
  { sym: 'TSLA', val: '—', chg: '—', pos: false },
  { sym: 'ES', val: '—', chg: '—', pos: true },
  { sym: 'NQ', val: '—', chg: '—', pos: true },
  { sym: 'CL', val: '—', chg: '—', pos: false },
  { sym: 'GC', val: '—', chg: '—', pos: true },
  { sym: 'BTC', val: '—', chg: '—', pos: true },
  { sym: 'VIX', val: '—', chg: '—', pos: false },
];

export function ToolsTape() {
  const [items, setItems] = useState<TapeItem[]>(TAPE_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiGet<{ quotes?: { ticker: string; price: number; changePct: number }[] }>(
          `/api/market/security/batch-quotes?symbols=${TAPE_FETCH_SYMBOLS}`
        );
        if (!data?.quotes?.length || cancelled) return;
        const mapped: TapeItem[] = data.quotes.map(q => {
          const sym = q.ticker.replace(/^\^/, '').replace('=F', '').replace('-USD', '');
          const pos = (q.changePct ?? 0) >= 0;
          const chg = `${pos ? '+' : ''}${(q.changePct ?? 0).toFixed(2)}%`;
          const p = q.price;
          const val = p >= 10000 ? p.toFixed(0) : p.toFixed(2);
          return { sym, val, chg, pos };
        });
        if (!cancelled) setItems(mapped);
      } catch {}
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const doubled = [...items, ...items];
  return (
    <div className="border-t border-border bg-surface-deep overflow-hidden flex-shrink-0 h-5 relative group">
      <div className="absolute inset-y-0 left-0 flex items-center gap-3 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-1 text-[9px] font-mono tabular-nums">
            <span className="text-accent font-bold">{t.sym}</span>
            <span className="text-foreground">{t.val}</span>
            <span className={t.pos ? 'text-positive' : 'text-negative'}>{t.chg}</span>
            <span className="text-muted-foreground/40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── STATUS RIBBON ───────────────────────────────────────────────────
export function ToolsStatusRibbon() {
  return (
    <div className="px-2 py-0.5 bg-surface-deep border-t border-border flex items-center justify-between text-[8px] font-mono text-muted-foreground uppercase flex-shrink-0">
      <span className="truncate">src: live · cloud · scroll-lock</span>
      <span className="truncate ml-2">
        press <span className="text-accent">/</span> for CLI
      </span>
    </div>
  );
}
