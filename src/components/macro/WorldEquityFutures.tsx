import { useEffect, useMemo, useState } from 'react';
import { useIndices } from '@/hooks/useIndices';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

type Contract = {
  code: string; underlying: string; abbr: string; ccy: string; mult: number; session: 'US' | 'EU' | 'ASIA';
  rate: number; div: number;
};

const CONTRACTS: Contract[] = [
  { code: 'ES', underlying: 'S&P 500',    abbr: 'NYSE', ccy: 'USD', mult: 50,  session: 'US',   rate: 4.30, div: 1.40 },
  { code: 'NQ', underlying: 'Nasdaq 100', abbr: 'NDAQ', ccy: 'USD', mult: 20,  session: 'US',   rate: 4.30, div: 0.80 },
  { code: 'YM', underlying: 'Dow',        abbr: 'CME',  ccy: 'USD', mult: 5,   session: 'US',   rate: 4.30, div: 1.90 },
  { code: 'RTY', underlying: 'Russell 2k', abbr: 'NYSE', ccy: 'USD', mult: 50, session: 'US',   rate: 4.30, div: 1.50 },
  { code: 'FESX', underlying: 'EuroStoxx', abbr: 'PAR',  ccy: 'EUR', mult: 10, session: 'EU',   rate: 2.40, div: 3.30 },
  { code: 'FDAX', underlying: 'DAX',       abbr: 'XETR', ccy: 'EUR', mult: 25, session: 'EU',   rate: 2.40, div: 2.90 },
  { code: 'Z',    underlying: 'FTSE 100',  abbr: 'LSE',  ccy: 'GBP', mult: 10, session: 'EU',   rate: 4.50, div: 3.80 },
  { code: 'CAC',  underlying: 'CAC 40',    abbr: 'PAR',  ccy: 'EUR', mult: 10, session: 'EU',   rate: 2.40, div: 3.10 },
  { code: 'SMI',  underlying: 'SMI',       abbr: 'SIX',  ccy: 'CHF', mult: 10, session: 'EU',   rate: 1.00, div: 3.00 },
  { code: 'NK',   underlying: 'Nikkei 225',abbr: 'TSE',  ccy: 'JPY', mult: 1000,session: 'ASIA', rate: 0.50, div: 1.70 },
  { code: 'HI',   underlying: 'Hang Seng', abbr: 'HKEX', ccy: 'HKD', mult: 50, session: 'ASIA', rate: 4.80, div: 3.40 },
  { code: 'HCEI', underlying: 'HSCEI',     abbr: 'HKEX', ccy: 'HKD', mult: 50, session: 'ASIA', rate: 4.80, div: 3.50 },
  { code: 'K200', underlying: 'KOSPI 200', abbr: 'KRX',  ccy: 'KRW', mult: 250000, session: 'ASIA', rate: 3.50, div: 2.20 },
  { code: 'IN',   underlying: 'SGX Nifty', abbr: 'BSE',  ccy: 'USD', mult: 2,  session: 'ASIA', rate: 6.50, div: 1.20 },
  { code: 'AP',   underlying: 'ASX 200',   abbr: 'ASX',  ccy: 'AUD', mult: 25, session: 'ASIA', rate: 4.10, div: 3.90 },
];

function h(s: string) { let v = 0; for (let i = 0; i < s.length; i++) v = (v * 31 + s.charCodeAt(i)) | 0; return Math.abs(v); }
function seed(s: string, lo: number, hi: number) { return lo + ((h(s) % 1000) / 1000) * (hi - lo); }

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const QUARTERLY = [2, 5, 8, 11]; // Mar, Jun, Sep, Dec

