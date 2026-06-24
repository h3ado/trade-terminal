import { useMemo, useEffect, useState } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useFxBase } from '@/contexts/FxBaseContext';
import FxProChart from '@/components/forex/chart/FxProChart';
import ExpandableChartCard from '@/components/forex/chart/ExpandableChartCard';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';


const G10 = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];
const EM = ['CNY', 'INR', 'BRL', 'MXN', 'KRW', 'ZAR', 'TRY'];
const HEAT = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

const KPIS: { l: string; sym: string }[] = [
  { l: 'DXY', sym: 'DXY' },
  { l: 'EUR/USD', sym: 'EUR' },
  { l: 'USD/JPY', sym: 'JPY' },
  { l: 'GBP/USD', sym: 'GBP' },
  { l: 'USD/CNH', sym: 'CNY' },
  { l: 'AUD/USD', sym: 'AUD' },
  { l: 'USD/CAD', sym: 'CAD' },
];

const RISK: { l: string; v: string; chg: number; positive?: boolean }[] = [
  { l: 'VIX', v: '14.62', chg: -2.31 },
  { l: 'MOVE', v: '92.4', chg: -1.18 },
  { l: 'CVIX', v: '7.85', chg: +0.42 },
  { l: 'GOLD', v: '2,341', chg: +0.84, positive: true },
  { l: 'WTI', v: '78.42', chg: -0.62 },
  { l: 'US10Y', v: '4.218%', chg: +2.1 },
  { l: 'BTC', v: '64,210', chg: +1.24, positive: true },
];

type Session = { city: string; tz: number; openH: number; closeH: number };
const SESSIONS: Session[] = [
  { city: 'TYO', tz: 9, openH: 0, closeH: 9 },
  { city: 'LON', tz: 0, openH: 8, closeH: 17 },
  { city: 'NY',  tz: -5, openH: 13, closeH: 22 },
];

const EVENTS = [
  { t: '12:30', cc: 'US', e: 'CPI YoY', cons: '3.2%', prev: '3.4%', imp: 3 },
  { t: '14:00', cc: 'US', e: 'FOMC Decision', cons: '5.25%', prev: '5.25%', imp: 3 },
  { t: '08:30', cc: 'EU', e: 'ECB Rate', cons: '4.25%', prev: '4.50%', imp: 3 },
  { t: '06:00', cc: 'GB', e: 'GDP MoM', cons: '0.2%', prev: '0.4%', imp: 2 },
  { t: '23:50', cc: 'JP', e: 'BoJ Minutes', cons: '—', prev: '—', imp: 2 },
  { t: '01:30', cc: 'AU', e: 'Employment', cons: '+25k', prev: '+38k', imp: 2 },
];

const CORR_ROWS = ['SPX', 'GOLD', 'WTI', 'UST10', 'BTC', 'DXY'];
const CORR_COLS = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF'];

const POSITIONING = [
  { p: 'EUR', net: +18 }, { p: 'GBP', net: +6 }, { p: 'JPY', net: -42 },
  { p: 'CHF', net: -8 }, { p: 'AUD', net: -22 }, { p: 'CAD', net: -14 }, { p: 'MXN', net: +28 },
];

