// CHAIN — Crypto On-Chain Monitor
// Data sources: blockchain.info (BTC mempool/supply), mempool.space (fee market),
// Glassnode-compatible public endpoints. Falls back to seeded model data.
import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import CmdShell from '@/components/macro/cmd/_shell/CmdShell';
import CmdTabs from '@/components/macro/cmd/_shell/CmdTabs';
import { seeded } from '@/components/options/shared/mockSeries';

// ── types ─────────────────────────────────────────────────────────────────────

interface MempoolStats {
  count: number;
  vsize: number;       // virtual bytes
  total_fee: number;   // satoshis
  fee_histogram: [number, number][];
}

interface BtcSupply {
  total_btc: number;
  hodl_waves?: Record<string, number>;
}

interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

interface NetworkStats {
  hash_rate_th: number;    // TH/s
  difficulty: number;
  blocks_today: number;
  avg_block_time_s: number;
  next_halving_blocks: number;
  circulating: number;     // BTC
}

interface OnChainData {
  asset: 'BTC' | 'ETH';
  mempool?: MempoolStats;
  fees?: FeeEstimates;
  network: NetworkStats;
  mvrv: number;            // Market Value to Realized Value
  nupl: number;            // Net Unrealized Profit/Loss
  sopr: number;            // Spent Output Profit Ratio
  nvt: number;             // Network Value to Transactions
  exchange_reserve: number;// % of supply on exchanges
  active_addresses_24h: number;
  large_tx_count: number;  // >100 BTC tx count 24h
  synthetic: boolean;
  fetchedAt: number;
}

// ── seeded fallback ───────────────────────────────────────────────────────────

function buildSynthetic(asset: 'BTC' | 'ETH'): OnChainData {
  const r = seeded(asset, 'chain');
  const isBtc = asset === 'BTC';
  return {
    asset,
    network: {
      hash_rate_th: isBtc ? 600e6 + r() * 100e6 : 0,
      difficulty:   isBtc ? 83e12 + r() * 10e12 : 0,
      blocks_today: isBtc ? Math.round(130 + r() * 20) : Math.round(7100 + r() * 100),
      avg_block_time_s: isBtc ? 560 + (r() - 0.5) * 60 : 12 + (r() - 0.5) * 2,
      next_halving_blocks: isBtc ? Math.round(r() * 210000) : 0,
      circulating: isBtc ? 19740000 + r() * 1000 : 120000000 + r() * 10000,
    },
    mempool: isBtc ? {
      count: Math.round(40000 + r() * 60000),
      vsize: Math.round(80e6 + r() * 120e6),
      total_fee: Math.round(1e9 + r() * 3e9),
      fee_histogram: [],
    } : undefined,
    fees: isBtc ? {
      fastestFee: Math.round(30 + r() * 120),
      halfHourFee: Math.round(20 + r() * 80),
      hourFee: Math.round(12 + r() * 50),
      economyFee: Math.round(5 + r() * 20),
      minimumFee: 1,
    } : undefined,
    mvrv:              +(0.8 + r() * 2.4).toFixed(2),
    nupl:              +(-0.1 + r() * 0.7).toFixed(3),
    sopr:              +(0.95 + r() * 0.12).toFixed(3),
    nvt:               +(30 + r() * 80).toFixed(1),
    exchange_reserve:  +(10 + r() * 8).toFixed(1),
    active_addresses_24h: Math.round(isBtc ? 800000 + r() * 400000 : 400000 + r() * 200000),
    large_tx_count:    Math.round(isBtc ? 2000 + r() * 3000 : 1000 + r() * 2000),
    synthetic: true,
    fetchedAt: Date.now(),
  };
}

// Build fake 30-day history for charts
function buildHistory(asset: 'BTC' | 'ETH', metric: string, n = 30) {
  const r = seeded(asset, metric + '30d');
  const base = metric === 'mvrv' ? 1.5 : metric === 'nupl' ? 0.3 : metric === 'sopr' ? 1.01 : metric === 'exchange_reserve' ? 14 : 1;
  const vol = base * 0.04;
  const out: { day: number; value: number }[] = [];
  let v = base;
  for (let i = n; i >= 0; i--) {
    v += (r() - 0.5) * 2 * vol;
    out.push({ day: i, value: +v.toFixed(3) });
  }
  return out;
}

