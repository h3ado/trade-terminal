import { useMemo, useState } from 'react';
import { BridgeProvider } from '@/contexts/BridgeContext';
import CmdHeaderStrip from '@/components/shared/CmdHeaderStrip';
import { useTrades } from '@/contexts/TradeContext';
import { calcTotalPnl, calcWinRate } from '@/types/trade';
import { Edit3, Save, X, ChevronDown, ChevronUp, Search } from 'lucide-react';


function JournalViewInner() {
  const { trades, updateTrade } = useTrades();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editMistake, setEditMistake] = useState('');
  const [editSetup, setEditSetup] = useState('');
  const [editTags, setEditTags] = useState('');
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'win' | 'loss' | 'mistake'>('all');

  // Group trades by date for daily journal entries
  const dailyEntries = useMemo(() => {
    const map: Record<string, typeof trades> = {};
    trades.forEach(t => {
      const day = t.date.split(' ')[0];
      (map[day] ??= []).push(t);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayTrades]) => {
        const pnl = calcTotalPnl(dayTrades);
        const wins = dayTrades.filter(t => t.pnl > 0).length;
        const losses = dayTrades.filter(t => t.pnl < 0).length;
        const mistakes = dayTrades.filter(t => !!t.mistake);
        const winRate = calcWinRate(dayTrades);
        return { date, trades: dayTrades, pnl, wins, losses, mistakes: mistakes.length, winRate };
      });
  }, [trades]);

  // Filter entries
  const filtered = useMemo(() => {
    let result = dailyEntries;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e =>
        e.date.includes(s) ||
        e.trades.some(t => t.symbol.toLowerCase().includes(s) || t.notes?.toLowerCase().includes(s) || t.strategy.toLowerCase().includes(s))
      );
    }
    if (filterTag === 'win') result = result.filter(e => e.pnl > 0);
    if (filterTag === 'loss') result = result.filter(e => e.pnl < 0);
    if (filterTag === 'mistake') result = result.filter(e => e.mistakes > 0);
    return result;
  }, [dailyEntries, search, filterTag]);

  // Overall journal stats
  const journalStats = useMemo(() => {
    const totalDays = dailyEntries.length;
    const profitDays = dailyEntries.filter(e => e.pnl > 0).length;
    const mistakeDays = dailyEntries.filter(e => e.mistakes > 0).length;
    const tradesWithNotes = trades.filter(t => t.notes && t.notes.trim()).length;
    return { totalDays, profitDays, mistakeDays, tradesWithNotes, totalTrades: trades.length };
  }, [dailyEntries, trades]);

  const startEdit = (trade: typeof trades[0]) => {
    setEditingId(trade.id);
    setEditNotes(trade.notes || '');
    setEditMistake(trade.mistake || '');
    setEditSetup(trade.setup);
    setEditTags(trade.tags.join(', '));
  };

  const saveEdit = (id: string) => {
    updateTrade(id, {
      notes: editNotes,
      mistake: editMistake || undefined,
      setup: editSetup as any,
      tags: editTags.split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
      <CmdHeaderStrip
        code="JRNL"
        label="Trading Journal"
        context={`${journalStats.totalDays} DAYS · ${journalStats.totalTrades} TRADES`}
        right={
          <>
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="SEARCH"
                className="w-32 pl-6 pr-1.5 py-0.5 bg-background border border-border text-foreground text-[10px] font-mono uppercase tracking-wider placeholder:text-muted-foreground focus:outline-none focus:border-accent"
              />
            </div>
            {(['all', 'win', 'loss', 'mistake'] as const).map(f => (
              <button key={f} onClick={() => setFilterTag(f)}
                className={`px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border transition-colors ${
                  filterTag === f ? 'border-accent text-accent' : 'border-border text-muted-foreground hover:text-foreground hover:border-accent'
                }`}>
                {f === 'all' ? 'ALL' : f === 'win' ? 'GRN' : f === 'loss' ? 'RED' : 'MIST'}
              </button>
            ))}
            <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{filtered.length}D</span>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-2 min-w-0">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
        {[
          { label: 'Trading Days', value: String(journalStats.totalDays) },
          { label: 'Profitable Days', value: String(journalStats.profitDays), type: 'positive' as const },
          { label: 'Mistake Days', value: String(journalStats.mistakeDays), type: 'negative' as const },
          { label: 'Documented', value: `${journalStats.tradesWithNotes}/${journalStats.totalTrades}`, change: 'Trades with Notes' },
          { label: 'Documentation %', value: `${journalStats.totalTrades ? ((journalStats.tradesWithNotes / journalStats.totalTrades) * 100).toFixed(0) : 0}%` },
        ].map((s, i) => (
          <div key={i} className={`bg-card border border-border p-2 relative ${
            s.type === 'positive' ? 'stat-bar-positive-top' : s.type === 'negative' ? 'stat-bar-negative-top' : 'stat-bar-accent-top'
          }`}>
            <div className="text-data-muted text-[9px] uppercase tracking-wide mb-0.5 font-mono">{s.label}</div>
            <div className="text-base font-bold font-mono">{s.value}</div>
            {s.change && <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{s.change}</div>}
          </div>
        ))}
      </div>


      {/* Daily entries */}
      <div className="space-y-3">
        {filtered.map(entry => {
          const isExpanded = expandedId === entry.date;
          return (
            <div key={entry.date} className="bg-card border border-border">
              {/* Day header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.date)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-[12px] font-mono font-bold text-accent">{entry.date}</div>
                  <div className={`text-[12px] font-mono font-bold ${entry.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(0)}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {entry.trades.length} trades
                  </div>
                  <div className="text-[10px] font-mono">
                    <span className="text-positive">{entry.wins}W</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="text-negative">{entry.losses}L</span>
                  </div>
                  <div className={`text-[10px] font-mono ${entry.winRate >= 50 ? 'text-positive' : 'text-negative'}`}>
                    {entry.winRate.toFixed(0)}% WR
                  </div>
                  {entry.mistakes > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono bg-negative/10 text-negative border border-negative/30">
                      {entry.mistakes} MISTAKE{entry.mistakes > 1 ? 'S' : ''}
                    </span>
                  )}
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Expanded trades */}
              {isExpanded && (
                <div className="border-t border-border">
                  {entry.trades.map(trade => {
                    const isEditing = editingId === trade.id;
                    const isWin = trade.pnl > 0;
                    const sideColor = trade.side === 'LONG' || trade.side === 'CALL' ? 'text-positive' : 'text-negative';
                    const setupColor = trade.setup === 'A+' ? 'text-positive' : trade.setup === 'A' ? 'text-positive/70' : trade.setup === 'B' ? 'text-accent' : 'text-negative';

                    return (
                      <div key={trade.id} className={`px-4 py-3 border-b border-grid-line last:border-0 ${trade.mistake ? 'bg-negative/5' : ''}`}>
                        {/* Trade summary row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono font-bold">{trade.symbol}</span>
                            <span className={`text-[10px] font-mono ${sideColor}`}>{trade.side}</span>
                            <span className="text-[10px] font-body text-muted-foreground">{trade.type}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              ${trade.entry.toFixed(2)} → ${trade.exit.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">×{trade.size}</span>
                            <span className={`text-[11px] font-mono font-bold ${isWin ? 'text-positive' : 'text-negative'}`}>
                              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">R:R {trade.rr}</span>
                            <span className={`text-[10px] font-mono font-bold ${setupColor}`}>{trade.setup}</span>
                            <span className="text-[10px] font-body text-muted-foreground">{trade.strategy}</span>
                          </div>
                          {!isEditing && (
                            <button onClick={() => startEdit(trade)}
                              className="p-1 text-muted-foreground hover:text-accent transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Editable section */}
                        {isEditing ? (
                          <div className="space-y-2 mt-2 bg-surface-primary border border-border p-3">
                            <div>
                              <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Notes / Reflection</label>
                              <textarea
                                value={editNotes} onChange={e => setEditNotes(e.target.value)}
                                rows={3}
                                placeholder="What went well? What would you do differently? Key observations..."
                                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-body placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-y"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Setup Quality</label>
                                <select value={editSetup} onChange={e => setEditSetup(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono">
                                  {['A+', 'A', 'B', 'C'].map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Tags (comma sep)</label>
                                <input value={editTags} onChange={e => setEditTags(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                                  placeholder="Breakout, Clean Entry" />
                              </div>
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Mistake (if any)</label>
                                <input value={editMistake} onChange={e => setEditMistake(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                                  placeholder="FOMO, Oversized, etc." />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={cancelEdit}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono border border-border text-muted-foreground hover:text-foreground">
                                <X className="w-3 h-3" /> Cancel
                              </button>
                              <button onClick={() => saveEdit(trade.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono bg-accent text-accent-foreground hover:opacity-90">
                                <Save className="w-3 h-3" /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Display notes */}
                            {trade.notes && (
                              <div className="text-[11px] text-foreground font-body leading-relaxed mb-2 pl-2 border-l-2 border-accent/30">
                                {trade.notes}
                              </div>
                            )}
                            {!trade.notes && (
                              <button onClick={() => startEdit(trade)}
                                className="text-[10px] text-muted-foreground font-body italic hover:text-accent transition-colors mb-2">
                                + Add notes & reflection...
                              </button>
                            )}
                            {/* Mistake */}
                            {trade.mistake && (
                              <div className="bg-negative/5 border border-negative/20 px-2 py-1.5 text-[10px] font-body mb-2">
                                <span className="text-negative font-bold font-mono">MISTAKE:</span>{' '}
                                <span className="text-foreground">{trade.mistake}</span>
                              </div>
                            )}
                            {/* Tags */}
                            {trade.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {trade.tags.map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-surface-elevated border border-border text-[9px] font-body">{tag}</span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-card border border-border p-8 text-center">
            <div className="text-muted-foreground text-[11px] font-mono">No journal entries match your filters.</div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function JournalView() {
  return (
    <BridgeProvider>
      <JournalViewInner />
    </BridgeProvider>
  );
}

