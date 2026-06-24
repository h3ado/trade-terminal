import { useMemo, useState, useEffect } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { Plus, X, Trash2, AlertTriangle } from 'lucide-react';

type MistakeGuide = { description: string; prevention: string; severity: 'critical' | 'high' | 'medium' | 'low' };

const builtInMistakeGuides: Record<string, MistakeGuide> = {
  'FOMO Entry': { description: 'Entering a trade out of fear of missing out, typically chasing an extended move without a proper setup or plan.', prevention: 'Only enter trades that match your predefined setups. If you missed the move, wait for the next one — there\'s always another trade.', severity: 'critical' },
  'Revenge Trading': { description: 'Taking impulsive trades after a loss to "get even" with the market. Usually leads to larger losses and emotional spiraling.', prevention: 'Set a max daily loss limit. After 2 consecutive losses, take a 30-minute break. Journal your emotions before re-entering.', severity: 'critical' },
  'Moved Stop Loss': { description: 'Moving your stop loss further away from entry to avoid being stopped out, increasing risk beyond your original plan.', prevention: 'Set your stop before entering and treat it as immovable. Use hard stops on the platform, not mental stops.', severity: 'critical' },
  'Over-Sized Position': { description: 'Taking a position that\'s too large relative to your account, amplifying both potential loss and emotional pressure.', prevention: 'Calculate position size before every trade using your risk per trade rule (0.5–1%). Use a position size calculator.', severity: 'critical' },
  'Early Exit': { description: 'Closing a winning trade too early out of fear of giving back profits, leaving significant gains on the table.', prevention: 'Use a trailing stop instead of manual exits. Define your target before entry and stick to the plan.', severity: 'medium' },
  'No Stop Loss': { description: 'Entering a trade without any predefined stop loss level, exposing yourself to unlimited downside risk.', prevention: 'Never enter a trade without knowing your stop level. Place the stop order immediately after entry.', severity: 'critical' },
  'Chased Entry': { description: 'Entering a trade at an extended price far from the ideal entry point, resulting in poor risk:reward and a higher probability of being stopped out.', prevention: 'Wait for pullbacks to key levels. If the entry zone has passed, skip the trade and look for the next setup.', severity: 'high' },
  'Averaged Down': { description: 'Adding to a losing position to lower your average cost, compounding losses when the trade goes further against you.', prevention: 'Never add to a loser. If the trade isn\'t working, cut it. Only add to winners at predefined levels.', severity: 'critical' },
  'Ignored Rules': { description: 'Breaking your own trading rules — whether it\'s entry criteria, risk limits, or session times — leading to undisciplined losses.', prevention: 'Print your rules and keep them visible. Use a pre-trade checklist. Review rule adherence daily.', severity: 'high' },
  'Held Through News': { description: 'Keeping a position open through a major news event (FOMC, CPI, earnings) without hedging, exposing yourself to gap risk.', prevention: 'Check the economic calendar daily. Close or hedge positions before scheduled events. Reduce size on event days.', severity: 'high' },
  'Overtraded': { description: 'Taking too many trades in a session, often from boredom or the need to "be in the market," resulting in commission drag and poor decision quality.', prevention: 'Set a max trade count per day. Quality over quantity. If there\'s no A+ setup, sit on your hands.', severity: 'high' },
  'Wrong Size': { description: 'Using incorrect position sizing — either too large or too small — not matching the setup quality or volatility of the instrument.', prevention: 'Use ATR-based sizing. Size up for A+ setups, size down for B/C. Always calculate before clicking.', severity: 'medium' },
  'Didn\'t Take Profit': { description: 'Failing to take profits at your target level, watching a winning trade turn into a loser. Greed kills gains.', prevention: 'Scale out at predefined targets. Take 50% at 1:1, let the rest ride with a trail. Don\'t get greedy.', severity: 'high' },
  'Traded Against Trend': { description: 'Taking a counter-trend trade in a strongly trending market, fighting the dominant direction with low-probability setups.', prevention: 'Always identify the higher timeframe trend first. Only trade in the direction of the trend unless using a proven reversal strategy.', severity: 'medium' },
  'Emotional Entry': { description: 'Entering a trade based on feelings (excitement, anxiety, boredom) rather than a systematic setup and plan.', prevention: 'Rate your emotional state 1–10 before each trade. If above 7, wait. Use a breathing exercise before entering.', severity: 'high' },
  'Pre-Market FOMO': { description: 'Taking trades in the pre-market or immediately at the open based on hype or news without waiting for proper price action to develop.', prevention: 'Wait at least 5–15 minutes after the open. Let the opening range establish. Pre-market moves often reverse.', severity: 'medium' },
  'Held Overnight': { description: 'Holding a day trade overnight unintentionally, exposing yourself to gap risk and overnight news.', prevention: 'Set an alarm 15 minutes before close. Have a hard rule: all day trades close by 3:55 PM. No exceptions.', severity: 'high' },
  'Ignored Volume': { description: 'Entering a breakout or momentum trade on low volume, leading to a fakeout or failed move.', prevention: 'Always check volume before entering. Breakouts need >1.5× average volume. No volume = no trade.', severity: 'medium' },
  'Too Many Tickers': { description: 'Watching and trading too many stocks at once, leading to poor focus, missed signals, and execution errors.', prevention: 'Focus on 2–3 stocks max per session. Build a focused watchlist the night before. Depth over breadth.', severity: 'medium' },
  'Moved Target': { description: 'Extending your profit target during a trade, hoping for more gains instead of taking what the market gives you.', prevention: 'Set targets before entry based on structure, not hope. Use partial exits to manage the urge to hold.', severity: 'medium' },
  'Fat Finger': { description: 'Execution error — wrong size, wrong direction, or wrong ticker due to rushing or not double-checking the order.', prevention: 'Always review order details before submitting. Use hotkey confirmation. Slow down when it matters most.', severity: 'low' },
  'Didn\'t Journal': { description: 'Failing to document a trade for review, missing the learning opportunity and allowing the same mistakes to repeat.', prevention: 'Journal immediately after closing the trade while it\'s fresh. Use templates to make it fast. No excuses.', severity: 'low' },
  'Traded While Tired': { description: 'Trading when physically or mentally exhausted, leading to poor judgment, slow reflexes, and impulsive decisions.', prevention: 'Get 7+ hours of sleep. Don\'t trade if you\'re tired, sick, or distracted. Your P&L depends on your mental state.', severity: 'high' },
  'Scaled In Wrong': { description: 'Adding to a position at the wrong levels or too aggressively, resulting in poor average price and excess risk.', prevention: 'Pre-plan scale-in levels before the trade. Max 2–3 entries. Each add must improve your average meaningfully.', severity: 'medium' },
};

