import { useState, useMemo } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Trade, calcWinRate, calcTotalPnl, calcAvgWin, calcAvgLoss, calcProfitFactor, calcExpectancy, calcMaxDrawdown, calcSharpeRatio, groupByType } from '@/types/trade';
import {
  Search, SlidersHorizontal, Plus, X, ChevronUp, ChevronDown,
  Trash2, Edit3, Eye, Download, ArrowUpDown
} from 'lucide-react';
import SharedAddTradeModal from '@/components/AddTradeModal';

type SortKey = 'date' | 'symbol' | 'pnl' | 'size' | 'rr' | 'entry' | 'exit';
type SortDir = 'asc' | 'desc';

export default function TradesView() {
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades();
  const { privacyMode } = usePrivacy();
  const pm = privacyMode;

  // Filters
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSide, setFilterSide] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('');
  const [filterSetup, setFilterSetup] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterMistake, setFilterMistake] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Detail / Edit
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const perPage = 50;

  const uniqueSymbols = useMemo(() => [...new Set(trades.map(t => t.symbol))].sort(), [trades]);
  const uniqueStrategies = useMemo(() => [...new Set(trades.map(t => t.strategy))].sort(), [trades]);

  const filtered = useMemo(() => {
    let result = trades;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t => t.symbol.toLowerCase().includes(s) || t.tags.some(tag => tag.toLowerCase().includes(s)) || t.strategy.toLowerCase().includes(s) || (t.notes && t.notes.toLowerCase().includes(s)));
    }
    if (filterOutcome === 'win') result = result.filter(t => t.pnl > 0);
    if (filterOutcome === 'loss') result = result.filter(t => t.pnl < 0);
    if (filterType) result = result.filter(t => t.type === filterType);
    if (filterSide) result = result.filter(t => t.side === filterSide);
    if (filterStrategy) result = result.filter(t => t.strategy === filterStrategy);
    if (filterSetup) result = result.filter(t => t.setup === filterSetup);
    if (filterSymbol) result = result.filter(t => t.symbol === filterSymbol);
    if (filterMistake === 'yes') result = result.filter(t => t.mistake);
    if (filterMistake === 'no') result = result.filter(t => !t.mistake);
    if (dateFrom) result = result.filter(t => t.date >= dateFrom);
    if (dateTo) result = result.filter(t => t.date <= dateTo + ' 23:59');
    return result;
  }, [trades, search, filterOutcome, filterType, filterSide, filterStrategy, filterSetup, filterSymbol, filterMistake, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
        case 'pnl': cmp = a.pnl - b.pnl; break;
        case 'size': cmp = a.size - b.size; break;
        case 'rr': cmp = parseFloat(a.rr) - parseFloat(b.rr); break;
        case 'entry': cmp = a.entry - b.entry; break;
        case 'exit': cmp = a.exit - b.exit; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Stats for filtered results
  const stats = useMemo(() => {
    const byType = groupByType(filtered);
    return {
      total: filtered.length,
      wins: filtered.filter(t => t.pnl > 0).length,
      losses: filtered.filter(t => t.pnl < 0).length,
      totalPnl: calcTotalPnl(filtered),
      winRate: calcWinRate(filtered),
      avgWin: calcAvgWin(filtered),
      avgLoss: calcAvgLoss(filtered),
      profitFactor: calcProfitFactor(filtered),
      expectancy: calcExpectancy(filtered),
      bestTrade: filtered.length ? Math.max(...filtered.map(t => t.pnl)) : 0,
      worstTrade: filtered.length ? Math.min(...filtered.map(t => t.pnl)) : 0,
      totalFees: filtered.reduce((s, t) => s + t.fees + (t.commission || 0) + (t.swap || 0), 0),
      maxDrawdown: calcMaxDrawdown(filtered),
      sharpe: calcSharpeRatio(filtered),
      avgLeverage: filtered.filter(t => t.leverage).length > 0
        ? (filtered.filter(t => t.leverage).reduce((s, t) => s + (t.leverage || 0), 0) / filtered.filter(t => t.leverage).length).toFixed(1)
        : null,
      byType,
    };
  }, [filtered]);

  const clearFilters = () => {
    setSearch(''); setFilterOutcome(''); setFilterType(''); setFilterSide('');
    setFilterStrategy(''); setFilterSetup(''); setFilterSymbol(''); setFilterMistake('');
    setDateFrom(''); setDateTo('');
  };

  const hasFilters = search || filterOutcome || filterType || filterSide || filterStrategy || filterSetup || filterSymbol || filterMistake || dateFrom || dateTo;

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold tracking-wide border-b border-border cursor-pointer hover:text-foreground select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === field && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        {sortKey !== field && <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />}
      </span>
    </th>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">
          All Trades ({filtered.length}{filtered.length !== trades.length ? ` / ${trades.length}` : ''})
        </h2>
        <div className="flex items-center gap-3">
          <ViewHeader />
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-mono uppercase font-bold hover:opacity-90 transition-opacity">
            <Plus className="w-3 h-3" /> Add Trade
          </button>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-2 mb-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search symbol, tag, strategy..."
            className="w-full pl-7 pr-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-2.5 py-1.5 border text-[10px] font-mono uppercase transition-colors ${
            showFilters || hasFilters ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-elevated border-border text-muted-foreground hover:text-foreground'
          }`}>
          <SlidersHorizontal className="w-3 h-3" /> Filters {hasFilters && `(${[filterOutcome, filterType, filterSide, filterStrategy, filterSetup, filterSymbol, filterMistake, dateFrom, dateTo].filter(Boolean).length})`}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-mono text-negative hover:text-foreground">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-card border border-border p-3 mb-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <FilterSelect label="Outcome" value={filterOutcome} onChange={v => { setFilterOutcome(v); setPage(0); }}
            options={[['', 'All Outcomes'], ['win', 'Winners'], ['loss', 'Losers']]} />
          <FilterSelect label="Type" value={filterType} onChange={v => { setFilterType(v); setPage(0); }}
            options={[['', 'All Types'], ['Equity', 'Equity'], ['Option', 'Option'], ['Futures', 'Futures'], ['CFD', 'CFD']]} />
          <FilterSelect label="Side" value={filterSide} onChange={v => { setFilterSide(v); setPage(0); }}
            options={[['', 'All Sides'], ['LONG', 'Long'], ['SHORT', 'Short'], ['CALL', 'Call'], ['PUT', 'Put']]} />
          <FilterSelect label="Strategy" value={filterStrategy} onChange={v => { setFilterStrategy(v); setPage(0); }}
            options={[['', 'All Strategies'], ...uniqueStrategies.map(s => [s, s])]} />
          <FilterSelect label="Setup" value={filterSetup} onChange={v => { setFilterSetup(v); setPage(0); }}
            options={[['', 'All Setups'], ['A+', 'A+'], ['A', 'A'], ['B', 'B'], ['C', 'C']]} />
          <FilterSelect label="Symbol" value={filterSymbol} onChange={v => { setFilterSymbol(v); setPage(0); }}
            options={[['', 'All Symbols'], ...uniqueSymbols.map(s => [s, s])]} />
          <FilterSelect label="Mistake" value={filterMistake} onChange={v => { setFilterMistake(v); setPage(0); }}
            options={[['', 'All'], ['yes', 'Has Mistake'], ['no', 'No Mistake']]} />
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">From</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }}
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">To</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }}
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono" />
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 mb-3">
        <MiniStat label="Trades" value={String(stats.total)} />
        <MiniStat label="W/L" value={`${stats.wins}/${stats.losses}`} />
        <MiniStat label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} cls={stats.winRate >= 50 ? 'text-positive' : 'text-negative'} />
        <MiniStat label="Total P&L" value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(0)}`} cls={stats.totalPnl >= 0 ? 'text-positive' : 'text-negative'} />
        <MiniStat label="Avg Win" value={pm ? '•••' : `$${stats.avgWin.toFixed(0)}`} cls="text-positive" />
        <MiniStat label="Avg Loss" value={pm ? '•••' : `$${stats.avgLoss.toFixed(0)}`} cls="text-negative" />
        <MiniStat label="PF" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} />
        <MiniStat label="Expectancy" value={pm ? '•••' : `$${stats.expectancy.toFixed(0)}`} cls={stats.expectancy >= 0 ? 'text-positive' : 'text-negative'} />
        <MiniStat label="Max DD" value={pm ? '•••' : `$${stats.maxDrawdown.toFixed(0)}`} cls="text-negative" />
        <MiniStat label="Sharpe" value={stats.sharpe.toFixed(2)} cls={stats.sharpe >= 1 ? 'text-positive' : stats.sharpe >= 0 ? 'text-accent' : 'text-negative'} />
        <MiniStat label="Fees+Comm" value={pm ? '•••' : `$${stats.totalFees.toFixed(0)}`} />
        <MiniStat label="Net" value={pm ? '•••' : `$${(stats.totalPnl - stats.totalFees).toFixed(0)}`} cls={stats.totalPnl - stats.totalFees >= 0 ? 'text-positive' : 'text-negative'} />
      </div>

      {/* Instrument Type Breakdown */}
      {stats.byType.length > 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {stats.byType.map(bt => (
            <div key={bt.type} className="bg-card border border-border p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono font-bold text-accent uppercase">{bt.type}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{bt.trades} trades</span>
              </div>
              <div className="flex gap-3 text-[9px] font-mono">
                <span className={bt.totalPnl >= 0 ? 'text-positive' : 'text-negative'}>
                  {bt.totalPnl >= 0 ? '+' : ''}${bt.totalPnl.toFixed(0)}
                </span>
                <span className={bt.winRate >= 50 ? 'text-positive' : 'text-negative'}>
                  WR: {bt.winRate.toFixed(0)}%
                </span>
                <span className="text-muted-foreground">
                  PF: {bt.profitFactor === Infinity ? '∞' : bt.profitFactor.toFixed(1)}
                </span>
                {bt.avgLeverage && <span className="text-accent">{bt.avgLeverage.toFixed(0)}x</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-primary">
              <SortHeader label="Date/Time" field="date" />
              <SortHeader label="Symbol" field="symbol" />
              <th className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">Type</th>
              <th className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">Side</th>
              <SortHeader label="Entry" field="entry" />
              <SortHeader label="Exit" field="exit" />
              <SortHeader label="Size" field="size" />
              <SortHeader label="P&L" field="pnl" />
              <SortHeader label="R:R" field="rr" />
              <th className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">Setup</th>
              <th className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">Strategy</th>
              <th className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">Tags</th>
              <th className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(trade => {
              const sideColor = trade.side === 'LONG' || trade.side === 'CALL' ? 'text-positive' : 'text-negative';
              const pnlClass = trade.pnl >= 0 ? 'text-positive font-bold' : 'text-negative font-bold';
              const setupColor = trade.setup === 'A+' ? 'text-positive' : trade.setup === 'A' ? 'text-positive/70' : trade.setup === 'B' ? 'text-accent' : 'text-negative';
              return (
                <tr key={trade.id}
                  className={`hover:bg-surface-elevated transition-colors border-b border-grid-line cursor-pointer ${trade.mistake ? 'bg-negative/5' : ''} ${selectedTrade?.id === trade.id ? 'bg-accent/10' : ''}`}
                  onClick={() => setSelectedTrade(selectedTrade?.id === trade.id ? null : trade)}
                >
                  <td className="px-3 py-2 text-[10px] font-mono whitespace-nowrap">{trade.date}</td>
                  <td className="px-3 py-2 text-[10px] font-mono font-bold">{trade.symbol}</td>
                  <td className="px-3 py-2 text-[10px] font-body">{trade.type}</td>
                  <td className={`px-3 py-2 text-[10px] font-mono ${sideColor}`}>{trade.side}</td>
                  <td className="px-3 py-2 text-[10px] font-mono">{pm ? '•••' : `$${trade.entry.toFixed(2)}`}</td>
                  <td className="px-3 py-2 text-[10px] font-mono">{pm ? '•••' : `$${trade.exit.toFixed(2)}`}</td>
                  <td className="px-3 py-2 text-[10px] font-mono">
                    {pm ? '•' : trade.size}
                    {trade.leverage && <span className="text-accent ml-0.5 text-[8px]">{trade.leverage}x</span>}
                    {trade.contractSize && <span className="text-muted-foreground ml-0.5 text-[8px]">×{trade.contractSize}</span>}
                  </td>
                  <td className={`px-3 py-2 text-[10px] font-mono ${pnlClass}`}>{pm ? '•••••' : `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`}</td>
                  <td className="px-3 py-2 text-[10px] font-mono">{trade.rr}</td>
                  <td className={`px-3 py-2 text-[10px] font-mono font-bold ${setupColor}`}>{trade.setup}</td>
                  <td className="px-3 py-2 text-[10px] font-body truncate max-w-[100px]">{trade.strategy}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-0.5">
                      {trade.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="inline-block px-1 py-0.5 bg-surface-elevated border border-border text-[8px] font-body">{tag}</span>
                      ))}
                      {trade.tags.length > 2 && <span className="text-[8px] text-muted-foreground">+{trade.tags.length - 2}</span>}
                      {trade.mistake && <span className="inline-block px-1 py-0.5 bg-negative/10 border border-negative/30 text-[8px] text-negative font-body">!</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => deleteTrade(trade.id)}
                      className="p-1 text-muted-foreground hover:text-negative transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] font-mono text-muted-foreground">
            Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="px-2 py-1 text-[10px] font-mono border border-border bg-surface-elevated disabled:opacity-30 hover:text-accent">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="px-2 py-1 text-[10px] font-mono border border-border bg-surface-elevated disabled:opacity-30 hover:text-accent">‹</button>
            <span className="px-3 py-1 text-[10px] font-mono text-accent">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="px-2 py-1 text-[10px] font-mono border border-border bg-surface-elevated disabled:opacity-30 hover:text-accent">›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="px-2 py-1 text-[10px] font-mono border border-border bg-surface-elevated disabled:opacity-30 hover:text-accent">»</button>
          </div>
        </div>
      )}

      {/* Trade Detail Panel */}
      {selectedTrade && (
        <div className="mt-4 bg-card border border-border p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-accent text-[12px] font-mono font-bold uppercase">
                {selectedTrade.symbol} — {selectedTrade.side} {selectedTrade.type}
              </h3>
              <div className="text-[10px] text-muted-foreground font-mono">{selectedTrade.date} • {selectedTrade.strategy} • Hold: {selectedTrade.holdTime}</div>
            </div>
            <button onClick={() => setSelectedTrade(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
            <DetailStat label="Entry" value={`$${selectedTrade.entry.toFixed(2)}`} />
            <DetailStat label="Exit" value={`$${selectedTrade.exit.toFixed(2)}`} />
            <DetailStat label="Size" value={String(selectedTrade.size)} />
            <DetailStat label="P&L" value={`${selectedTrade.pnl >= 0 ? '+' : ''}$${selectedTrade.pnl.toFixed(2)}`} cls={selectedTrade.pnl >= 0 ? 'text-positive' : 'text-negative'} />
            <DetailStat label="R:R" value={selectedTrade.rr} />
            <DetailStat label="Setup" value={selectedTrade.setup} cls={selectedTrade.setup === 'A+' || selectedTrade.setup === 'A' ? 'text-positive' : selectedTrade.setup === 'B' ? 'text-accent' : 'text-negative'} />
            <DetailStat label="Fees" value={`$${(selectedTrade.fees + (selectedTrade.commission || 0) + (selectedTrade.swap || 0)).toFixed(2)}`} />
            <DetailStat label="Net P&L" value={`$${(selectedTrade.pnl - selectedTrade.fees - (selectedTrade.commission || 0) - (selectedTrade.swap || 0)).toFixed(2)}`} cls={selectedTrade.pnl - selectedTrade.fees >= 0 ? 'text-positive' : 'text-negative'} />
          </div>

          {/* Instrument-specific details */}
          {(selectedTrade.leverage || selectedTrade.contractSize || selectedTrade.strikePrice || selectedTrade.margin) && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-3 pt-2 border-t border-border">
              {selectedTrade.leverage && <DetailStat label="Leverage" value={`${selectedTrade.leverage}x`} cls="text-accent" />}
              {selectedTrade.contractSize && <DetailStat label="Contract Size" value={`${selectedTrade.contractSize}`} />}
              {selectedTrade.margin && <DetailStat label="Margin" value={`$${selectedTrade.margin.toFixed(0)}`} />}
              {selectedTrade.strikePrice && <DetailStat label="Strike" value={`$${selectedTrade.strikePrice.toFixed(2)}`} />}
              {selectedTrade.expiry && <DetailStat label="Expiry" value={selectedTrade.expiry} />}
              {selectedTrade.optionPremium && <DetailStat label="Premium" value={`$${selectedTrade.optionPremium.toFixed(2)}`} />}
              {selectedTrade.iv && <DetailStat label="IV" value={`${selectedTrade.iv.toFixed(1)}%`} />}
              {selectedTrade.delta && <DetailStat label="Delta" value={`${selectedTrade.delta.toFixed(2)}`} />}
              {selectedTrade.commission && <DetailStat label="Commission" value={`$${selectedTrade.commission.toFixed(2)}`} />}
              {selectedTrade.swap && <DetailStat label="Swap" value={`$${selectedTrade.swap.toFixed(2)}`} cls={selectedTrade.swap < 0 ? 'text-negative' : ''} />}
            </div>
          )}

          {/* Risk details */}
          {(selectedTrade.stopLoss || selectedTrade.takeProfit || selectedTrade.riskAmount || selectedTrade.maxDrawdown) && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-3 pt-2 border-t border-border">
              {selectedTrade.stopLoss && <DetailStat label="Stop Loss" value={`$${selectedTrade.stopLoss.toFixed(2)}`} cls="text-negative" />}
              {selectedTrade.takeProfit && <DetailStat label="Take Profit" value={`$${selectedTrade.takeProfit.toFixed(2)}`} cls="text-positive" />}
              {selectedTrade.riskAmount && <DetailStat label="Risk $" value={`$${selectedTrade.riskAmount.toFixed(0)}`} />}
              {selectedTrade.riskPercent && <DetailStat label="Risk %" value={`${selectedTrade.riskPercent.toFixed(1)}%`} />}
              {selectedTrade.maxDrawdown && <DetailStat label="Max Adverse" value={`$${selectedTrade.maxDrawdown.toFixed(2)}`} cls="text-negative" />}
              {selectedTrade.maxRunup && <DetailStat label="Max Favorable" value={`$${selectedTrade.maxRunup.toFixed(2)}`} cls="text-positive" />}
              {selectedTrade.slippage && <DetailStat label="Slippage" value={`$${selectedTrade.slippage.toFixed(2)}`} />}
            </div>
          )}

          {/* Context */}
          {(selectedTrade.emotionalState || selectedTrade.marketCondition) && (
            <div className="flex gap-2 mb-3 pt-2 border-t border-border">
              {selectedTrade.marketCondition && (
                <span className="px-2 py-0.5 bg-surface-elevated border border-border text-[9px] font-mono">
                  Market: {selectedTrade.marketCondition}
                </span>
              )}
              {selectedTrade.emotionalState && (
                <span className="px-2 py-0.5 bg-surface-elevated border border-border text-[9px] font-mono">
                  Emotion: {selectedTrade.emotionalState}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-2">
            {selectedTrade.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-surface-elevated border border-border text-[9px] font-body">{tag}</span>
            ))}
          </div>
          {selectedTrade.mistake && (
            <div className="bg-negative/5 border border-negative/20 px-3 py-2 text-[10px] font-body mb-2">
              <span className="text-negative font-bold font-mono">MISTAKE:</span> <span className="text-foreground">{selectedTrade.mistake}</span>
            </div>
          )}
          {selectedTrade.notes && (
            <div className="text-[10px] text-muted-foreground font-body">{selectedTrade.notes}</div>
          )}
        </div>
      )}

      {/* Add Trade Modal */}
      {showAddModal && <SharedAddTradeModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[][];
}) {
  return (
    <div>
      <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono">
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

function MiniStat({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="bg-card border border-border px-2 py-1.5">
      <div className="text-[8px] text-muted-foreground uppercase font-body truncate">{label}</div>
      <div className={`text-[11px] font-bold font-mono ${cls}`}>{value}</div>
    </div>
  );
}

function DetailStat({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <div className="text-[9px] text-muted-foreground uppercase font-body">{label}</div>
      <div className={`text-[12px] font-bold font-mono ${cls}`}>{value}</div>
    </div>
  );
}