export default function FXHome() {
  const { rates, loading } = useFXRates();
  const { privacyMode } = usePrivacy();
  const { base } = useFxBase();
  const redact = (v: string) => (privacyMode ? '•••••' : v);

  const usdOf = (c: string) => (c === 'USD' ? 1 : rates.find(r => r.ccy === c)?.usd ?? seeded(c + 'spot', 0.5, 1.5));
  const chgOf = (c: string) => (c === 'USD' ? 0 : rates.find(r => r.ccy === c)?.change_pct ?? seeded(c + 'd1', -1, 1));

  const g10Sorted = useMemo(() => G10.map(c => ({ ccy: c, d: chgOf(c) })).sort((a, b) => b.d - a.d), [rates]);
  const emSorted = useMemo(() => EM.map(c => ({ ccy: c, d: chgOf(c) })).sort((a, b) => b.d - a.d), [rates]);

  const heatColor = (v: number) => {
    const cap = Math.max(-2, Math.min(2, v));
    return cap >= 0 ? `hsl(var(--positive) / ${0.12 + (cap / 2) * 0.55})` : `hsl(var(--negative) / ${0.12 + (-cap / 2) * 0.55})`;
  };

  const carry = useMemo(() => [...G10, ...EM].map(c => ({ ccy: c, c1y: seeded(c + 'carry', -3, 7) })).sort((a, b) => b.c1y - a.c1y).slice(0, 5), []);

  const cbHeadlines = [
    { t: '14:42', cb: 'ECB', h: 'Lagarde: rates well into restrictive territory; data-dependent' },
    { t: '13:08', cb: 'BOJ', h: 'Ueda: will not hesitate to act if FX volatility excessive' },
    { t: '11:51', cb: 'Fed', h: 'Williams: another rate cut appropriate over time' },
    { t: '09:30', cb: 'BOE', h: 'Bailey: services inflation remains too high' },
    { t: '08:15', cb: 'SNB', h: 'Schlegel: ready to intervene in FX market if needed' },
  ];

  // Live clock for sessions
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const sessionStatus = (s: Session) => {
    const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
    const localH = ((utcH + s.tz) % 24 + 24) % 24;
    const open = localH >= s.openH && localH < s.closeH;
    const hh = Math.floor(localH).toString().padStart(2, '0');
    const mm = Math.floor((localH - Math.floor(localH)) * 60).toString().padStart(2, '0');
    return { open, time: `${hh}:${mm}` };
  };

  // Seeded correlations (-1..+1)
  const corr = useMemo(() => CORR_ROWS.map(r => CORR_COLS.map(c => +(seeded(r + c + 'rho', -0.85, 0.85)).toFixed(2))), []);
  const corrColor = (v: number) => {
    const a = 0.08 + Math.abs(v) * 0.6;
    return v >= 0 ? `hsl(var(--positive) / ${a})` : `hsl(var(--negative) / ${a})`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">Forex Terminal</span>
        <span className="text-muted-foreground font-mono text-[9px]">FX &lt;GO&gt;</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">Base: <span className="text-accent font-bold">{base}</span></span>
        {loading && <span className="text-[9px] font-mono text-muted-foreground animate-pulse">·live</span>}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {KPIS.map(k => {
          const isDxy = k.sym === 'DXY';
          const spot = isDxy ? 104.12 : k.l.startsWith('USD/') ? 1 / usdOf(k.sym) : usdOf(k.sym);
          const ch = isDxy ? -0.27 : k.l.startsWith('USD/') ? -chgOf(k.sym) : chgOf(k.sym);
          return (
            <div key={k.l} className="border border-border bg-surface-primary p-2">
              <div className="text-[9px] font-mono text-muted-foreground">{k.l}</div>
              <div className="text-base font-mono font-bold text-foreground">{redact(spot.toFixed(k.sym === 'JPY' ? 2 : 4))}</div>
              <div className={`text-[9px] font-mono ${ch < 0 ? 'text-negative' : 'text-positive'}`}>{ch >= 0 ? '+' : ''}{ch.toFixed(2)}%</div>
            </div>
          );
        })}
      </div>

      {/* Risk strip */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {RISK.map(r => (
          <div key={r.l} className="border border-border bg-surface-primary p-2">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">{r.l}</div>
            <div className="text-sm font-mono font-bold text-foreground">{redact(r.v)}</div>
            <div className={`text-[9px] font-mono ${r.chg < 0 ? 'text-negative' : 'text-positive'}`}>{r.chg >= 0 ? '+' : ''}{r.chg.toFixed(2)}%</div>
          </div>
        ))}
      </div>

      {/* Session clock bar */}
      <div className="flex items-center gap-3 border border-border bg-surface-primary px-2 py-1 text-[10px] font-mono flex-wrap">
        <span className="text-accent uppercase">Sessions</span>
        {SESSIONS.map(s => {
          const st = sessionStatus(s);
          return (
            <div key={s.city} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 ${st.open ? 'bg-positive animate-pulse' : 'bg-muted-foreground/40'}`} />
              <span className="text-foreground font-bold">{s.city}</span>
              <span className="text-muted-foreground">{st.time}</span>
              <span className={`${st.open ? 'text-positive' : 'text-muted-foreground/60'}`}>{st.open ? 'OPEN' : 'CLOSED'}</span>
            </div>
          );
        })}
        <span className="ml-auto text-muted-foreground">UTC {now.toUTCString().slice(17, 22)}</span>
      </div>

      {/* DXY + G10/EM bars */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2">
          <FxProChart symbol="DXY" title="· DOLLAR INDEX" digits={2} height={240} initialCfg={{ timeframe: '1D', range: '3M', type: 'candle', ema20: true, ema50: true }} />
        </div>

        <ExpandableChartCard title={`G10 · 1D vs ${base}`} defaultHeight={200} code="WCR">
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <BarChart data={g10Sorted} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis dataKey="ccy" type="category" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} width={32} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Bar dataKey="d">{g10Sorted.map((p, i) => <Cell key={i} fill={p.d >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}</Bar>
              </BarChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>

        <ExpandableChartCard title={`EM · 1D vs ${base}`} defaultHeight={200} code="WCR">
          {(h) => (
            <ExpandableResponsiveContainer width="100%" height={h}>
              <BarChart data={emSorted} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
                <YAxis dataKey="ccy" type="category" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} width={32} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
                <Bar dataKey="d">{emSorted.map((p, i) => <Cell key={i} fill={p.d >= 0 ? 'hsl(var(--positive))' : 'hsl(var(--negative))'} />)}</Bar>
              </BarChart>
            </ExpandableResponsiveContainer>
          )}
        </ExpandableChartCard>
      </div>

      {/* Heatmap + cb headlines + carry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-2">G10 Cross Heatmap · 1D %</div>
          <table className="w-full table-fixed text-[9px] font-mono">
            <thead>
              <tr>
                <th className="w-8"></th>
                {HEAT.map(c => <th key={c} className="px-0.5 py-0.5 text-accent font-bold text-center">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {HEAT.map(r => (
                <tr key={r}>
                  <td className="px-1 py-0.5 text-accent font-bold">{r}</td>
                  {HEAT.map(c => {
                    if (r === c) return <td key={c} className="px-0.5 py-0.5 text-muted-foreground/40 text-center">—</td>;
                    const v = chgOf(r) - chgOf(c);
                    return (
                      <td key={c} className="px-0.5 py-0.5 text-center text-foreground font-bold" style={{ backgroundColor: heatColor(v) }}>
                        {v >= 0 ? '+' : ''}{v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="border border-border bg-surface-primary p-3">
            <div className="text-[10px] font-mono text-accent uppercase mb-1">Central Bank Wire</div>
            <div className="space-y-1">
              {cbHeadlines.map((h, i) => (
                <div key={i} className="text-[10px] font-mono flex gap-2 border-b border-grid-line last:border-0 pb-1">
                  <span className="text-muted-foreground w-10">{h.t}</span>
                  <span className="text-accent font-bold w-10">{h.cb}</span>
                  <span className="text-foreground flex-1">{h.h}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-border bg-surface-primary p-3">
            <div className="text-[10px] font-mono text-accent uppercase mb-1">Top 5 Carry · 1Y</div>
            {carry.map(c => (
              <div key={c.ccy} className="flex justify-between text-[10px] font-mono py-0.5 border-b border-grid-line last:border-0">
                <span className="text-foreground">{c.ccy}</span>
                <span className={`font-bold ${c.c1y >= 0 ? 'text-positive' : 'text-negative'}`}>{c.c1y >= 0 ? '+' : ''}{c.c1y.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar + Correlation + Positioning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Today · High Impact Events</div>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-muted-foreground border-b border-grid-line">
                <th className="text-left px-1 py-0.5">TIME</th>
                <th className="text-left px-1 py-0.5">CC</th>
                <th className="text-left px-1 py-0.5">EVENT</th>
                <th className="text-right px-1 py-0.5">CONS</th>
                <th className="text-right px-1 py-0.5">PREV</th>
              </tr>
            </thead>
            <tbody>
              {EVENTS.map((e, i) => (
                <tr key={i} className="border-b border-grid-line last:border-0">
                  <td className="px-1 py-0.5 text-muted-foreground">{e.t}</td>
                  <td className="px-1 py-0.5 text-accent font-bold">{e.cc}</td>
                  <td className="px-1 py-0.5 text-foreground flex items-center gap-1">
                    <span className={`${e.imp === 3 ? 'text-negative' : 'text-accent'}`}>{'★'.repeat(e.imp)}</span>
                    {e.e}
                  </td>
                  <td className="px-1 py-0.5 text-right text-foreground">{e.cons}</td>
                  <td className="px-1 py-0.5 text-right text-muted-foreground">{e.prev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">Cross-Asset ρ · 30D</div>
          <table className="w-full table-fixed text-[9px] font-mono">
            <thead>
              <tr>
                <th className="w-10"></th>
                {CORR_COLS.map(c => <th key={c} className="px-0.5 py-0.5 text-accent text-center">{c.replace('USD', '')}</th>)}
              </tr>
            </thead>
            <tbody>
              {CORR_ROWS.map((r, ri) => (
                <tr key={r}>
                  <td className="px-1 py-0.5 text-accent font-bold">{r}</td>
                  {CORR_COLS.map((_, ci) => {
                    const v = corr[ri][ci];
                    return (
                      <td key={ci} className="px-0.5 py-0.5 text-center text-foreground font-bold" style={{ backgroundColor: corrColor(v) }}>
                        {v > 0 ? '+' : ''}{v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-accent uppercase mb-1">CFTC Net Spec · % OI</div>
          <div className="space-y-1">
            {POSITIONING.map(p => {
              const w = Math.min(50, Math.abs(p.net));
              return (
                <div key={p.p} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-8 text-foreground font-bold">{p.p}</span>
                  <div className="flex-1 flex items-center h-3">
                    <div className="flex-1 flex justify-end">
                      {p.net < 0 && <div className="h-full bg-negative" style={{ width: `${w * 2}%` }} />}
                    </div>
                    <div className="w-px h-full bg-muted-foreground/40" />
                    <div className="flex-1 flex">
                      {p.net >= 0 && <div className="h-full bg-positive" style={{ width: `${w * 2}%` }} />}
                    </div>
                  </div>
                  <span className={`w-10 text-right font-bold ${p.net >= 0 ? 'text-positive' : 'text-negative'}`}>{p.net >= 0 ? '+' : ''}{p.net}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
