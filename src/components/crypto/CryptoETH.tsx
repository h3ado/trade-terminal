import CryptoCoinDetail from './CryptoCoinDetail';

function Ph({ label }: { label: string }) {
  return (
    <div className="px-2 py-[3px] border-b border-border bg-surface-elevated shrink-0">
      <span className="text-[8px] text-accent font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

const ETH_EXTRA = (
  <>
    <Ph label="Ethereum Ecosystem" />
    <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 font-mono text-[9px]">
      <div className="text-[7px] text-muted-foreground font-bold uppercase mb-1">Layer 2 Networks</div>
      {[
        { name: 'Arbitrum One',   tvl: '$15.2B', type: 'Optimistic Rollup' },
        { name: 'OP Mainnet',     tvl: '$6.8B',  type: 'Optimistic Rollup' },
        { name: 'Base',           tvl: '$8.1B',  type: 'Optimistic Rollup' },
        { name: 'zkSync Era',     tvl: '$3.2B',  type: 'ZK Rollup' },
        { name: 'Polygon zkEVM',  tvl: '$0.8B',  type: 'ZK Rollup' },
        { name: 'Starknet',       tvl: '$1.1B',  type: 'ZK Rollup' },
      ].map(l => (
        <div key={l.name} className="flex gap-2 py-[3px] border-b border-border/20">
          <span className="text-foreground font-semibold w-28 shrink-0 truncate">{l.name}</span>
          <span className="text-accent font-bold w-12 shrink-0">{l.tvl}</span>
          <span className="text-muted-foreground">{l.type}</span>
        </div>
      ))}
      <div className="mt-2 space-y-[2px] border-t border-border/40 pt-1">
        {[
          { l: 'Consensus',        v: 'Proof-of-Stake (The Merge Sep 2022)' },
          { l: 'Staking Yield',    v: '~3.5% APR' },
          { l: 'ETH Staked',       v: '~33M ETH (~27% of supply)' },
          { l: 'EIP-1559',         v: 'Base fee burned — deflationary' },
          { l: 'Block time',       v: '~12 seconds' },
          { l: 'Active validators',v: '~1,000,000+' },
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

export default function CryptoETH() {
  return <CryptoCoinDetail coinId="ethereum" title="Ethereum" extra={ETH_EXTRA} />;
}
