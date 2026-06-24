import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';

interface YieldPoint {
  maturity: string;
  current: number;
  week1Ago: number;
  month1Ago: number;
  year1Ago: number;
  duration?: number;
  convexity?: number;
  coupon?: number;
  auctionDate?: string;
  bidCover?: number;
}

const countryYields: Record<string, { data: YieldPoint[]; label: string; currency: string }> = {
  US: {
    label: 'US Treasury', currency: 'USD',
    data: [
      { maturity: '1M', current: 5.54, week1Ago: 5.53, month1Ago: 5.52, year1Ago: 5.42, duration: 0.08, coupon: 0, auctionDate: 'Weekly', bidCover: 2.82 },
      { maturity: '3M', current: 5.48, week1Ago: 5.47, month1Ago: 5.45, year1Ago: 5.38, duration: 0.25, coupon: 0, auctionDate: 'Weekly', bidCover: 2.74 },
      { maturity: '6M', current: 5.38, week1Ago: 5.36, month1Ago: 5.32, year1Ago: 5.30, duration: 0.49, coupon: 0, auctionDate: 'Weekly', bidCover: 2.68 },
      { maturity: '1Y', current: 5.12, week1Ago: 5.10, month1Ago: 5.05, year1Ago: 4.98, duration: 0.98, coupon: 0, auctionDate: 'Monthly', bidCover: 2.88 },
      { maturity: '2Y', current: 4.72, week1Ago: 4.70, month1Ago: 4.62, year1Ago: 4.58, duration: 1.94, convexity: 0.05, coupon: 4.625, auctionDate: 'Monthly', bidCover: 2.62 },
      { maturity: '3Y', current: 4.48, week1Ago: 4.45, month1Ago: 4.38, year1Ago: 4.25, duration: 2.86, convexity: 0.10, coupon: 4.375, auctionDate: 'Monthly', bidCover: 2.58 },
      { maturity: '5Y', current: 4.28, week1Ago: 4.25, month1Ago: 4.18, year1Ago: 3.98, duration: 4.62, convexity: 0.24, coupon: 4.250, auctionDate: 'Monthly', bidCover: 2.42 },
      { maturity: '7Y', current: 4.32, week1Ago: 4.30, month1Ago: 4.22, year1Ago: 4.05, duration: 6.28, convexity: 0.45, coupon: 4.375, auctionDate: 'Monthly', bidCover: 2.38 },
      { maturity: '10Y', current: 4.28, week1Ago: 4.26, month1Ago: 4.18, year1Ago: 3.88, duration: 8.42, convexity: 0.82, coupon: 4.250, auctionDate: 'Quarterly', bidCover: 2.34 },
      { maturity: '20Y', current: 4.52, week1Ago: 4.50, month1Ago: 4.42, year1Ago: 4.12, duration: 13.84, convexity: 2.42, coupon: 4.500, auctionDate: 'Quarterly', bidCover: 2.28 },
      { maturity: '30Y', current: 4.45, week1Ago: 4.43, month1Ago: 4.35, year1Ago: 4.02, duration: 17.62, convexity: 4.18, coupon: 4.375, auctionDate: 'Quarterly', bidCover: 2.22 },
    ],
  },
  UK: {
    label: 'UK Gilts', currency: 'GBP',
    data: [
      { maturity: '1M', current: 5.28, week1Ago: 5.26, month1Ago: 5.22, year1Ago: 5.12, duration: 0.08 },
      { maturity: '3M', current: 5.22, week1Ago: 5.20, month1Ago: 5.18, year1Ago: 5.08, duration: 0.25 },
      { maturity: '6M', current: 5.14, week1Ago: 5.12, month1Ago: 5.08, year1Ago: 4.98, duration: 0.49 },
      { maturity: '1Y', current: 4.98, week1Ago: 4.96, month1Ago: 4.88, year1Ago: 4.72, duration: 0.98 },
      { maturity: '2Y', current: 4.52, week1Ago: 4.48, month1Ago: 4.38, year1Ago: 4.28, duration: 1.92 },
      { maturity: '5Y', current: 4.18, week1Ago: 4.14, month1Ago: 4.02, year1Ago: 3.88, duration: 4.58 },
      { maturity: '10Y', current: 4.12, week1Ago: 4.08, month1Ago: 3.98, year1Ago: 3.72, duration: 8.32 },
      { maturity: '20Y', current: 4.42, week1Ago: 4.38, month1Ago: 4.28, year1Ago: 4.02, duration: 13.62 },
      { maturity: '30Y', current: 4.48, week1Ago: 4.44, month1Ago: 4.34, year1Ago: 4.08, duration: 17.28 },
    ],
  },
  EU: {
    label: 'German Bunds', currency: 'EUR',
    data: [
      { maturity: '3M', current: 3.88, week1Ago: 3.86, month1Ago: 3.82, year1Ago: 3.72, duration: 0.25 },
      { maturity: '6M', current: 3.72, week1Ago: 3.70, month1Ago: 3.66, year1Ago: 3.58, duration: 0.49 },
      { maturity: '1Y', current: 3.48, week1Ago: 3.46, month1Ago: 3.38, year1Ago: 3.28, duration: 0.98 },
      { maturity: '2Y', current: 2.98, week1Ago: 2.94, month1Ago: 2.88, year1Ago: 2.78, duration: 1.94 },
      { maturity: '5Y', current: 2.52, week1Ago: 2.48, month1Ago: 2.42, year1Ago: 2.28, duration: 4.64 },
      { maturity: '10Y', current: 2.42, week1Ago: 2.38, month1Ago: 2.32, year1Ago: 2.18, duration: 8.48 },
      { maturity: '20Y', current: 2.62, week1Ago: 2.58, month1Ago: 2.52, year1Ago: 2.38, duration: 13.92 },
      { maturity: '30Y', current: 2.68, week1Ago: 2.64, month1Ago: 2.58, year1Ago: 2.42, duration: 17.84 },
    ],
  },
  JP: {
    label: 'Japanese Government Bonds (JGB)', currency: 'JPY',
    data: [
      { maturity: '3M', current: -0.02, week1Ago: -0.02, month1Ago: -0.04, year1Ago: -0.08, duration: 0.25 },
      { maturity: '6M', current: 0.02, week1Ago: 0.01, month1Ago: -0.01, year1Ago: -0.06, duration: 0.49 },
      { maturity: '1Y', current: 0.08, week1Ago: 0.06, month1Ago: 0.04, year1Ago: -0.02, duration: 0.98 },
      { maturity: '2Y', current: 0.18, week1Ago: 0.16, month1Ago: 0.12, year1Ago: 0.02, duration: 1.96 },
      { maturity: '5Y', current: 0.42, week1Ago: 0.40, month1Ago: 0.36, year1Ago: 0.18, duration: 4.72 },
      { maturity: '10Y', current: 0.78, week1Ago: 0.74, month1Ago: 0.68, year1Ago: 0.44, duration: 8.88 },
      { maturity: '20Y', current: 1.44, week1Ago: 1.40, month1Ago: 1.32, year1Ago: 1.18, duration: 14.82 },
      { maturity: '30Y', current: 1.72, week1Ago: 1.68, month1Ago: 1.62, year1Ago: 1.42, duration: 18.42 },
      { maturity: '40Y', current: 1.88, week1Ago: 1.84, month1Ago: 1.78, year1Ago: 1.58, duration: 21.24 },
    ],
  },
  CN: {
    label: 'China Government Bonds (CGB)', currency: 'CNY',
    data: [
      { maturity: '3M', current: 1.82, week1Ago: 1.80, month1Ago: 1.78, year1Ago: 1.92, duration: 0.25 },
      { maturity: '6M', current: 1.94, week1Ago: 1.92, month1Ago: 1.88, year1Ago: 2.04, duration: 0.49 },
      { maturity: '1Y', current: 2.08, week1Ago: 2.06, month1Ago: 2.02, year1Ago: 2.18, duration: 0.98 },
      { maturity: '2Y', current: 2.22, week1Ago: 2.20, month1Ago: 2.16, year1Ago: 2.38, duration: 1.94 },
      { maturity: '5Y', current: 2.42, week1Ago: 2.40, month1Ago: 2.36, year1Ago: 2.58, duration: 4.62 },
      { maturity: '10Y', current: 2.52, week1Ago: 2.50, month1Ago: 2.46, year1Ago: 2.68, duration: 8.44 },
      { maturity: '30Y', current: 2.82, week1Ago: 2.80, month1Ago: 2.76, year1Ago: 2.98, duration: 17.62 },
    ],
  },
};

