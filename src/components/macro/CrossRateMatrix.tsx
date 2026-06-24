import { useMemo, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';

const ALL_CCY = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'CNY', 'HKD', 'SGD', 'KRW', 'INR', 'MXN', 'BRL', 'ZAR', 'TRY'];
const G10 = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];
const EM = ['USD', 'CNY', 'HKD', 'SGD', 'KRW', 'INR', 'MXN', 'BRL', 'ZAR', 'TRY'];
const ASIA = ['USD', 'JPY', 'CNY', 'HKD', 'SGD', 'KRW', 'INR'];
const LATAM = ['USD', 'MXN', 'BRL'];
const MAJORS = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];

type Filter = 'G10' | 'EM' | 'ASIA' | 'LATAM' | 'ALL';

// Heatmap color: |v| capped at 1.5%, ramps positive=green / negative=red alpha
function heatColor(v: number) {
  const cap = Math.max(-1.5, Math.min(1.5, v));
  const a = 0.08 + (Math.abs(cap) / 1.5) * 0.55;
  return cap >= 0 ? `hsl(var(--positive) / ${a})` : `hsl(var(--negative) / ${a})`;
}

export default function CrossRateMatrix() {
  const { rates, loading } = useFXRates();
  const { privacyMode } = usePrivacy();
  const redact = (v: string) => (privacyMode ? '•••••' : v);

  const [base, setBase] = useState('USD');
  const [dp, setDp] = useState<4 | 5 | 6>(4);
  const [filter, setFilter] = useState<Filter>('G10');
  const [inverted, setInverted] = useState(false);
  const [showDelta, setShowDelta] = useState(true);

  const universe = useMemo(() => {
    const sets: Record<Filter, string[]> = { G10, EM, ASIA, LATAM, ALL: ALL_CCY };
    return sets[filter];
  }, [filter]);

  const usdOf = (c: string) => {
    if (c === 'USD') return 1;
    return rates.find(r => r.ccy === c)?.usd ?? NaN;
  };
  const chgOf = (c: string) => {
    if (c === 'USD') return 0;
    return rates.find(r => r.ccy === c)?.change_pct ?? 0;
  };

  const cross = (b: string, q: string) => {
    const ub = usdOf(b), uq = usdOf(q);
    if (!isFinite(ub) || !isFinite(uq) || uq === 0) return NaN;
    return ub / uq;
  };
  const crossChg = (b: string, q: string) => chgOf(b) - chgOf(q);

  const movers = useMemo(() => {
    const arr = universe.filter(c => c !== base).map(c => ({ c, chg: crossChg(base, c) }));
    arr.sort((a, b) => b.chg - a.chg);
    return { top: arr.slice(0, 5), bot: arr.slice(-5).reverse() };
  }, [universe, base, rates]);

  const fmt = (v: number) => (isFinite(v) ? v.toFixed(dp) : '—');
  const fmtChg = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-mono font-bold text-xs uppercase">Cross-Rate Matrix</span>
        <span className="text-muted-foreground font-mono text-[9px]">FXC &lt;GO&gt;</span>
        {loading && <span className="text-[9px] font-mono text-muted-foreground animate-pulse">·live</span>}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[10px] font-mono text-muted-foreground">BASE</label>
          <select value={base} onChange={e => setBase(e.target.value)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            {ALL_CCY.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="text-[10px] font-mono text-muted-foreground">SET</label>
          <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            <option>G10</option><option>EM</option><option>ASIA</option><option>LATAM</option><option>ALL</option>
          </select>
          <label className="text-[10px] font-mono text-muted-foreground">DP</label>
          <select value={dp} onChange={e => setDp(parseInt(e.target.value) as 4 | 5 | 6)} className="bg-surface-elevated border border-border text-foreground text-[10px] font-mono px-1.5 py-0.5">
            <option value={4}>4</option><option value={5}>5</option><option value={6}>6</option>
          </select>
          <button onClick={() => setShowDelta(v => !v)} className={`text-[10px] font-mono px-2 py-0.5 border border-border ${showDelta ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Δ%</button>
          <button onClick={() => setInverted(v => !v)} className={`text-[10px] font-mono px-2 py-0.5 border border-border ${inverted ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}>INV</button>
        </div>
      </div>

      {/* MAJORS quick-set + heat legend */}
      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
        <span className="text-muted-foreground uppercase">MAJORS</span>
        {MAJORS.map(c => (
          <button key={c} onClick={() => setBase(c)} className={`px-2 py-0.5 border ${base === c ? 'bg-accent text-accent-foreground border-accent font-bold' : 'border-border text-muted-foreground hover:text-foreground'}`}>{c}</button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-muted-foreground">−1.5%</span>
          <div className="flex h-3 border border-border">
            {[-1.5, -1, -0.5, -0.2, 0, 0.2, 0.5, 1, 1.5].map(v => (
              <div key={v} className="w-3" style={{ backgroundColor: heatColor(v) }} />
            ))}
          </div>
          <span className="text-muted-foreground">+1.5%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3 border border-border overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="bg-surface-elevated border-b border-border">
                <th className="px-2 py-1.5 text-accent font-bold text-left sticky left-0 bg-surface-elevated">BASE \ QUOTE</th>
                {universe.map(c => (
                  <th key={c} className={`px-2 py-1.5 text-accent font-bold text-right ${c === base ? 'bg-accent/15' : ''}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {universe.map((row, i) => (
                <tr key={row} className={`border-b border-grid-line last:border-0 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className={`px-2 py-1 text-accent font-bold sticky left-0 ${row === base ? 'bg-accent/15' : 'bg-card'}`}>{row}</td>
                  {universe.map(col => {
                    if (row === col) return <td key={col} className="px-2 py-1 text-right text-muted-foreground/40">—</td>;
                    const val = inverted ? cross(col, row) : cross(row, col);
                    const ch = inverted ? crossChg(col, row) : crossChg(row, col);
                    return (
                      <td key={col} className="px-2 py-1 text-right relative" style={{ backgroundColor: heatColor(ch) }} title={`${row}/${col}  ${fmtChg(ch)}`}>
                        <div className="text-foreground font-bold">{redact(fmt(val))}</div>
                        {showDelta && (
                          <div className={`text-[8px] flex items-center justify-end gap-0.5 ${ch >= 0 ? 'text-positive' : 'text-negative'}`}>
                            <span>{ch >= 0 ? '▲' : '▼'}</span>{fmtChg(ch)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="border border-border bg-surface-primary p-2">
            <div className="text-[10px] font-mono text-positive uppercase mb-1.5">▲ Top vs {base} · 24h</div>
            {movers.top.map(m => (
              <div key={m.c} className="flex justify-between py-0.5 text-[10px] font-mono px-1" style={{ backgroundColor: heatColor(m.chg) }}>
                <span className="text-foreground font-bold">{base}/{m.c}</span>
                <span className="text-positive font-bold">{fmtChg(m.chg)}</span>
              </div>
            ))}
          </div>
          <div className="border border-border bg-surface-primary p-2">
            <div className="text-[10px] font-mono text-negative uppercase mb-1.5">▼ Bottom vs {base} · 24h</div>
            {movers.bot.map(m => (
              <div key={m.c} className="flex justify-between py-0.5 text-[10px] font-mono px-1" style={{ backgroundColor: heatColor(m.chg) }}>
                <span className="text-foreground font-bold">{base}/{m.c}</span>
                <span className="text-negative font-bold">{fmtChg(m.chg)}</span>
              </div>
            ))}
          </div>
          <div className="border border-border bg-surface-primary p-2 text-[9px] font-mono text-muted-foreground space-y-1">
            <div><span className="text-accent">▸</span> Cell shows units of QUOTE per 1 unit of BASE.</div>
            <div><span className="text-accent">▸</span> Heat = BASE 24h % − QUOTE 24h % (capped ±1.5%).</div>
            <div><span className="text-accent">▸</span> INV swaps rows ↔ cols. Δ% toggles bottom line.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
