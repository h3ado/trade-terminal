import { useState, useEffect } from 'react';
import CryptoCoinDetail from './CryptoCoinDetail';

interface L2Chain { name: string; tvl: number; chainId: string | null }

function fmtTvl(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

const TYPE_MAP: Record<string, string> = {
  'Arbitrum':      'Optimistic Rollup',
  'Optimism':      'Optimistic Rollup',
  'Base':          'Optimistic Rollup',
  'zkSync Era':    'ZK Rollup',
  'Polygon zkEVM': 'ZK Rollup',
  'Starknet':      'ZK Rollup',
  'Linea':         'ZK Rollup',
  'Scroll':        'ZK Rollup',
};

function Ph({ label }: { label: string }) {
  return (
    <div className="px-2 py-[3px] border-b border-border bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

function EthExtra() {
  const [chains, setChains] = useState<L2Chain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/market/crypto/l2-tvl')
      .then(r => r.json())
      .then((d: { chains: L2Chain[] }) => { setChains(d.chains ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Ph label="Ethereum Ecosystem" />
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 font-mono text-[9px]">
        <div className="text-[7px] text-muted-foreground font-bold uppercase mb-1 flex items-center gap-1">
          Layer 2 Networks
          {loading && <span className="animate-pulse">…</span>}
          {!loading && chains.length > 0 && <span className="text-[7px] text-accent">LIVE</span>}
        </div>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-2 py-[3px] border-b border-border/20 animate-pulse">
              <span className="bg-surface-elevated h-3 w-28 shrink-0 rounded-none" />
              <span className="bg-surface-elevated h-3 w-12 shrink-0 rounded-none" />
            </div>
          ))
        ) : chains.length > 0 ? (
          chains.map(l => (
            <div key={l.name} className="flex gap-2 py-[3px] border-b border-border/20">
              <span className="text-foreground font-semibold w-28 shrink-0 truncate">{l.name}</span>
              <span className="text-accent font-bold w-14 shrink-0">{fmtTvl(l.tvl)}</span>
              <span className="text-muted-foreground">{TYPE_MAP[l.name] ?? 'Rollup'}</span>
            </div>
          ))
        ) : (
          // Fallback to static if API unavailable
          [
            { name: 'Arbitrum One',   tvl: '$—', type: 'Optimistic Rollup' },
            { name: 'Base',           tvl: '$—', type: 'Optimistic Rollup' },
            { name: 'OP Mainnet',     tvl: '$—', type: 'Optimistic Rollup' },
            { name: 'zkSync Era',     tvl: '$—', type: 'ZK Rollup' },
            { name: 'Starknet',       tvl: '$—', type: 'ZK Rollup' },
          ].map(l => (
            <div key={l.name} className="flex gap-2 py-[3px] border-b border-border/20">
              <span className="text-foreground font-semibold w-28 shrink-0 truncate">{l.name}</span>
              <span className="text-muted-foreground font-bold w-14 shrink-0">{l.tvl}</span>
              <span className="text-muted-foreground">{l.type}</span>
            </div>
          ))
        )}
        <div className="mt-2 space-y-[2px] border-t border-border/40 pt-1">
          {[
            { l: 'Consensus',         v: 'Proof-of-Stake (The Merge Sep 2022)' },
            { l: 'Staking Yield',     v: '~3.5% APR' },
            { l: 'ETH Staked',        v: '~33M ETH (~27% of supply)' },
            { l: 'EIP-1559',          v: 'Base fee burned — deflationary' },
            { l: 'Block time',        v: '~12 seconds' },
            { l: 'Active validators', v: '~1,000,000+' },
          ].map(r => (
            <div key={r.l} className="flex justify-between text-[8px] border-b border-border/20 py-[2px]">
              <span className="text-muted-foreground shrink-0">{r.l}</span>
              <span className="text-foreground font-semibold text-right ml-2">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function CryptoETH() {
  return <CryptoCoinDetail coinId="ethereum" title="Ethereum" extra={<EthExtra />} />;
}
