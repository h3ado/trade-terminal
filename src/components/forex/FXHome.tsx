import { useEffect, useState, useMemo } from 'react';
import { useFXRates } from '@/hooks/useFXRates';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useFxBase } from '@/contexts/FxBaseContext';

// ─── Seeded determinism ───────────────────────────────────────────────────────
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function seeded(s: string, lo: number, hi: number) { return lo + ((Math.abs(hash(s)) % 1000) / 1000) * (hi - lo); }

// ─── Static data ──────────────────────────────────────────────────────────────
const G10 = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];
const EM  = ['CNY', 'INR', 'BRL', 'MXN', 'KRW', 'ZAR', 'TRY'];
const HEAT = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK'];

const PAIRS = [
  { l: 'DXY',     sym: 'DXY', dxy: true },
  { l: 'EUR/USD', sym: 'EUR' },
  { l: 'GBP/USD', sym: 'GBP' },
  { l: 'USD/JPY', sym: 'JPY', inv: true },
  { l: 'USD/CHF', sym: 'CHF', inv: true },
  { l: 'AUD/USD', sym: 'AUD' },
  { l: 'USD/CAD', sym: 'CAD', inv: true },
  { l: 'NZD/USD', sym: 'NZD' },
  { l: 'USD/CNH', sym: 'CNY', inv: true },
];

const RISK = [
  { l: 'VIX',   v: 14.62, chg: -2.31,  d: 2 },
  { l: 'MOVE',  v: 92.4,  chg: -1.18,  d: 1 },
  { l: 'CVIX',  v: 7.85,  chg: +0.42,  d: 2 },
  { l: 'GOLD',  v: 2341,  chg: +0.84,  d: 0 },
  { l: 'WTI',   v: 78.42, chg: -0.62,  d: 2 },
  { l: 'US10Y', v: 4.218, chg: +0.021, d: 3, bps: true },
  { l: 'US2Y',  v: 4.872, chg: -0.014, d: 3, bps: true },
  { l: 'BTC',   v: 64210, chg: +1.24,  d: 0 },
];

const CB_WIRE = [
  { t: '14:42', cb: 'ECB',  h: 'Lagarde: rates well into restrictive territory; data-dependent path ahead' },
  { t: '13:08', cb: 'BOJ',  h: 'Ueda: will not hesitate to act if FX volatility deemed excessive' },
  { t: '11:51', cb: 'FED',  h: 'Williams: another rate cut appropriate over time, watching data closely' },
  { t: '09:30', cb: 'BOE',  h: 'Bailey: services inflation remains too high for comfort' },
  { t: '08:15', cb: 'SNB',  h: 'Schlegel: ready to intervene in FX market if necessary' },
  { t: '06:02', cb: 'RBA',  h: 'Bullock: board not ruling anything in or out on rates' },
];

const EVENTS = [
  { t: '08:30', cc: 'US', e: 'CPI YoY',        cons: '3.2%',   prev: '3.4%',   imp: 3 },
  { t: '10:00', cc: 'US', e: 'FOMC Decision',   cons: '5.25%',  prev: '5.25%',  imp: 3 },
  { t: '07:45', cc: 'EU', e: 'ECB Rate',        cons: '4.25%',  prev: '4.50%',  imp: 3 },
  { t: '04:30', cc: 'GB', e: 'GDP MoM',         cons: '0.2%',   prev: '0.4%',   imp: 2 },
  { t: '23:50', cc: 'JP', e: 'BoJ Minutes',     cons: '—',      prev: '—',      imp: 2 },
  { t: '01:30', cc: 'AU', e: 'Employment Chg',  cons: '+25k',   prev: '+38k',   imp: 2 },
  { t: '12:30', cc: 'CA', e: 'Retail Sales MoM', cons: '0.3%', prev: '-0.1%',  imp: 1 },
];

const POSITIONING = [
  { p: 'EUR', net: +18 }, { p: 'GBP', net: +6  }, { p: 'JPY', net: -42 },
  { p: 'CHF', net: -8  }, { p: 'AUD', net: -22 }, { p: 'CAD', net: -14 },
  { p: 'NZD', net: +9  }, { p: 'MXN', net: +28 },
];

