// Global cross-asset price strip — pinned below the nav breadcrumb.
// Reuses already-cached hooks (useIndices, useFXRates, useCrypto) — no extra requests.
// Price flash: cells briefly highlight green/red when live data changes.
import { useMemo, useRef, useState, useEffect } from 'react';
import { useIndices } from '@/hooks/useIndices';
import { useFXRates, FXRate } from '@/hooks/useFXRates';
import { useCrypto, Coin } from '@/hooks/useCrypto';

type Item = {
  key: string;
  label: string;
  value: number | null;
  chgPct: number | null;
  decimals: number;
};

function fmtValue(v: number, decimals: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function ChgBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-muted-foreground text-[8px]">—</span>;
  const pos = pct >= 0;
  return (
    <span className={`text-[8px] tabular-nums ${pos ? 'text-positive' : 'text-negative'}`}>
      {pos ? '▲' : '▼'}{Math.abs(pct).toFixed(2)}%
    </span>
  );
}

function Cell({ item, flash }: { item: Item; flash?: 'up' | 'down' | null }) {
  const flashCls = flash === 'up'
    ? 'animate-[flash-up_0.6s_ease-in-out]'
    : flash === 'down'
    ? 'animate-[flash-down_0.6s_ease-in-out]'
    : '';
  return (
    <div className={`flex items-center gap-1.5 px-2.5 border-r border-border/50 whitespace-nowrap flex-shrink-0 h-full ${flashCls}`}>
      <span className="text-[8px] font-mono uppercase tracking-wide text-muted-foreground">{item.label}</span>
      <span className="text-[10px] font-mono tabular-nums font-semibold text-foreground">
        {item.value != null ? fmtValue(item.value, item.decimals) : '—'}
      </span>
      <ChgBadge pct={item.chgPct} />
    </div>
  );
}

function Divider() {
  return <div className="w-px h-3 bg-border/80 flex-shrink-0 self-center mx-0.5" />;
}

export default function TickerBar() {
  const { byAbbr } = useIndices();
  const { rates } = useFXRates();
  const { coins } = useCrypto();
  const [flashing, setFlashing] = useState<Record<string, 'up' | 'down'>>({});
  const prevPrices = useRef<Record<string, number>>({});

  const byRate = useMemo(() => {
    const m: Record<string, FXRate> = {};
    for (const r of rates) m[r.ccy] = r;
    return m;
  }, [rates]);

  const byCoin = useMemo(() => {
    const m: Record<string, Coin> = {};
    for (const c of coins) m[c.symbol.toUpperCase()] = c;
    return m;
  }, [coins]);

  const idx = (abbr: string, decimals: number): Item => ({
    key: abbr, label: abbr,
    value: byAbbr[abbr]?.close ?? null,
    chgPct: byAbbr[abbr]?.change_pct ?? null,
    decimals,
  });

  const fx = (label: string, ccy: string, invert: boolean, decimals: number): Item => {
    const r = byRate[ccy];
    return {
      key: label, label,
      value: r != null ? (invert ? 1 / r.usd : r.usd) : null,
      chgPct: r != null ? (invert ? -(r.change_pct ?? 0) : r.change_pct) : null,
      decimals,
    };
  };

  const coin = (sym: string, decimals: number): Item => {
    const c = byCoin[sym];
    return { key: sym, label: sym, value: c?.price ?? null, chgPct: c?.change24hPct ?? null, decimals };
  };

  const equities: Item[] = [
    idx('SPX', 2), idx('NDX', 2), idx('DJI', 0), idx('RUT', 2), idx('VIX', 2),
  ];
  const fxPairs: Item[] = [
    fx('EUR/USD', 'EUR', false, 4), fx('GBP/USD', 'GBP', false, 4),
    fx('USD/JPY', 'JPY', true, 2),  fx('USD/CHF', 'CHF', true, 4),
    fx('AUD/USD', 'AUD', false, 4),
  ];
  const cryptoItems: Item[] = [coin('BTC', 0), coin('ETH', 0)];

  // Detect price changes and trigger flash animation
  useEffect(() => {
    const snapshot: { key: string; value: number | null }[] = [
      { key: 'SPX',     value: byAbbr['SPX']?.close ?? null },
      { key: 'NDX',     value: byAbbr['NDX']?.close ?? null },
      { key: 'DJI',     value: byAbbr['DJI']?.close ?? null },
      { key: 'RUT',     value: byAbbr['RUT']?.close ?? null },
      { key: 'VIX',     value: byAbbr['VIX']?.close ?? null },
      { key: 'EUR/USD', value: byRate['EUR'] ? byRate['EUR'].usd : null },
      { key: 'GBP/USD', value: byRate['GBP'] ? byRate['GBP'].usd : null },
      { key: 'USD/JPY', value: byRate['JPY'] ? 1 / byRate['JPY'].usd : null },
      { key: 'USD/CHF', value: byRate['CHF'] ? 1 / byRate['CHF'].usd : null },
      { key: 'AUD/USD', value: byRate['AUD'] ? byRate['AUD'].usd : null },
      { key: 'BTC',     value: byCoin['BTC']?.price ?? null },
      { key: 'ETH',     value: byCoin['ETH']?.price ?? null },
    ];

    const newFlashes: Record<string, 'up' | 'down'> = {};
    for (const { key, value } of snapshot) {
      if (value == null) continue;
      const prev = prevPrices.current[key];
      if (prev !== undefined && Math.abs(value - prev) > 0.000001) {
        newFlashes[key] = value > prev ? 'up' : 'down';
      }
      prevPrices.current[key] = value;
    }

    if (Object.keys(newFlashes).length === 0) return;
    setFlashing(f => ({ ...f, ...newFlashes }));
    const timer = setTimeout(() => {
      setFlashing(f => {
        const next = { ...f };
        for (const key of Object.keys(newFlashes)) delete next[key];
        return next;
      });
    }, 700);
    return () => clearTimeout(timer);
  }, [byAbbr, byRate, byCoin]);

  const hasAnyData = [...equities, ...fxPairs, ...cryptoItems].some(i => i.value != null);
  if (!hasAnyData) return null;

  return (
    <div
      className="flex items-stretch bg-surface-deep border-b border-border h-[20px] overflow-x-auto flex-shrink-0"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center px-2 border-r border-border bg-surface-elevated flex-shrink-0">
        <span className="text-[7px] font-mono font-bold text-accent uppercase tracking-widest">MKT</span>
      </div>
      {equities.map(item => <Cell key={item.key} item={item} flash={flashing[item.key]} />)}
      <Divider />
      {fxPairs.map(item => <Cell key={item.key} item={item} flash={flashing[item.key]} />)}
      <Divider />
      {cryptoItems.map(item => <Cell key={item.key} item={item} flash={flashing[item.key]} />)}
    </div>
  );
}