function nextQuarterlyExpiry(offset = 0): { code: string; days: number } {
  const now = new Date();
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth();
  let count = 0;
  while (count <= offset) {
    if (QUARTERLY.includes(m) && new Date(Date.UTC(y, m, 21)) > now) {
      if (count === offset) return { code: `${MONTHS[m]}${String(y).slice(-2)}`, days: Math.round((Date.UTC(y, m, 21) - now.getTime()) / 86_400_000) };
      count++;
    }
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return { code: 'JUN26', days: 90 };
}

export default function WorldEquityFutures() {
  const { indices } = useIndices();
  const { privacyMode } = usePrivacy();
  const redact = (v: any) => privacyMode ? '•••••' : String(v);
  const [selected, setSelected] = useState<string>('ES');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(() => CONTRACTS.map(c => {
    const ix = indices.find(i => i.abbr === c.abbr);
    const spot = ix?.close ?? 1000;
    const dySpot = ix?.change_pct ?? 0;
    const m1 = nextQuarterlyExpiry(0);
    const ttm = m1.days / 365;
    // basis = spot * (rate - div) * ttm / 100
    const basis = spot * ((c.rate - c.div) / 100) * ttm;
    const fair = spot + basis;
    const noise = seed(c.code + 'fut', -0.4, 0.4);
    const last = fair * (1 + noise / 100);
    const chg = last - (spot * (1 + (dySpot - seed(c.code + 'pn', -0.2, 0.2)) / 100));
    const fv = last - fair;
    return {
      ...c, expiry: m1.code, dte: m1.days, spot, last,
      chg, chgPct: (chg / Math.max(0.0001, last - chg)) * 100,
      bid: last - seed(c.code + 'b', 0.05, 0.4),
      ask: last + seed(c.code + 'a', 0.05, 0.4),
      vol: Math.round(seed(c.code + 'v', 50000, 1800000)),
      oi: Math.round(seed(c.code + 'oi', 100000, 3200000)),
      settle: spot * (1 + seed(c.code + 'st', -0.6, 0.6) / 100),
      basis, fair, fv,
      impY: ((c.rate - c.div) / 100) * 100,
    };
  }), [indices]);

  const sel = rows.find(r => r.code === selected) ?? rows[0];

  // Term structure
  const term = useMemo(() => {
    if (!sel) return [];
    return Array.from({ length: 6 }, (_, i) => {
      const exp = nextQuarterlyExpiry(i);
      const ttm = exp.days / 365;
      const b = sel.spot * ((sel.rate - sel.div) / 100) * ttm;
      const noise = seed(sel.code + 'k' + i, -0.3, 0.3);
      return { m: `M${i + 1}`, exp: exp.code, dte: exp.days, price: +(sel.spot + b * (1 + noise / 100)).toFixed(2), basis: +b.toFixed(2) };
    });
  }, [sel]);

  const spreads = useMemo(() => {
    if (term.length < 3) return [] as any[];
    return [
      { lbl: 'M1–M2', v: term[1].price - term[0].price, roll: term[1].basis - term[0].basis },
      { lbl: 'M2–M3', v: term[2].price - term[1].price, roll: term[2].basis - term[1].basis },
      { lbl: 'M1–M3', v: term[2].price - term[0].price, roll: term[2].basis - term[0].basis },
      { lbl: 'M1–M4', v: term[3].price - term[0].price, roll: term[3].basis - term[0].basis },
    ];
  }, [term]);

  // Session clock (UTC reference: US 14:30-21:00, EU 08:00-16:30, ASIA 00:00-07:00)
  const sessions = useMemo(() => {
    const u = now.getUTCHours() + now.getUTCMinutes() / 60;
    const ranges = { ASIA: [0, 7], EU: [8, 16.5], US: [14.5, 21] } as Record<string, [number, number]>;
    return Object.entries(ranges).map(([k, [a, b]]) => {
      const open = u >= a && u < b;
      const toMin = (h: number) => `${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor((h%1)*60)).padStart(2,'0')}`;
      const delta = open ? b - u : (u < a ? a - u : 24 - u + a);
      return { k, open, range: `${toMin(a)}–${toMin(b)}`, delta };
    });
  }, [now]);

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-accent font-bold text-xs uppercase">World Equity Index Futures</span>
        <span className="text-muted-foreground text-[9px]">WEIF &lt;GO&gt;</span>
        <div className="ml-auto flex gap-1 items-center text-[9px]">
          <span className="text-muted-foreground">SESSION:</span>
          {sessions.map(s => (
            <span key={s.k} className={`px-1.5 py-0.5 border ${s.open ? 'border-positive text-positive' : 'border-border text-muted-foreground'}`}>
              {s.k} {s.open ? '●' : '○'} {s.delta.toFixed(1)}h
            </span>
          ))}
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="px-2 py-1.5 text-accent text-left">CTR</th>
              <th className="px-2 py-1.5 text-accent text-left">UNDERLYING</th>
              <th className="px-2 py-1.5 text-accent text-left">EXP</th>
              <th className="px-2 py-1.5 text-accent text-right">DTE</th>
              <th className="px-2 py-1.5 text-accent text-right">LAST</th>
              <th className="px-2 py-1.5 text-accent text-right">CHG</th>
              <th className="px-2 py-1.5 text-accent text-right">%CHG</th>
              <th className="px-2 py-1.5 text-accent text-right">BID</th>
              <th className="px-2 py-1.5 text-accent text-right">ASK</th>
              <th className="px-2 py-1.5 text-accent text-right">VOL</th>
              <th className="px-2 py-1.5 text-accent text-right">OI</th>
              <th className="px-2 py-1.5 text-accent text-right">SETTLE</th>
              <th className="px-2 py-1.5 text-accent text-right">SPOT</th>
              <th className="px-2 py-1.5 text-accent text-right">BASIS</th>
              <th className="px-2 py-1.5 text-accent text-right">FAIR</th>
              <th className="px-2 py-1.5 text-accent text-right">FV GAP</th>
              <th className="px-2 py-1.5 text-accent text-right">IMP Y%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.code} onClick={() => setSelected(r.code)}
                className={`border-b border-grid-line cursor-pointer ${selected === r.code ? 'bg-accent/10' : i % 2 ? 'bg-surface-elevated/20' : ''} hover:bg-surface-elevated/60`}>
                <td className="px-2 py-1 text-accent font-bold">{r.code}</td>
                <td className="px-2 py-1 text-foreground">{r.underlying} <span className="text-muted-foreground text-[9px]">· {r.ccy}</span></td>
                <td className="px-2 py-1 text-muted-foreground">{r.expiry}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{r.dte}d</td>
                <td className="px-2 py-1 text-right text-foreground font-bold">{redact(r.last.toLocaleString(undefined, { maximumFractionDigits: 2 }))}</td>
                <td className={`px-2 py-1 text-right font-bold ${r.chg >= 0 ? 'text-positive' : 'text-negative'}`}>{redact((r.chg >= 0 ? '+' : '') + r.chg.toFixed(2))}</td>
                <td className={`px-2 py-1 text-right font-bold ${r.chgPct >= 0 ? 'text-positive' : 'text-negative'}`}>{(r.chgPct >= 0 ? '+' : '') + r.chgPct.toFixed(2)}%</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(r.bid.toFixed(2))}</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(r.ask.toFixed(2))}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{(r.vol/1000).toFixed(0)}k</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{(r.oi/1000).toFixed(0)}k</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(r.settle.toFixed(2))}</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(r.spot.toFixed(2))}</td>
                <td className={`px-2 py-1 text-right ${r.basis >= 0 ? 'text-positive' : 'text-negative'}`}>{(r.basis >= 0 ? '+' : '') + r.basis.toFixed(2)}</td>
                <td className="px-2 py-1 text-right text-foreground">{redact(r.fair.toFixed(2))}</td>
                <td className={`px-2 py-1 text-right font-bold ${Math.abs(r.fv) < 1 ? 'text-muted-foreground' : r.fv >= 0 ? 'text-positive' : 'text-negative'}`}>{(r.fv >= 0 ? '+' : '') + r.fv.toFixed(2)}</td>
                <td className={`px-2 py-1 text-right ${r.impY >= 0 ? 'text-positive' : 'text-negative'}`}>{r.impY.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="border border-border bg-surface-primary p-3 lg:col-span-2">
          <div className="text-[10px] text-muted-foreground mb-1">{sel?.code} TERM STRUCTURE · {sel?.underlying}</div>
          <ExpandableResponsiveContainer width="100%" height={220}>
            <LineChart data={term}>
              <XAxis dataKey="exp" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <ReferenceLine y={sel?.spot} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: 'SPOT', fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="price" stroke="hsl(var(--accent))" strokeWidth={1.8} dot={{ r: 3, fill: 'hsl(var(--accent))' }} />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border border-border bg-surface-primary p-3 space-y-2">
          <div className="text-[10px] text-muted-foreground">CALENDAR SPREADS · {sel?.code}</div>
          {spreads.map(s => (
            <div key={s.lbl} className="flex justify-between items-center border-b border-grid-line py-1 text-[10px]">
              <span className="text-muted-foreground">{s.lbl}</span>
              <div className="flex gap-3">
                <span className={`font-bold ${s.v >= 0 ? 'text-positive' : 'text-negative'}`}>{(s.v >= 0 ? '+' : '') + s.v.toFixed(2)}</span>
                <span className="text-muted-foreground text-[9px]">roll {s.roll >= 0 ? '+' : ''}{s.roll.toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="text-[9px] text-muted-foreground pt-1">Carry: rate {sel?.rate}% − div {sel?.div}% = {(sel ? (sel.rate - sel.div) : 0).toFixed(2)}%</div>
        </div>
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] text-muted-foreground mb-2">IMPLIED CASH OPEN · Globex / Overnight read</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {rows.slice(0, 10).map(r => {
            const impliedOpen = r.spot * (1 + (r.fv / r.fair));
            const dir = impliedOpen >= r.spot;
            return (
              <div key={r.code} className="border border-border p-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-accent text-[10px] font-bold">{r.code}</span>
                  <span className="text-muted-foreground text-[8px]">{r.underlying}</span>
                </div>
                <div className="text-foreground text-[11px] font-bold">{redact(impliedOpen.toFixed(2))}</div>
                <div className={`text-[9px] font-bold ${dir ? 'text-positive' : 'text-negative'}`}>{dir ? '+' : ''}{(impliedOpen - r.spot).toFixed(2)} · {((impliedOpen / r.spot - 1) * 100).toFixed(2)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