const CUSTOM_MISTAKES_KEY = 'custom-mistake-types';

function loadCustomMistakes(): Record<string, MistakeGuide> {
  try {
    const saved = localStorage.getItem(CUSTOM_MISTAKES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveCustomMistakes(data: Record<string, MistakeGuide>) {
  localStorage.setItem(CUSTOM_MISTAKES_KEY, JSON.stringify(data));
}

export default function MistakesView() {
  const { trades } = useTrades();
  const [customMistakes, setCustomMistakes] = useState<Record<string, MistakeGuide>>(loadCustomMistakes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const allGuides = useMemo(() => ({ ...builtInMistakeGuides, ...customMistakes }), [customMistakes]);

  const mistakeTrades = useMemo(() => trades.filter(t => t.mistake), [trades]);

  const stats = useMemo(() => {
    const totalCost = mistakeTrades.reduce((s, t) => s + t.pnl, 0);
    const avgLoss = mistakeTrades.length ? totalCost / mistakeTrades.length : 0;

    const typeMap: Record<string, { count: number; cost: number }> = {};
    mistakeTrades.forEach(t => {
      const m = t.mistake!;
      if (!typeMap[m]) typeMap[m] = { count: 0, cost: 0 };
      typeMap[m].count++;
      typeMap[m].cost += t.pnl;
    });
    const breakdown = Object.entries(typeMap)
      .map(([type, d]) => ({ type, count: d.count, cost: d.cost, avg: d.cost / d.count }))
      .sort((a, b) => a.cost - b.cost);

    const mostCommon = breakdown.length ? breakdown.reduce((a, b) => a.count > b.count ? a : b).type : 'N/A';
    const mostCostly = breakdown.length ? breakdown.reduce((a, b) => a.cost < b.cost ? a : b).type : 'N/A';

    return { total: mistakeTrades.length, totalCost, avgLoss, mostCommon, mostCostly, breakdown, pctOfAll: trades.length ? (mistakeTrades.length / trades.length * 100) : 0 };
  }, [trades, mistakeTrades]);

  const recentMistakes = mistakeTrades.slice(0, 8);

  const deleteCustom = (name: string) => {
    const updated = { ...customMistakes };
    delete updated[name];
    setCustomMistakes(updated);
    saveCustomMistakes(updated);
  };

  const addCustomMistake = (name: string, guide: MistakeGuide) => {
    const updated = { ...customMistakes, [name]: guide };
    setCustomMistakes(updated);
    saveCustomMistakes(updated);
    setShowAddModal(false);
  };

  // All known mistake types (from guides + from trade data)
  const allMistakeTypes = useMemo(() => {
    const fromTrades = new Set(mistakeTrades.map(t => t.mistake!));
    const fromGuides = new Set(Object.keys(allGuides));
    return Array.from(new Set([...fromGuides, ...fromTrades])).sort();
  }, [mistakeTrades, allGuides]);

  const sevColor = (s: string) => s === 'critical' ? 'text-negative' : s === 'high' ? 'text-accent' : s === 'medium' ? 'text-muted-foreground' : 'text-foreground';
  const sevBg = (s: string) => s === 'critical' ? 'bg-negative/10 border-negative/30' : s === 'high' ? 'bg-accent/10 border-accent/30' : 'bg-surface-elevated border-border';

  return (
    <div>
      <div className="flex justify-end items-center gap-3 mb-4">
        <ViewHeader />
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-mono uppercase font-bold hover:opacity-90 transition-opacity">
          <Plus className="w-3 h-3" /> Add Mistake Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Mistakes', value: String(stats.total), change: `${stats.pctOfAll.toFixed(1)}% of All Trades`, type: 'negative' as const },
          { label: 'Mistake Cost', value: `$${stats.totalCost.toFixed(0)}`, valueClass: 'text-negative', type: 'negative' as const },
          { label: 'Avg Loss/Mistake', value: `$${stats.avgLoss.toFixed(0)}`, valueClass: 'text-negative' },
          { label: 'Most Common', value: stats.mostCommon, valueClass: 'text-sm' },
          { label: 'Most Costly', value: stats.mostCostly, valueClass: 'text-sm text-negative' },
        ].map((s, i) => (
          <div key={i} className={`bg-card border border-border p-3 relative ${s.type === 'negative' ? 'stat-bar-negative-top' : 'stat-bar-accent-top'}`}>
            <div className="text-data-muted text-[10px] uppercase tracking-wide mb-1.5 font-body">{s.label}</div>
            <div className={`text-xl font-bold font-mono ${s.valueClass || ''}`}>{s.value}</div>
            {s.change && <div className="text-[11px] text-muted-foreground font-body">{s.change}</div>}
          </div>
        ))}
      </div>

      {/* Breakdown Table */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Mistake Breakdown</h2>
      </div>
      <div className="bg-card border border-border overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-primary">
              {['Mistake Type', 'Count', 'Total Cost', 'Avg Loss', '% of Mistakes'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[11px] text-accent uppercase font-mono font-bold border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.breakdown.map(r => (
              <tr key={r.type} className="hover:bg-surface-elevated transition-colors border-b border-grid-line">
                <td className="px-3 py-2.5 text-[11px] font-mono font-bold">{r.type}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono">{r.count}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-negative font-bold">${r.cost.toFixed(0)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-negative font-bold">${r.avg.toFixed(0)}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono">{stats.total ? ((r.count / stats.total) * 100).toFixed(0) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mistake Type Reference */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Mistake Reference Guide ({Object.keys(allGuides).length} Types)</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        {Object.entries(allGuides).map(([name, guide]) => {
          const isExpanded = expandedType === name;
          const tradeCount = stats.breakdown.find(b => b.type === name)?.count || 0;
          const tradeCost = stats.breakdown.find(b => b.type === name)?.cost || 0;
          const isCustom = !!customMistakes[name];

          return (
            <div key={name} className={`bg-card border ${isExpanded ? 'border-accent/50' : 'border-border'} transition-colors`}>
              <button
                onClick={() => setExpandedType(isExpanded ? null : name)}
                className="w-full p-3 text-left hover:bg-surface-elevated transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-3 h-3 ${sevColor(guide.severity)}`} />
                    <span className="text-[11px] font-mono font-bold">{name}</span>
                    {isCustom && <span className="text-[8px] px-1 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono">custom</span>}
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${sevBg(guide.severity)} ${sevColor(guide.severity)}`}>
                    {guide.severity.toUpperCase()}
                  </span>
                </div>
                {tradeCount > 0 && (
                  <div className="text-[9px] font-mono text-negative mt-1">{tradeCount}× committed • ${tradeCost.toFixed(0)} cost</div>
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                  <div>
                    <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-0.5">What It Is</div>
                    <p className="text-[10px] text-foreground/80 font-body leading-relaxed">{guide.description}</p>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-positive uppercase tracking-wider mb-0.5">How to Prevent</div>
                    <p className="text-[10px] text-foreground/80 font-body leading-relaxed">{guide.prevention}</p>
                  </div>
                  {isCustom && (
                    <button onClick={() => deleteCustom(name)}
                      className="flex items-center gap-1 text-[9px] font-mono text-negative hover:underline mt-1">
                      <Trash2 className="w-3 h-3" /> Delete Custom Type
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Mistakes */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Recent Mistakes</h2>
      </div>
      <div className="space-y-3">
        {recentMistakes.map(t => (
          <div key={t.id} className="bg-card border border-border p-3">
            <div className="flex justify-between mb-2">
              <div>
                <strong className="text-negative text-[11px] font-mono">{t.mistake} — {t.symbol}</strong>
                <div className="text-[10px] text-muted-foreground font-body">{t.date} • {t.strategy} • P&L: <span className="text-negative">${t.pnl.toFixed(0)}</span></div>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] border bg-negative/10 text-negative border-negative font-mono h-fit">MISTAKE</span>
            </div>
            {t.notes && <p className="text-[10px] text-foreground/70 font-body mb-2">{t.notes}</p>}
            <div className="flex gap-1 flex-wrap">
              {t.tags.map(tag => (
                <span key={tag} className="px-1 py-0.5 bg-surface-elevated border border-border text-[8px] font-body">{tag}</span>
              ))}
            </div>
          </div>
        ))}
        {recentMistakes.length === 0 && (
          <div className="bg-card border border-border p-6 text-center">
            <div className="text-positive text-[11px] font-mono">No mistakes recorded — keep it up!</div>
          </div>
        )}
      </div>

      {showAddModal && <AddMistakeModal onClose={() => setShowAddModal(false)} onAdd={addCustomMistake} />}
    </div>
  );
}

function AddMistakeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, guide: MistakeGuide) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prevention, setPrevention] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    onAdd(name.trim(), { description, prevention, severity });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={onClose}>
      <div className="bg-card border border-border p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-accent text-[12px] font-mono font-bold uppercase">Add Custom Mistake Type</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Mistake Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Traded During Lunch"
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What this mistake is and why it's harmful..."
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-body placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-y" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Prevention</label>
            <textarea value={prevention} onChange={e => setPrevention(e.target.value)} rows={2} placeholder="How to avoid making this mistake..."
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-body placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-y" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Severity</label>
            <select value={severity} onChange={e => setSeverity(e.target.value as any)}
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono border border-border text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSubmit} className="px-3 py-1.5 text-[10px] font-mono bg-accent text-accent-foreground hover:opacity-90">Add Mistake</button>
        </div>
      </div>
    </div>
  );
}