const CORR_ROWS = ['SPX', 'GOLD', 'WTI', 'UST10', 'BTC', 'DXY'];
const CORR_COLS = ['EURUSD', 'USDJPY', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDCHF'];

type Session = { city: string; tz: number; openH: number; closeH: number };
const SESSIONS: Session[] = [
  { city: 'SYDNEY',  tz: 10, openH: 21, closeH: 6  },
  { city: 'TOKYO',   tz: 9,  openH: 0,  closeH: 9  },
  { city: 'LONDON',  tz: 1,  openH: 8,  closeH: 17 },
  { city: 'NEW YORK',tz: -4, openH: 13, closeH: 22 },
];

const fire = (code: string) =>
  window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { code } }));

const RISK_NAV: Record<string, string> = {
  VIX: 'VIX', MOVE: 'ECST', CVIX: 'FXC', GOLD: 'GOLD', WTI: 'WTI',
  US10Y: 'ECST', US2Y: 'ECST', BTC: 'BTC',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelHdr({ children, right, onDrillDown }: { children: React.ReactNode; right?: React.ReactNode; onDrillDown?: () => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-[3px] border-b border-border shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{children}</span>
      <div className="flex items-center gap-2">
        {right && <span className="text-[8px] text-muted-foreground">{right}</span>}
        {onDrillDown && (
          <button onClick={onDrillDown} className="text-[7px] text-accent/50 hover:text-accent uppercase tracking-wider transition-colors">MORE →</button>
        )}
      </div>
    </div>
  );
}

function CcyBar({ ccy, pct, maxAbs = 2, onClick }: { ccy: string; pct: number; maxAbs?: number; onClick?: () => void }) {
  const frac = Math.min(1, Math.abs(pct) / maxAbs);
  const isPos = pct >= 0;
  return (
    <div
      className={`flex items-center gap-1 py-[2px] border-b border-border/20 ${onClick ? 'cursor-pointer hover:bg-white/[0.04] transition-colors' : ''}`}
      onClick={onClick}
    >
      <span className="w-7 text-[9px] text-accent font-bold shrink-0 tabular-nums">{ccy}</span>
      <div className="flex-1 flex items-center h-2.5">
        <div className="flex-1 flex justify-end">
          {!isPos && <div className="h-1.5 bg-negative rounded-sm" style={{ width: `${frac * 100}%` }} />}
        </div>
        <div className="w-px h-2.5 bg-muted-foreground/30 shrink-0 mx-0.5" />
        <div className="flex-1">
          {isPos && <div className="h-1.5 bg-positive rounded-sm" style={{ width: `${frac * 100}%` }} />}
        </div>
      </div>
      <span className={`w-14 text-right text-[9px] tabular-nums font-semibold shrink-0 ${isPos ? 'text-positive' : 'text-negative'}`}>
        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FXHome() {
  const { rates, loading } = useFXRates();
  const { privacyMode } = usePrivacy();
  const { base } = useFxBase();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const redact = (v: string) => privacyMode ? '•••' : v;

  const usdOf   = (c: string) => c === 'USD' ? 1 : rates.find(r => r.ccy === c)?.usd      ?? seeded(c + 'spot', 0.5, 1.5);
  const chgOf   = (c: string) => c === 'USD' ? 0 : rates.find(r => r.ccy === c)?.change_pct ?? seeded(c + 'd1', -1.2, 1.2);

  const g10Sorted = useMemo(() => G10.map(c => ({ ccy: c, d: chgOf(c) })).sort((a, b) => b.d - a.d), [rates]);
  const emSorted  = useMemo(() => EM.map(c => ({ ccy: c, d: chgOf(c) })).sort((a, b) => b.d - a.d), [rates]);
  const carry     = useMemo(() => [...G10, ...EM].map(c => ({ ccy: c, c1y: seeded(c + 'carry', -3, 7) })).sort((a, b) => b.c1y - a.c1y).slice(0, 6), []);
  const corr      = useMemo(() => CORR_ROWS.map(r => CORR_COLS.map(c => +(seeded(r + c + 'rho', -0.85, 0.85)).toFixed(2))), []);

  const heatColor = (v: number) => {
    const cap = Math.max(-2, Math.min(2, v));
    return cap >= 0
      ? `hsl(var(--positive) / ${0.1 + (cap / 2) * 0.55})`
      : `hsl(var(--negative) / ${0.1 + (-cap / 2) * 0.55})`;
  };
  const corrColor = (v: number) => {
    const a = 0.07 + Math.abs(v) * 0.55;
    return v >= 0 ? `hsl(var(--positive) / ${a})` : `hsl(var(--negative) / ${a})`;
  };

  const sessionStatus = (s: Session) => {
    const utcH = now.getUTCHours() + now.getUTCMinutes() / 60;
    const localH = ((utcH + s.tz) % 24 + 24) % 24;
    const open = localH >= s.openH && localH < s.closeH;
    const hh = Math.floor(localH).toString().padStart(2, '0');
    const mm = Math.floor((localH % 1) * 60).toString().padStart(2, '0');
    return { open, time: `${hh}:${mm}` };
  };

  const utcStr = now.toUTCString().slice(17, 22);

  // G10 max spread for bar scaling
  const g10MaxAbs = Math.max(...g10Sorted.map(x => Math.abs(x.d)), 0.5);
  const emMaxAbs  = Math.max(...emSorted.map(x => Math.abs(x.d)), 0.5);

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono text-xs bg-background">

      {/* ── Ticker strip ── */}
      <div className="shrink-0 border-b border-border flex overflow-x-auto">
        {/* FX pairs */}
        <div className="flex shrink-0 border-r border-border">
          {PAIRS.map(k => {
            const spot = k.dxy ? 104.12 : k.inv ? 1 / usdOf(k.sym) : usdOf(k.sym);
            const ch   = k.dxy ? -0.27  : k.inv ? -chgOf(k.sym)    : chgOf(k.sym);
            const dig  = k.sym === 'JPY' || k.sym === 'CNY' ? 2 : k.dxy ? 2 : 4;
            return (
              <button
                key={k.l}
                onClick={() => fire(k.sym)}
                className="flex flex-col justify-center px-3 py-1 border-r border-border/40 last:border-r-0 shrink-0 hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{k.l}</div>
                <div className="text-[13px] font-bold text-foreground tabular-nums leading-tight">
                  {redact(spot.toFixed(dig))}
                </div>
                <div className={`text-[8px] font-semibold tabular-nums ${ch >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {ch >= 0 ? '▲' : '▼'}{Math.abs(ch).toFixed(2)}%
                </div>
              </button>
            );
          })}
        </div>
        {/* Risk indicators */}
        <div className="flex shrink-0">
          {RISK.map(r => (
            <button
              key={r.l}
              onClick={() => fire(RISK_NAV[r.l] || r.l)}
              className="flex flex-col justify-center px-3 py-1 border-r border-border/40 last:border-r-0 shrink-0 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{r.l}</div>
              <div className="text-[13px] font-bold text-foreground tabular-nums leading-tight">
                {redact(r.v.toFixed(r.d))}
              </div>
              <div className={`text-[8px] font-semibold tabular-nums ${r.chg >= 0 ? 'text-positive' : 'text-negative'}`}>
                {r.chg >= 0 ? '▲' : '▼'}{r.bps ? `${Math.abs(r.chg * 100).toFixed(1)}bp` : `${Math.abs(r.chg).toFixed(2)}%`}
              </div>
            </button>
          ))}
        </div>
        {/* Live indicator */}
        <div className="ml-auto px-3 flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-positive'}`} />
          <span className="text-[8px] text-muted-foreground">LIVE · UTC {utcStr}</span>
        </div>
      </div>

      {/* ── Session bar ── */}
      <div className="shrink-0 border-b border-border flex items-center gap-0 px-0 bg-surface-elevated">
        <span className="px-3 text-[8px] text-accent font-bold uppercase tracking-widest border-r border-border/60 py-[3px]">Sessions</span>
        {SESSIONS.map(s => {
          const st = sessionStatus(s);
          return (
            <div key={s.city} className="flex items-center gap-1.5 px-3 border-r border-border/40 py-[3px]">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.open ? 'bg-positive animate-pulse' : 'bg-muted-foreground/30'}`} />
              <span className={`text-[8px] font-bold ${st.open ? 'text-foreground' : 'text-muted-foreground'}`}>{s.city}</span>
              <span className="text-[8px] text-muted-foreground tabular-nums">{st.time}</span>
              <span className={`text-[8px] font-semibold ${st.open ? 'text-positive' : 'text-muted-foreground/50'}`}>
                {st.open ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          );
        })}
        <span className="ml-auto px-3 text-[8px] text-muted-foreground">
          BASE: <span className="text-accent font-bold">{base}</span>
        </span>
      </div>

      {/* ── Main grid ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ── Left column: Currency performance ── */}
        <div className="w-[26%] shrink-0 border-r border-border flex flex-col min-h-0">

          {/* G10 Performance */}
          <div className="flex-1 min-h-0 border-b border-border flex flex-col">
            <PanelHdr right={`vs ${base}`} onDrillDown={() => fire('FXC')}>G10 Perf · 1D</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              {g10Sorted.map(r => <CcyBar key={r.ccy} ccy={r.ccy} pct={r.d} maxAbs={g10MaxAbs} onClick={() => fire(r.ccy)} />)}
            </div>
          </div>

          {/* EM Performance */}
          <div className="flex-1 min-h-0 border-b border-border flex flex-col">
            <PanelHdr right={`vs ${base}`} onDrillDown={() => fire('FXC')}>EM Perf · 1D</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              {emSorted.map(r => <CcyBar key={r.ccy} ccy={r.ccy} pct={r.d} maxAbs={emMaxAbs} onClick={() => fire(r.ccy)} />)}
            </div>
          </div>

          {/* Carry & CFTC */}
          <div className="shrink-0 border-b border-border flex flex-col">
            <PanelHdr onDrillDown={() => fire('FXC')}>Top Carry · 1Y</PanelHdr>
            <div className="px-2 py-1">
              {carry.map(c => (
                <div
                  key={c.ccy}
                  onClick={() => fire(c.ccy)}
                  className="flex justify-between items-center py-[2px] border-b border-border/20 cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-[9px] text-foreground font-semibold">{c.ccy}</span>
                  <span className={`text-[9px] tabular-nums font-bold ${c.c1y >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {c.c1y >= 0 ? '+' : ''}{c.c1y.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CFTC Positioning */}
          <div className="flex-1 min-h-0 flex flex-col">
            <PanelHdr onDrillDown={() => fire('FXC')}>CFTC Net Spec · % OI</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
              {POSITIONING.map(p => {
                const frac = Math.min(1, Math.abs(p.net) / 50);
                return (
                  <div
                    key={p.p}
                    onClick={() => fire(p.p)}
                    className="flex items-center gap-1.5 py-[2px] border-b border-border/20 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="w-7 text-[9px] text-foreground font-bold shrink-0">{p.p}</span>
                    <div className="flex-1 flex items-center h-2.5">
                      <div className="flex-1 flex justify-end">
                        {p.net < 0 && <div className="h-1.5 bg-negative rounded-sm" style={{ width: `${frac * 100}%` }} />}
                      </div>
                      <div className="w-px h-2.5 bg-muted-foreground/30 shrink-0 mx-0.5" />
                      <div className="flex-1">
                        {p.net >= 0 && <div className="h-1.5 bg-positive rounded-sm" style={{ width: `${frac * 100}%` }} />}
                      </div>
                    </div>
                    <span className={`w-9 text-right text-[9px] tabular-nums font-semibold shrink-0 ${p.net >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {p.net >= 0 ? '+' : ''}{p.net}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Center column: Heatmap + Correlation ── */}
        <div className="flex-1 min-w-0 border-r border-border flex flex-col min-h-0">

          {/* Cross Heatmap */}
          <div className="flex-1 min-h-0 border-b border-border flex flex-col">
            <PanelHdr onDrillDown={() => fire('FXC')}>G10 Cross-Rate Heatmap · 1D %</PanelHdr>
            <div className="flex-1 min-h-0 overflow-auto px-2 py-1">
              <table className="w-full table-fixed text-[9px]">
                <thead>
                  <tr>
                    <th className="w-8 py-0.5" />
                    {HEAT.map(c => (
                      <th key={c} className="py-0.5 text-[8px] text-accent font-bold text-center">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HEAT.map(r => (
                    <tr key={r}>
                      <td className="py-0.5 text-[8px] text-accent font-bold">{r}</td>
                      {HEAT.map(c => {
                        if (r === c) return (
                          <td key={c} className="py-0.5 text-center text-muted-foreground/30 text-[8px]">—</td>
                        );
                        const v = chgOf(r) - chgOf(c);
                        return (
                          <td
                            key={c}
                            className="py-0.5 text-center text-[8px] font-semibold tabular-nums"
                            style={{ backgroundColor: heatColor(v), color: Math.abs(v) > 0.8 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                          >
                            {v >= 0 ? '+' : ''}{v.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cross-Asset Correlation */}
          <div className="flex-1 min-h-0 flex flex-col">
            <PanelHdr onDrillDown={() => fire('FXC')}>Cross-Asset ρ · 30D</PanelHdr>
            <div className="flex-1 min-h-0 overflow-auto px-2 py-1">
              <table className="w-full table-fixed text-[9px]">
                <thead>
                  <tr>
                    <th className="w-10 py-0.5" />
                    {CORR_COLS.map(c => (
                      <th key={c} className="py-0.5 text-[8px] text-accent text-center">{c.replace('USD', '')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CORR_ROWS.map((r, ri) => (
                    <tr key={r}>
                      <td className="py-0.5 text-[8px] text-accent font-bold">{r}</td>
                      {CORR_COLS.map((_, ci) => {
                        const v = corr[ri][ci];
                        return (
                          <td
                            key={ci}
                            className="py-0.5 text-center text-[8px] font-semibold tabular-nums"
                            style={{ backgroundColor: corrColor(v), color: Math.abs(v) > 0.5 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                          >
                            {v > 0 ? '+' : ''}{v.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right column: CB Wire + Calendar + Macro ── */}
        <div className="w-[28%] shrink-0 flex flex-col min-h-0">

          {/* Central Bank Wire */}
          <div className="flex-[5] min-h-0 border-b border-border flex flex-col">
            <PanelHdr onDrillDown={() => fire('FED')}>Central Bank Wire</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {CB_WIRE.map((h, i) => (
                <div
                  key={i}
                  onClick={() => fire('FED')}
                  className="flex gap-2 px-2 py-1.5 border-b border-border/30 hover:bg-white/[0.04] cursor-pointer transition-colors"
                >
                  <span className="text-[8px] text-muted-foreground tabular-nums w-8 shrink-0 pt-[1px]">{h.t}</span>
                  <span className="text-[8px] text-accent font-bold w-7 shrink-0 pt-[1px]">{h.cb}</span>
                  <span className="text-[9px] text-foreground leading-snug flex-1">{h.h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Economic Calendar */}
          <div className="flex-[5] min-h-0 border-b border-border flex flex-col">
            <PanelHdr right="TODAY" onDrillDown={() => fire('ECO')}>Econ Calendar · High Impact</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-surface-deep">
                  <tr className="border-b border-border/60">
                    <th className="text-left px-2 py-0.5 text-[8px] text-muted-foreground font-normal">TIME</th>
                    <th className="text-left px-1 py-0.5 text-[8px] text-muted-foreground font-normal">CC</th>
                    <th className="text-left px-1 py-0.5 text-[8px] text-muted-foreground font-normal">EVENT</th>
                    <th className="text-right px-2 py-0.5 text-[8px] text-muted-foreground font-normal">CONS</th>
                    <th className="text-right px-2 py-0.5 text-[8px] text-muted-foreground font-normal">PREV</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map((e, i) => (
                    <tr key={i} onClick={() => fire('ECO')} className="border-b border-border/20 hover:bg-white/[0.04] cursor-pointer transition-colors">
                      <td className="px-2 py-1 text-muted-foreground tabular-nums">{e.t}</td>
                      <td className="px-1 py-1 text-accent font-bold">{e.cc}</td>
                      <td className="px-1 py-1 text-foreground">
                        <div className="flex items-center gap-1">
                          <span className={`text-[7px] shrink-0 ${e.imp === 3 ? 'text-negative' : e.imp === 2 ? 'text-accent' : 'text-muted-foreground'}`}>
                            {'★'.repeat(e.imp)}{'☆'.repeat(3 - e.imp)}
                          </span>
                          <span className="truncate">{e.e}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right font-semibold tabular-nums">{e.cons}</td>
                      <td className="px-2 py-1 text-right text-muted-foreground tabular-nums">{e.prev}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Macro snapshot strip */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <PanelHdr>Macro Snapshot</PanelHdr>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 grid grid-cols-2 gap-x-3 content-start">
              {[
                { l: 'US CPI YoY',     v: '3.4%',    chg: -0.2, unit: '%' },
                { l: 'EU CPI YoY',     v: '2.6%',    chg: -0.3, unit: '%' },
                { l: 'US Unemp.',      v: '3.9%',    chg: +0.1, unit: '%' },
                { l: 'Fed Funds',      v: '5.25%',   chg: 0,    unit: '%' },
                { l: 'ECB Rate',       v: '4.25%',   chg: -0.25,unit: '%' },
                { l: 'BoJ Rate',       v: '0.10%',   chg: +0.1, unit: '%' },
                { l: 'US GDP YoY',     v: '2.9%',    chg: +0.4, unit: '%' },
                { l: 'Global PMI',     v: '51.2',    chg: +0.8, unit: '' },
              ].map(m => (
                <div key={m.l} className="flex justify-between items-center py-[2px] border-b border-border/20">
                  <span className="text-[8px] text-muted-foreground truncate">{m.l}</span>
                  <span className={`text-[9px] tabular-nums font-semibold ml-1 shrink-0 ${m.chg > 0 ? 'text-positive' : m.chg < 0 ? 'text-negative' : 'text-foreground'}`}>
                    {m.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