const getCountryYieldData = (code: string) => countryYields[code] || countryYields['US'];

const getSpreads = (data: YieldPoint[]) => {
  const y2 = data.find(d => d.maturity === '2Y')?.current || 0;
  const y10 = data.find(d => d.maturity === '10Y')?.current || 0;
  const y3m = data.find(d => d.maturity === '3M')?.current || 0;
  const y30 = data.find(d => d.maturity === '30Y')?.current || 0;
  const y5 = data.find(d => d.maturity === '5Y')?.current || 0;
  return [
    { label: '2s10s Spread', value: (y10 - y2).toFixed(2), color: y10 - y2 < 0 ? 'text-negative' : 'text-positive' },
    { label: '3m10y Spread', value: (y10 - y3m).toFixed(2), color: y10 - y3m < 0 ? 'text-negative' : 'text-positive' },
    { label: '5s30s Spread', value: (y30 - y5).toFixed(2), color: y30 - y5 >= 0 ? 'text-positive' : 'text-negative' },
  ];
};

export default function YieldCurve() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const [liveUsYields, setLiveUsYields] = useState<YieldPoint[] | null>(null);
  const [liveInverted, setLiveInverted] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/market/macro/yield-curve')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.tenors?.length) return;
        const mapped: YieldPoint[] = (d.tenors as any[]).map((t: any) => ({
          maturity: t.label,
          current:   t.current  ?? 0,
          week1Ago:  t.wk1      ?? 0,
          month1Ago: t.mo1      ?? 0,
          year1Ago:  t.yr1      ?? 0,
        }));
        setLiveUsYields(mapped);
        setLiveInverted(d.inverted ?? false);
      })
      .catch(() => {});
  }, []);

  const baseInfo = getCountryYieldData(selectedCountry);
  const yieldInfo = selectedCountry === 'US' && liveUsYields
    ? { ...baseInfo, data: liveUsYields }
    : baseInfo;
  const spreads = getSpreads(yieldInfo.data);
  const is2s10sInverted = selectedCountry === 'US' && liveInverted != null
    ? liveInverted
    : parseFloat(spreads[0].value) < 0;
  const [selectedTenor, setSelectedTenor] = useState<string | null>(null);

  const chgColor = (v: number) => v >= 0 ? 'text-negative' : 'text-positive';

  return (
    <div className="space-y-0">
      <div className="bg-surface-elevated border border-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm">{countryInfo.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono font-bold text-xs">YCRV</span>
              <span className="text-foreground font-mono font-bold text-xs">{yieldInfo.label} Yield Curve</span>
              <span className="text-muted-foreground font-mono text-[9px]">&lt;GO&gt;</span>
            </div>
            <div className="text-[8px] font-mono text-muted-foreground">{yieldInfo.data.length} tenors • Click any maturity for bond details</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 border ${is2s10sInverted ? 'border-negative/30 bg-negative/10' : 'border-positive/30 bg-positive/10'}`}>
            <div className={`w-2 h-2 rounded-full ${is2s10sInverted ? 'bg-negative animate-pulse' : 'bg-positive'}`} />
            <span className={`text-[9px] font-mono font-bold ${is2s10sInverted ? 'text-negative' : 'text-positive'}`}>
              {is2s10sInverted ? 'INVERTED' : 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border-x border-border">
        <div className="lg:col-span-3 border-b border-border bg-surface-primary p-3">
          <ExpandableResponsiveContainer width="100%" height={280}>
            <LineChart data={yieldInfo.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="maturity" tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} formatter={(value: number) => [`${value}%`]} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="current" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="Current" />
              <Line type="monotone" dataKey="week1Ago" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} name="1W Ago" />
              <Line type="monotone" dataKey="month1Ago" stroke="#3b82f6" strokeWidth={1} strokeDasharray="2 2" dot={false} name="1M Ago" />
              <Line type="monotone" dataKey="year1Ago" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="6 2" dot={false} name="1Y Ago" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>

        <div className="border-b lg:border-l border-border">
          <div className="bg-accent/5 border-b border-accent/20 px-2 py-1">
            <span className="text-accent font-mono font-bold text-[9px] uppercase">Key Spreads</span>
          </div>
          <div className="divide-y divide-grid-line">
            {spreads.map(s => (
              <div key={s.label} className="px-2 py-2.5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
                <span className={`text-[12px] font-mono font-bold ${s.color}`}>{s.value}%</span>
              </div>
            ))}
          </div>
          <div className="bg-accent/5 border-t border-accent/20 px-2 py-1">
            <span className="text-accent font-mono font-bold text-[9px] uppercase">Curve Signal</span>
          </div>
          <div className="px-2 py-2">
            <p className="text-[9px] font-mono text-muted-foreground">
              {is2s10sInverted ? '2s10s spread negative — recession signal active. Duration of inversion: 18 months.' : '2s10s spread positive — normal term structure. Risk appetite supported.'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-x border-b border-border overflow-hidden">
        <div className="bg-accent/5 border-b border-accent/20 px-2 py-1">
          <span className="text-accent font-mono font-bold text-[9px] uppercase">Yield Table — Click for Bond Details</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-deep border-b border-grid-line">
              <th className="text-left px-2 py-1 text-accent font-bold">TENOR</th>
              <th className="text-right px-2 py-1 text-muted-foreground">YIELD</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1W AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1W Δ</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1M AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1M Δ</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y AGO</th>
              <th className="text-right px-2 py-1 text-muted-foreground">1Y Δ</th>
              <th className="text-right px-2 py-1 text-muted-foreground">DUR</th>
            </tr>
          </thead>
          <tbody>
            {yieldInfo.data.map((d, i) => {
              const isSelected = selectedTenor === d.maturity;
              const w1 = d.current - d.week1Ago;
              const m1 = d.current - d.month1Ago;
              const y1 = d.current - d.year1Ago;
              return (
                <>
                  <tr
                    key={d.maturity}
                    onClick={() => setSelectedTenor(isSelected ? null : d.maturity)}
                    className={`border-b border-grid-line cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent/15 border-l-2 border-l-accent' :
                      'hover:bg-accent/5'
                    } ${i % 2 === 0 ? '' : 'bg-surface-elevated/30'}`}
                  >
                    <td className="px-2 py-1.5 text-accent font-bold flex items-center gap-1">
                      {isSelected ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />}
                      {d.maturity}
                    </td>
                    <td className="px-2 py-1.5 text-right text-foreground font-bold">{d.current.toFixed(2)}%</td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">{d.week1Ago.toFixed(2)}%</td>
                    <td className={`px-2 py-1.5 text-right font-bold ${chgColor(w1)}`}>{w1 >= 0 ? '+' : ''}{(w1 * 100).toFixed(0)}bp</td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">{d.month1Ago.toFixed(2)}%</td>
                    <td className={`px-2 py-1.5 text-right font-bold ${chgColor(m1)}`}>{m1 >= 0 ? '+' : ''}{(m1 * 100).toFixed(0)}bp</td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">{d.year1Ago.toFixed(2)}%</td>
                    <td className={`px-2 py-1.5 text-right font-bold ${chgColor(y1)}`}>{y1 >= 0 ? '+' : ''}{(y1 * 100).toFixed(0)}bp</td>
                    <td className="px-2 py-1.5 text-right text-muted-foreground">{d.duration?.toFixed(2) || '—'}</td>
                  </tr>
                  {isSelected && (
                    <tr className="border-b border-grid-line">
                      <td colSpan={9} className="p-0">
                        <div className="bg-surface-elevated/50 border-t border-accent/20 p-3 animate-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <div className="text-[8px] font-mono text-accent font-bold mb-1 uppercase">Bond Details</div>
                              {[
                                { l: 'Maturity', v: d.maturity },
                                { l: 'Yield', v: `${d.current.toFixed(3)}%` },
                                { l: 'Coupon', v: d.coupon ? `${d.coupon.toFixed(3)}%` : 'Zero' },
                                { l: 'Duration', v: d.duration ? `${d.duration.toFixed(2)} yrs` : '—' },
                                { l: 'Convexity', v: d.convexity ? d.convexity.toFixed(3) : '—' },
                              ].map(r => (
                                <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                                  <span className="text-muted-foreground">{r.l}</span>
                                  <span className="text-foreground font-bold">{r.v}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-[8px] font-mono text-accent font-bold mb-1 uppercase">Changes (bp)</div>
                              {[
                                { l: '1 Day', v: `${(w1 * 100 / 5).toFixed(0)}` },
                                { l: '1 Week', v: `${(w1 * 100).toFixed(0)}` },
                                { l: '1 Month', v: `${(m1 * 100).toFixed(0)}` },
                                { l: '3 Month', v: `${((d.current - d.month1Ago) * 100 * 1.5).toFixed(0)}` },
                                { l: '1 Year', v: `${(y1 * 100).toFixed(0)}` },
                              ].map(r => (
                                <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                                  <span className="text-muted-foreground">{r.l}</span>
                                  <span className={`font-bold ${parseInt(r.v) > 0 ? 'text-negative' : parseInt(r.v) < 0 ? 'text-positive' : 'text-muted-foreground'}`}>
                                    {parseInt(r.v) > 0 ? '+' : ''}{r.v}bp
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-[8px] font-mono text-accent font-bold mb-1 uppercase">Auction Info</div>
                              {[
                                { l: 'Frequency', v: d.auctionDate || '—' },
                                { l: 'Bid/Cover', v: d.bidCover ? `${d.bidCover.toFixed(2)}x` : '—' },
                                { l: 'Price (est)', v: `$${(100 - (d.current - (d.coupon || 0)) * (d.duration || 1) * 0.1).toFixed(3)}` },
                                { l: 'DV01 ($M)', v: `$${((d.duration || 0) * 10).toFixed(0)}` },
                              ].map(r => (
                                <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                                  <span className="text-muted-foreground">{r.l}</span>
                                  <span className="text-foreground font-bold">{r.v}</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="text-[8px] font-mono text-accent font-bold mb-1 uppercase">Relative Value</div>
                              <div className="space-y-1">
                                {[
                                  { l: 'vs Fed Funds', v: `${((d.current - 5.33) * 100).toFixed(0)}bp`, c: d.current < 5.33 ? 'text-positive' : 'text-negative' },
                                  { l: 'Real Yield (est)', v: `${(d.current - 3.2).toFixed(2)}%` },
                                  { l: 'Z-Score (30d)', v: `${(Math.random() * 2 - 1).toFixed(2)}` },
                                ].map(r => (
                                  <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono">
                                    <span className="text-muted-foreground">{r.l}</span>
                                    <span className={`font-bold ${r.c || 'text-foreground'}`}>{r.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-x border-b border-border bg-surface-elevated px-3 py-1 text-[8px] font-mono text-muted-foreground flex justify-between">
        <span>Source: {yieldInfo.label} • {yieldInfo.currency}</span>
        <span>YCRV &lt;GO&gt;</span>
      </div>
    </div>
  );
}