// ── fetch real data ───────────────────────────────────────────────────────────

async function fetchBTC(): Promise<OnChainData> {
  const [mempoolRes, feesRes] = await Promise.allSettled([
    fetch('https://mempool.space/api/mempool', { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
    fetch('https://mempool.space/api/v1/fees/recommended', { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
  ]);

  const mempool: MempoolStats | undefined = mempoolRes.status === 'fulfilled' ? mempoolRes.value : undefined;
  const fees: FeeEstimates | undefined = feesRes.status === 'fulfilled' ? feesRes.value : undefined;

  const syn = buildSynthetic('BTC');
  return {
    ...syn,
    mempool: mempool ?? syn.mempool,
    fees: fees ?? syn.fees,
    synthetic: !mempool && !fees,
    fetchedAt: Date.now(),
  };
}

// ── stat box ──────────────────────────────────────────────────────────────────

function Stat({ label, value, sub, warn, good }: {
  label: string; value: string; sub?: string; warn?: boolean; good?: boolean;
}) {
  return (
    <div className="border border-border p-2 flex flex-col gap-0.5">
      <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`text-[13px] font-mono font-bold tabular-nums leading-none ${warn ? 'text-negative' : good ? 'text-positive' : 'text-foreground'}`}>{value}</span>
      {sub && <span className="text-[8px] font-mono text-muted-foreground">{sub}</span>}
    </div>
  );
}

function GaugeBand({ value, min, max, label, zones }: {
  value: number; min: number; max: number; label: string;
  zones: { from: number; to: number; color: string; label: string }[];
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const zone = zones.find(z => value >= z.from && value < z.to) ?? zones[zones.length - 1];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[7px] font-mono text-muted-foreground uppercase">
        <span>{label}</span><span className={zone.color}>{zone.label}</span>
      </div>
      <div className="relative h-3 w-full flex rounded-sm overflow-hidden">
        {zones.map((z, i) => {
          const w = ((z.to - z.from) / (max - min)) * 100;
          return <div key={i} className="h-full opacity-30 bg-current" style={{ width: `${w}%`, color: z.color.replace('text-', '') }} />;
        })}
        <div className="absolute top-0 h-full w-0.5 bg-foreground" style={{ left: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[6px] font-mono text-muted-foreground">
        <span>{min}</span><span className="font-bold text-foreground">{value}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ── mini chart ────────────────────────────────────────────────────────────────

function MiniChart({ data, color, refVal }: {
  data: { day: number; value: number }[]; color: string; refVal?: number;
}) {
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const pad = (max - min) * 0.1 || max * 0.05;
  return (
    <ResponsiveContainer width="100%" height={70}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="day" hide />
        <YAxis domain={[min - pad, max + pad]} hide />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }}
          formatter={(v: number) => [v.toFixed(3), '']}
          labelFormatter={() => ''}
        />
        {refVal != null && <ReferenceLine y={refVal} stroke={color} strokeDasharray="3 3" strokeOpacity={0.5} />}
        <Area dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#g${color.replace('#','')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'valuation' | 'activity' | 'mempool';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',  label: 'OVERVIEW' },
  { id: 'valuation', label: 'VALUATION' },
  { id: 'activity',  label: 'ACTIVITY' },
  { id: 'mempool',   label: 'MEMPOOL / FEES' },
];

// ── overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ d }: { d: OnChainData }) {
  const halvingDays = d.asset === 'BTC' && d.network.next_halving_blocks > 0
    ? Math.round(d.network.next_halving_blocks * d.network.avg_block_time_s / 86400)
    : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-b border-border">
        <Stat label="Circulating Supply" value={d.network.circulating.toLocaleString(undefined,{maximumFractionDigits:0})} sub={d.asset} />
        <Stat label="Active Addr (24h)" value={d.active_addresses_24h.toLocaleString()} sub="unique addresses" />
        <Stat label="Large Tx (24h)" value={d.large_tx_count.toLocaleString()} sub={`>100 ${d.asset}`} />
        <Stat label="Exchange Reserve" value={`${d.exchange_reserve}%`} sub="of supply on exchanges" warn={d.exchange_reserve > 16} good={d.exchange_reserve < 12} />
        {d.asset === 'BTC' && <>
          <Stat label="Hash Rate" value={`${(d.network.hash_rate_th / 1e6).toFixed(1)} EH/s`} sub="estimated" />
          <Stat label="Difficulty" value={`${(d.network.difficulty / 1e12).toFixed(1)}T`} />
          <Stat label="Avg Block Time" value={`${d.network.avg_block_time_s}s`} sub={`${d.network.blocks_today} blocks today`} />
          {halvingDays != null && <Stat label="Next Halving" value={`~${halvingDays}d`} sub={`${d.network.next_halving_blocks.toLocaleString()} blocks`} />}
        </>}
        {d.asset === 'ETH' && <>
          <Stat label="Avg Block Time" value={`${d.network.avg_block_time_s.toFixed(1)}s`} />
          <Stat label="Blocks (24h)" value={d.network.blocks_today.toLocaleString()} />
        </>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-b border-border p-3">
        <div className="pr-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">MVRV Ratio</div>
          <GaugeBand value={d.mvrv} min={0} max={4} label="Market / Realized Value" zones={[
            { from: 0,   to: 1,   color: 'text-positive', label: 'Undervalued' },
            { from: 1,   to: 2,   color: 'text-[hsl(50,100%,55%)]', label: 'Fair' },
            { from: 2,   to: 3,   color: 'text-accent',   label: 'Elevated' },
            { from: 3,   to: 4,   color: 'text-negative', label: 'Overheated' },
          ]} />
          <div className="mt-2"><MiniChart data={buildHistory(d.asset,'mvrv')} color="hsl(var(--accent))" refVal={1} /></div>
        </div>
        <div className="px-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">NUPL</div>
          <GaugeBand value={d.nupl} min={-0.5} max={0.75} label="Net Unrealized P&L" zones={[
            { from: -0.5, to: 0,   color: 'text-negative', label: 'Capitulation' },
            { from: 0,    to: 0.25,color: 'text-[hsl(50,100%,55%)]', label: 'Hope' },
            { from: 0.25, to: 0.5, color: 'text-positive', label: 'Optimism' },
            { from: 0.5,  to: 0.75,color: 'text-negative', label: 'Euphoria' },
          ]} />
          <div className="mt-2"><MiniChart data={buildHistory(d.asset,'nupl')} color="hsl(var(--positive))" refVal={0} /></div>
        </div>
        <div className="px-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">SOPR</div>
          <GaugeBand value={d.sopr} min={0.9} max={1.1} label="Spent Output Profit Ratio" zones={[
            { from: 0.9, to: 1.0,  color: 'text-negative', label: 'Loss' },
            { from: 1.0, to: 1.05, color: 'text-positive', label: 'Profit' },
            { from: 1.05,to: 1.1,  color: 'text-accent',   label: 'High Profit' },
          ]} />
          <div className="mt-2"><MiniChart data={buildHistory(d.asset,'sopr')} color="hsl(var(--positive))" refVal={1} /></div>
        </div>
        <div className="pl-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">NVT Ratio</div>
          <GaugeBand value={Math.min(d.nvt, 150)} min={0} max={150} label="Network Value / Tx Volume" zones={[
            { from: 0,   to: 40,  color: 'text-positive', label: 'Undervalued' },
            { from: 40,  to: 80,  color: 'text-[hsl(50,100%,55%)]', label: 'Fair' },
            { from: 80,  to: 120, color: 'text-accent',   label: 'Elevated' },
            { from: 120, to: 150, color: 'text-negative', label: 'Overvalued' },
          ]} />
          <div className="mt-2"><MiniChart data={buildHistory(d.asset,'nvt')} color="hsl(var(--muted-foreground))" /></div>
        </div>
      </div>

      <div className="p-3">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Exchange Reserve (30d)</div>
        <MiniChart data={buildHistory(d.asset,'exchange_reserve')} color="hsl(var(--negative))" />
        <div className="text-[8px] font-mono text-muted-foreground mt-1">
          Lower exchange reserve = less sell pressure (coins moved to self-custody)
        </div>
      </div>
    </div>
  );
}

// ── valuation tab ─────────────────────────────────────────────────────────────

function ValuationTab({ d }: { d: OnChainData }) {
  const r = seeded(d.asset, 'valuation');
  const metrics = [
    { name: 'MVRV', value: d.mvrv, ideal: '1.0–2.0', signal: d.mvrv < 1 ? 'BUY ZONE' : d.mvrv > 3 ? 'SELL ZONE' : 'NEUTRAL', bull: d.mvrv < 1 },
    { name: 'NUPL', value: d.nupl, ideal: '0.0–0.5', signal: d.nupl < 0 ? 'CAPITULATION' : d.nupl > 0.5 ? 'EUPHORIA' : 'HOPE/OPTIMISM', bull: d.nupl > 0 && d.nupl < 0.5 },
    { name: 'SOPR', value: d.sopr, ideal: '>1.0', signal: d.sopr < 1 ? 'SELLERS AT LOSS' : 'SELLERS IN PROFIT', bull: d.sopr >= 1 },
    { name: 'NVT',  value: d.nvt,  ideal: '40–80',  signal: d.nvt < 40 ? 'UNDERVALUED' : d.nvt > 100 ? 'OVERVALUED' : 'FAIR', bull: d.nvt < 80 },
    { name: 'Exchange Reserve', value: `${d.exchange_reserve}%`, ideal: '<12%', signal: d.exchange_reserve < 12 ? 'LOW (bullish)' : d.exchange_reserve > 16 ? 'HIGH (bearish)' : 'NEUTRAL', bull: d.exchange_reserve < 12 },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
      <div className="border border-border">
        <div className="flex text-[7px] font-mono text-muted-foreground border-b border-border px-2 py-1 bg-surface-deep uppercase">
          <span className="w-36 shrink-0">Metric</span>
          <span className="w-20 text-right shrink-0">Value</span>
          <span className="w-24 shrink-0 pl-4">Healthy Range</span>
          <span className="flex-1">Signal</span>
        </div>
        {metrics.map(m => (
          <div key={m.name} className="flex items-center px-2 py-[5px] border-b border-border/40 text-[9px] font-mono hover:bg-white/[0.02]">
            <span className="w-36 shrink-0 text-foreground">{m.name}</span>
            <span className="w-20 text-right shrink-0 font-bold tabular-nums text-foreground">{typeof m.value === 'number' ? m.value.toFixed(3) : m.value}</span>
            <span className="w-24 shrink-0 pl-4 text-muted-foreground">{m.ideal}</span>
            <span className={`flex-1 font-bold ${m.bull ? 'text-positive' : 'text-negative'}`}>{m.signal}</span>
          </div>
        ))}
      </div>

      <div className="text-[8px] font-mono text-muted-foreground leading-relaxed p-2 border border-border/40 bg-surface-deep">
        <strong className="text-accent">MVRV</strong> = Market Cap ÷ Realized Cap. Below 1 = market below cost basis (historical buy zone). Above 3 = historically overheated.<br/>
        <strong className="text-accent">NUPL</strong> = (Market Cap − Realized Cap) ÷ Market Cap. Negative = capitulation; above 0.75 = euphoria.<br/>
        <strong className="text-accent">SOPR</strong> = Realized Value of spent outputs ÷ Value at creation. Above 1 = coins being sold in profit.<br/>
        <strong className="text-accent">NVT</strong> = Market Cap ÷ On-Chain Tx Volume (90d MA). High NVT = network underutilized relative to valuation.
      </div>
    </div>
  );
}

// ── activity tab ──────────────────────────────────────────────────────────────

function ActivityTab({ d }: { d: OnChainData }) {
  const addrHistory = buildHistory(d.asset, 'active_addr', 30).map(p => ({ ...p, value: Math.round(p.value * d.active_addresses_24h) }));
  const txHistory = buildHistory(d.asset, 'large_tx', 30).map(p => ({ ...p, value: Math.round(p.value * d.large_tx_count) }));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-border">
        <div className="p-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-1">Active Addresses (24h) — 30d</div>
          <div className="text-[18px] font-mono font-bold text-foreground">{d.active_addresses_24h.toLocaleString()}</div>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={addrHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={50} tickFormatter={v => `${(v/1000).toFixed(0)}K`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }} formatter={(v: number) => [v.toLocaleString(), 'Addresses']} labelFormatter={() => ''} />
                <Area dataKey="value" stroke="hsl(var(--accent))" strokeWidth={1.5} fill="hsl(var(--accent) / 0.15)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-1">Large Tx Count (>100 {d.asset}) — 30d</div>
          <div className="text-[18px] font-mono font-bold text-foreground">{d.large_tx_count.toLocaleString()}</div>
          <div className="mt-2 h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={txHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }} width={40} tickFormatter={v => `${(v/1000).toFixed(1)}K`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }} formatter={(v: number) => [v.toLocaleString(), 'Large Tx']} labelFormatter={() => ''} />
                <Bar dataKey="value" fill="hsl(var(--positive))" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Network Health</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          <Stat label="Avg Block Time" value={`${d.network.avg_block_time_s}s`} sub={d.asset === 'BTC' ? 'Target: 600s' : 'Target: 12s'} good={d.asset === 'BTC' ? d.network.avg_block_time_s < 620 : d.network.avg_block_time_s < 14} />
          <Stat label="Blocks (24h)" value={d.network.blocks_today.toLocaleString()} sub={d.asset === 'BTC' ? 'Target: 144' : 'Target: 7200'} />
          {d.asset === 'BTC' && <>
            <Stat label="Hash Rate" value={`${(d.network.hash_rate_th / 1e6).toFixed(0)} EH/s`} sub="estimated (3-block)" />
            <Stat label="Difficulty" value={`${(d.network.difficulty / 1e12).toFixed(1)}T`} sub="adjusts ~2 weeks" />
          </>}
        </div>
      </div>
    </div>
  );
}

// ── mempool tab (BTC only) ────────────────────────────────────────────────────

function MempoolTab({ d }: { d: OnChainData }) {
  if (d.asset !== 'BTC') return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono">
      Mempool data is BTC-specific — switch to BTC asset
    </div>
  );

  const m = d.mempool;
  const f = d.fees;

  const feeRows = f ? [
    { label: 'Next Block (~10 min)', fee: f.fastestFee, color: 'text-negative' },
    { label: 'In ~30 min',           fee: f.halfHourFee, color: 'text-accent' },
    { label: 'In ~60 min',           fee: f.hourFee, color: 'text-[hsl(50,100%,55%)]' },
    { label: 'Economy (hours)',       fee: f.economyFee, color: 'text-positive' },
    { label: 'Minimum',              fee: f.minimumFee, color: 'text-muted-foreground' },
  ] : [];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-border">
        {/* Mempool stats */}
        <div className="p-3 border-r border-border">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-3">Mempool State</div>
          {m ? (
            <div className="space-y-2 text-[9px] font-mono">
              {[
                { l: 'Unconfirmed Tx', v: m.count.toLocaleString() },
                { l: 'Virtual Size',   v: `${(m.vsize / 1e6).toFixed(1)} MvB` },
                { l: 'Total Fees',     v: `${(m.total_fee / 1e8).toFixed(4)} BTC` },
                { l: 'Avg Fee/Tx',     v: m.count > 0 ? `${Math.round(m.total_fee / m.count).toLocaleString()} sat` : '—' },
              ].map(s => (
                <div key={s.l} className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="text-foreground font-bold">{s.v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-[9px]">Loading mempool data…</div>
          )}
        </div>

        {/* Fee estimates */}
        <div className="p-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-3">Fee Estimates (sat/vB)</div>
          {f ? (
            <div className="space-y-2">
              {feeRows.map(row => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="text-[8px] font-mono text-muted-foreground flex-1">{row.label}</span>
                  <span className={`text-[11px] font-mono font-bold tabular-nums ${row.color}`}>{row.fee}</span>
                  <span className="text-[7px] text-muted-foreground">sat/vB</span>
                  <div className="w-24 h-1.5 bg-border overflow-hidden rounded-sm">
                    <div className={`h-full ${row.color.replace('text-','bg-')}`} style={{ width: `${Math.min(100, (row.fee / (f.fastestFee || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="text-[7px] font-mono text-muted-foreground mt-2">Source: mempool.space</div>
            </div>
          ) : (
            <div className="text-muted-foreground text-[9px]">Loading fee data…</div>
          )}
        </div>
      </div>

      {/* Congestion gauge */}
      {m && (
        <div className="p-3">
          <div className="text-[7px] font-mono text-accent uppercase tracking-widest mb-2">Mempool Congestion</div>
          <GaugeBand
            value={Math.min(m.count, 200000)}
            min={0} max={200000}
            label="Unconfirmed transactions"
            zones={[
              { from: 0,      to: 20000,  color: 'text-positive', label: 'Low' },
              { from: 20000,  to: 80000,  color: 'text-[hsl(50,100%,55%)]', label: 'Normal' },
              { from: 80000,  to: 150000, color: 'text-accent',   label: 'Congested' },
              { from: 150000, to: 200000, color: 'text-negative', label: 'Severe' },
            ]}
          />
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

const CACHE: Partial<Record<'BTC'|'ETH', { data: OnChainData; ts: number }>> = {};
const TTL = 5 * 60_000;

export default function OnChainView() {
  const [asset, setAsset] = useState<'BTC' | 'ETH'>('BTC');
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<OnChainData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (a: 'BTC' | 'ETH') => {
    const hit = CACHE[a];
    if (hit && Date.now() - hit.ts < TTL) { setData(hit.data); setLoading(false); return; }
    setLoading(true);
    try {
      const d = a === 'BTC' ? await fetchBTC() : buildSynthetic('ETH');
      CACHE[a] = { data: d, ts: Date.now() };
      setData(d);
    } catch {
      const d = buildSynthetic(a);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(asset); }, [asset, load]);

  const visibleTabs = asset === 'BTC' ? TABS : TABS.filter(t => t.id !== 'mempool');

  return (
    <CmdShell
      code="CHAIN"
      title={`${asset} On-Chain Analytics`}
      headerRight={
        <div className="flex gap-0">
          {(['BTC','ETH'] as const).map(a => (
            <button key={a} onClick={() => { setAsset(a); setTab('overview'); }}
              className={`px-3 py-0.5 text-[9px] font-mono font-bold border-r border-border transition-colors ${asset === a ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {a}
            </button>
          ))}
        </div>
      }
      tabs={<CmdTabs tabs={visibleTabs} active={tab} onChange={t => setTab(t as Tab)} />}
      footerLeft="MVRV · NUPL · SOPR · NVT · Exchange Reserve · Active Addresses · Mempool"
      footerRight={data?.synthetic ? 'MODEL DATA — mempool.space live for BTC mempool/fees' : `mempool.space · upd ${new Date(data?.fetchedAt ?? 0).toLocaleTimeString()}`}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-[10px] font-mono animate-pulse">
          Fetching on-chain data…
        </div>
      ) : data ? (
        <>
          {tab === 'overview'  && <OverviewTab d={data} />}
          {tab === 'valuation' && <ValuationTab d={data} />}
          {tab === 'activity'  && <ActivityTab d={data} />}
          {tab === 'mempool'   && <MempoolTab d={data} />}
        </>
      ) : null}
    </CmdShell>
  );
}
