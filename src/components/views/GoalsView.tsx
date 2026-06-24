import { useMemo, useState, useEffect } from 'react';
import ViewHeader from '@/components/ViewHeader';
import { useTrades } from '@/contexts/TradeContext';
import { calcTotalPnl, calcWinRate, calcProfitFactor, calcExpectancy } from '@/types/trade';
import { Plus, X, Trash2, Edit3, Save, Trophy, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

type GoalType = 'pnl_monthly' | 'pnl_weekly' | 'pnl_total' | 'win_rate' | 'mistake_rate' | 'trade_count' | 'journal_pct' | 'profit_factor' | 'max_loss' | 'win_streak' | 'custom_pct';

interface CustomGoal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  description: string;
  createdAt: string;
}

const GOALS_KEY = 'trading-goals';

function loadGoals(): CustomGoal[] {
  try {
    const saved = localStorage.getItem(GOALS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultGoals();
}

function saveGoals(goals: CustomGoal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function defaultGoals(): CustomGoal[] {
  return [
    { id: '1', title: 'Monthly P&L Target', type: 'pnl_monthly', target: 5000, description: 'Hit $5,000 profit this month', createdAt: new Date().toISOString() },
    { id: '2', title: 'Win Rate Goal', type: 'win_rate', target: 65, description: 'Maintain 65%+ win rate', createdAt: new Date().toISOString() },
    { id: '3', title: 'Reduce Mistakes', type: 'mistake_rate', target: 10, description: 'Keep mistake rate below 10%', createdAt: new Date().toISOString() },
    { id: '4', title: 'Journal Every Trade', type: 'journal_pct', target: 90, description: 'Document at least 90% of trades', createdAt: new Date().toISOString() },
    { id: '5', title: 'Weekly P&L Floor', type: 'pnl_weekly', target: 1000, description: 'Make at least $1,000 per week', createdAt: new Date().toISOString() },
    { id: '6', title: 'Profit Factor', type: 'profit_factor', target: 2, description: 'Achieve 2.0+ profit factor', createdAt: new Date().toISOString() },
  ];
}

export default function GoalsView() {
  const { trades } = useTrades();
  const [goals, setGoals] = useState<CustomGoal[]>(loadGoals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [milestoneFilter, setMilestoneFilter] = useState<string>('All');

  useEffect(() => { saveGoals(goals); }, [goals]);

  // Computed metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const monthTrades = trades.filter(t => {
      const d = new Date(t.date.replace(' ', 'T'));
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekTrades = trades.filter(t => new Date(t.date.replace(' ', 'T')) >= weekStart);

    const monthPnl = calcTotalPnl(monthTrades);
    const weekPnl = calcTotalPnl(weekTrades);
    const totalPnl = calcTotalPnl(trades);
    const winRate = calcWinRate(trades);
    const mistakeRate = trades.length ? (trades.filter(t => t.mistake).length / trades.length * 100) : 0;
    const journalPct = trades.length ? (trades.filter(t => t.notes && t.notes.trim()).length / trades.length * 100) : 0;
    const pf = calcProfitFactor(trades);
    const expectancy = calcExpectancy(trades);

    // Max daily loss
    const dailyPnl: Record<string, number> = {};
    trades.forEach(t => { const d = t.date.split(' ')[0]; dailyPnl[d] = (dailyPnl[d] || 0) + t.pnl; });
    const worstDay = Math.min(...Object.values(dailyPnl), 0);

    // Win streak
    let maxStreak = 0, cur = 0;
    [...trades].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
      if (t.pnl > 0) { cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 0;
    });

    return { monthPnl, weekPnl, totalPnl, winRate, mistakeRate, journalPct, pf, expectancy, worstDay: Math.abs(worstDay), maxStreak, tradeCount: trades.length };
  }, [trades]);

  const getProgress = (goal: CustomGoal): { pct: number; current: string; target: string; isNegativeMetric: boolean } => {
    switch (goal.type) {
      case 'pnl_monthly':
        return { pct: Math.min(100, Math.max(0, (metrics.monthPnl / goal.target) * 100)), current: `$${metrics.monthPnl.toFixed(0)}`, target: `$${goal.target.toLocaleString()}`, isNegativeMetric: false };
      case 'pnl_weekly':
        return { pct: Math.min(100, Math.max(0, (metrics.weekPnl / goal.target) * 100)), current: `$${metrics.weekPnl.toFixed(0)}`, target: `$${goal.target.toLocaleString()}`, isNegativeMetric: false };
      case 'pnl_total':
        return { pct: Math.min(100, Math.max(0, (metrics.totalPnl / goal.target) * 100)), current: `$${metrics.totalPnl.toFixed(0)}`, target: `$${goal.target.toLocaleString()}`, isNegativeMetric: false };
      case 'win_rate':
        return { pct: Math.min(100, (metrics.winRate / goal.target) * 100), current: `${metrics.winRate.toFixed(1)}%`, target: `${goal.target}%`, isNegativeMetric: false };
      case 'mistake_rate':
        const mistakePct = metrics.mistakeRate <= goal.target ? 100 : Math.max(0, ((goal.target * 2 - metrics.mistakeRate) / goal.target) * 100);
        return { pct: mistakePct, current: `${metrics.mistakeRate.toFixed(1)}%`, target: `<${goal.target}%`, isNegativeMetric: metrics.mistakeRate > goal.target };
      case 'trade_count':
        return { pct: Math.min(100, (metrics.tradeCount / goal.target) * 100), current: `${metrics.tradeCount}`, target: `${goal.target}`, isNegativeMetric: false };
      case 'journal_pct':
        return { pct: Math.min(100, (metrics.journalPct / goal.target) * 100), current: `${metrics.journalPct.toFixed(0)}%`, target: `${goal.target}%`, isNegativeMetric: false };
      case 'profit_factor':
        const pfVal = metrics.pf === Infinity ? goal.target * 2 : metrics.pf;
        return { pct: Math.min(100, (pfVal / goal.target) * 100), current: metrics.pf === Infinity ? '∞' : metrics.pf.toFixed(2), target: `${goal.target}`, isNegativeMetric: false };
      case 'max_loss':
        const lossPct = metrics.worstDay <= goal.target ? 100 : Math.max(0, ((goal.target * 2 - metrics.worstDay) / goal.target) * 100);
        return { pct: lossPct, current: `$${metrics.worstDay.toFixed(0)}`, target: `<$${goal.target}`, isNegativeMetric: metrics.worstDay > goal.target };
      case 'win_streak':
        return { pct: Math.min(100, (metrics.maxStreak / goal.target) * 100), current: `${metrics.maxStreak}`, target: `${goal.target}`, isNegativeMetric: false };
      case 'custom_pct':
        return { pct: 0, current: '—', target: `${goal.target}`, isNegativeMetric: false };
      default:
        return { pct: 0, current: '—', target: '—', isNegativeMetric: false };
    }
  };

  const deleteGoal = (id: string) => setGoals(g => g.filter(x => x.id !== id));
  const addGoal = (goal: CustomGoal) => setGoals(g => [...g, goal]);
  const updateGoal = (id: string, updates: Partial<CustomGoal>) => {
    setGoals(g => g.map(x => x.id === id ? { ...x, ...updates } : x));
    setEditingId(null);
  };

  // Milestones
  const milestones = useMemo(() => {
    const uniqueSymbols = new Set(trades.map(t => t.symbol)).size;
    const uniqueStrategies = new Set(trades.map(t => t.strategy)).size;
    const uniqueSectors = new Set(trades.map(t => t.sector)).size;
    const greenDays = Object.values(trades.reduce((acc: Record<string, number>, t) => {
      const d = t.date.split(' ')[0];
      acc[d] = (acc[d] || 0) + t.pnl;
      return acc;
    }, {})).filter(v => v > 0).length;
    const totalDays = new Set(trades.map(t => t.date.split(' ')[0])).size;
    const bigWins = trades.filter(t => t.pnl >= 1000).length;
    const hugWins = trades.filter(t => t.pnl >= 5000).length;
    const optionTrades = trades.filter(t => t.type === 'Option').length;
    const equityTrades = trades.filter(t => t.type === 'Equity').length;
    const longTrades = trades.filter(t => t.side === 'LONG').length;
    const shortTrades = trades.filter(t => t.side === 'SHORT').length;
    const aSetups = trades.filter(t => t.setup === 'A+' || t.setup === 'A').length;
    const notedTrades = trades.filter(t => t.notes && t.notes.trim().length > 0).length;
    const taggedTrades = trades.filter(t => t.tags && t.tags.length > 0).length;
    const avgRR = trades.length ? trades.reduce((s, t) => s + parseFloat(t.rr || '0'), 0) / trades.length : 0;

    const list: { title: string; icon: string; value: string; achieved: boolean; category: string }[] = [
      // Volume milestones
      { title: 'First Trade', icon: '🎯', value: `${metrics.tradeCount} total`, achieved: metrics.tradeCount >= 1, category: 'Volume' },
      { title: '25 Trades', icon: '📊', value: `${metrics.tradeCount}/25`, achieved: metrics.tradeCount >= 25, category: 'Volume' },
      { title: '50 Trades', icon: '📊', value: `${metrics.tradeCount}/50`, achieved: metrics.tradeCount >= 50, category: 'Volume' },
      { title: '100 Trades', icon: '💯', value: `${metrics.tradeCount}/100`, achieved: metrics.tradeCount >= 100, category: 'Volume' },
      { title: '250 Trades', icon: '🔥', value: `${metrics.tradeCount}/250`, achieved: metrics.tradeCount >= 250, category: 'Volume' },
      { title: '500 Trades', icon: '⚡', value: `${metrics.tradeCount}/500`, achieved: metrics.tradeCount >= 500, category: 'Volume' },
      { title: '1,000 Trades', icon: '🏆', value: `${metrics.tradeCount}/1000`, achieved: metrics.tradeCount >= 1000, category: 'Volume' },
      { title: '2,500 Trades', icon: '👑', value: `${metrics.tradeCount}/2500`, achieved: metrics.tradeCount >= 2500, category: 'Volume' },

      // P&L milestones
      { title: '$500 Total P&L', icon: '💵', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 500, category: 'P&L' },
      { title: '$1K Total P&L', icon: '💰', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 1000, category: 'P&L' },
      { title: '$2.5K Total P&L', icon: '💰', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 2500, category: 'P&L' },
      { title: '$5K Total P&L', icon: '💎', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 5000, category: 'P&L' },
      { title: '$10K Total P&L', icon: '💎', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 10000, category: 'P&L' },
      { title: '$25K Total P&L', icon: '🚀', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 25000, category: 'P&L' },
      { title: '$50K Total P&L', icon: '🚀', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 50000, category: 'P&L' },
      { title: '$100K Total P&L', icon: '🏦', value: `$${metrics.totalPnl.toFixed(0)}`, achieved: metrics.totalPnl >= 100000, category: 'P&L' },
      { title: '$1K Single Win', icon: '🎰', value: `${bigWins} trades`, achieved: bigWins >= 1, category: 'P&L' },
      { title: '10x $1K Wins', icon: '🎰', value: `${bigWins}/10`, achieved: bigWins >= 10, category: 'P&L' },
      { title: '$5K Single Win', icon: '💥', value: `${hugWins} trades`, achieved: hugWins >= 1, category: 'P&L' },

      // Win rate milestones
      { title: '45% Win Rate', icon: '📈', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 45, category: 'Win Rate' },
      { title: '50% Win Rate', icon: '📈', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 50, category: 'Win Rate' },
      { title: '55% Win Rate', icon: '📈', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 55, category: 'Win Rate' },
      { title: '60% Win Rate', icon: '🎯', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 60, category: 'Win Rate' },
      { title: '65% Win Rate', icon: '🎯', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 65, category: 'Win Rate' },
      { title: '70% Win Rate', icon: '🏅', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 70, category: 'Win Rate' },
      { title: '75% Win Rate', icon: '🥇', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 75, category: 'Win Rate' },
      { title: '80% Win Rate', icon: '👑', value: `${metrics.winRate.toFixed(1)}%`, achieved: metrics.winRate >= 80, category: 'Win Rate' },

      // Streak milestones
      { title: '3 Win Streak', icon: '🔥', value: `${metrics.maxStreak} best`, achieved: metrics.maxStreak >= 3, category: 'Streaks' },
      { title: '5 Win Streak', icon: '🔥', value: `${metrics.maxStreak} best`, achieved: metrics.maxStreak >= 5, category: 'Streaks' },
      { title: '7 Win Streak', icon: '⚡', value: `${metrics.maxStreak} best`, achieved: metrics.maxStreak >= 7, category: 'Streaks' },
      { title: '10 Win Streak', icon: '💥', value: `${metrics.maxStreak} best`, achieved: metrics.maxStreak >= 10, category: 'Streaks' },
      { title: '15 Win Streak', icon: '🏆', value: `${metrics.maxStreak} best`, achieved: metrics.maxStreak >= 15, category: 'Streaks' },
      { title: '5 Green Days', icon: '📗', value: `${greenDays}/5`, achieved: greenDays >= 5, category: 'Streaks' },
      { title: '10 Green Days', icon: '📗', value: `${greenDays}/10`, achieved: greenDays >= 10, category: 'Streaks' },
      { title: '25 Green Days', icon: '📗', value: `${greenDays}/25`, achieved: greenDays >= 25, category: 'Streaks' },
      { title: '50 Green Days', icon: '🌟', value: `${greenDays}/50`, achieved: greenDays >= 50, category: 'Streaks' },

      // Profit factor milestones
      { title: 'PF > 1.0', icon: '📊', value: metrics.pf === Infinity ? '∞' : metrics.pf.toFixed(2), achieved: metrics.pf >= 1.0, category: 'Quality' },
      { title: 'PF > 1.5', icon: '📊', value: metrics.pf === Infinity ? '∞' : metrics.pf.toFixed(2), achieved: metrics.pf >= 1.5, category: 'Quality' },
      { title: 'PF > 2.0', icon: '🎯', value: metrics.pf === Infinity ? '∞' : metrics.pf.toFixed(2), achieved: metrics.pf >= 2.0, category: 'Quality' },
      { title: 'PF > 3.0', icon: '💎', value: metrics.pf === Infinity ? '∞' : metrics.pf.toFixed(2), achieved: metrics.pf >= 3.0, category: 'Quality' },
      { title: 'PF > 5.0', icon: '👑', value: metrics.pf === Infinity ? '∞' : metrics.pf.toFixed(2), achieved: metrics.pf >= 5.0, category: 'Quality' },
      { title: 'Avg RR > 1.0', icon: '⚖️', value: avgRR.toFixed(2), achieved: avgRR >= 1.0, category: 'Quality' },
      { title: 'Avg RR > 2.0', icon: '⚖️', value: avgRR.toFixed(2), achieved: avgRR >= 2.0, category: 'Quality' },
      { title: 'Avg RR > 3.0', icon: '⚖️', value: avgRR.toFixed(2), achieved: avgRR >= 3.0, category: 'Quality' },

      // Discipline milestones
      { title: '<20% Mistakes', icon: '🛡️', value: `${metrics.mistakeRate.toFixed(1)}%`, achieved: metrics.mistakeRate < 20 && metrics.tradeCount > 0, category: 'Discipline' },
      { title: '<15% Mistakes', icon: '🛡️', value: `${metrics.mistakeRate.toFixed(1)}%`, achieved: metrics.mistakeRate < 15 && metrics.tradeCount > 0, category: 'Discipline' },
      { title: '<10% Mistakes', icon: '✅', value: `${metrics.mistakeRate.toFixed(1)}%`, achieved: metrics.mistakeRate < 10 && metrics.tradeCount > 0, category: 'Discipline' },
      { title: '<5% Mistakes', icon: '🏆', value: `${metrics.mistakeRate.toFixed(1)}%`, achieved: metrics.mistakeRate < 5 && metrics.tradeCount > 0, category: 'Discipline' },
      { title: '0% Mistakes', icon: '💎', value: `${metrics.mistakeRate.toFixed(1)}%`, achieved: metrics.mistakeRate === 0 && metrics.tradeCount > 0, category: 'Discipline' },
      { title: '50% A/A+ Setups', icon: '🎖️', value: `${metrics.tradeCount ? ((aSetups / metrics.tradeCount) * 100).toFixed(0) : 0}%`, achieved: metrics.tradeCount > 0 && (aSetups / metrics.tradeCount) >= 0.5, category: 'Discipline' },
      { title: '75% A/A+ Setups', icon: '🏅', value: `${metrics.tradeCount ? ((aSetups / metrics.tradeCount) * 100).toFixed(0) : 0}%`, achieved: metrics.tradeCount > 0 && (aSetups / metrics.tradeCount) >= 0.75, category: 'Discipline' },

      // Diversity milestones
      { title: '5 Symbols Traded', icon: '🌐', value: `${uniqueSymbols} symbols`, achieved: uniqueSymbols >= 5, category: 'Diversity' },
      { title: '10 Symbols Traded', icon: '🌐', value: `${uniqueSymbols} symbols`, achieved: uniqueSymbols >= 10, category: 'Diversity' },
      { title: '25 Symbols Traded', icon: '🌍', value: `${uniqueSymbols} symbols`, achieved: uniqueSymbols >= 25, category: 'Diversity' },
      { title: '3 Strategies Used', icon: '🧠', value: `${uniqueStrategies} strats`, achieved: uniqueStrategies >= 3, category: 'Diversity' },
      { title: '5 Strategies Used', icon: '🧠', value: `${uniqueStrategies} strats`, achieved: uniqueStrategies >= 5, category: 'Diversity' },
      { title: '3 Sectors Traded', icon: '🏗️', value: `${uniqueSectors} sectors`, achieved: uniqueSectors >= 3, category: 'Diversity' },
      { title: '5 Sectors Traded', icon: '🏗️', value: `${uniqueSectors} sectors`, achieved: uniqueSectors >= 5, category: 'Diversity' },
      { title: 'Options Trader', icon: '📋', value: `${optionTrades} options`, achieved: optionTrades >= 10, category: 'Diversity' },
      { title: 'Equity Trader', icon: '📋', value: `${equityTrades} equities`, achieved: equityTrades >= 10, category: 'Diversity' },
      { title: 'Short Seller', icon: '📉', value: `${shortTrades} shorts`, achieved: shortTrades >= 5, category: 'Diversity' },
      { title: 'Long Specialist', icon: '📈', value: `${longTrades} longs`, achieved: longTrades >= 25, category: 'Diversity' },

      // Journaling milestones
      { title: 'First Note', icon: '📝', value: `${notedTrades} noted`, achieved: notedTrades >= 1, category: 'Journaling' },
      { title: '25 Notes Written', icon: '📝', value: `${notedTrades}/25`, achieved: notedTrades >= 25, category: 'Journaling' },
      { title: '50 Notes Written', icon: '📓', value: `${notedTrades}/50`, achieved: notedTrades >= 50, category: 'Journaling' },
      { title: '100 Notes Written', icon: '📓', value: `${notedTrades}/100`, achieved: notedTrades >= 100, category: 'Journaling' },
      { title: '50% Journaled', icon: '📖', value: `${metrics.journalPct.toFixed(0)}%`, achieved: metrics.journalPct >= 50, category: 'Journaling' },
      { title: '75% Journaled', icon: '📖', value: `${metrics.journalPct.toFixed(0)}%`, achieved: metrics.journalPct >= 75, category: 'Journaling' },
      { title: '100% Journaled', icon: '🏆', value: `${metrics.journalPct.toFixed(0)}%`, achieved: metrics.journalPct >= 100 && metrics.tradeCount > 0, category: 'Journaling' },
      { title: '10 Tagged Trades', icon: '🏷️', value: `${taggedTrades}/10`, achieved: taggedTrades >= 10, category: 'Journaling' },
      { title: '50 Tagged Trades', icon: '🏷️', value: `${taggedTrades}/50`, achieved: taggedTrades >= 50, category: 'Journaling' },

      // Experience milestones
      { title: '5 Trading Days', icon: '📅', value: `${totalDays} days`, achieved: totalDays >= 5, category: 'Experience' },
      { title: '20 Trading Days', icon: '📅', value: `${totalDays} days`, achieved: totalDays >= 20, category: 'Experience' },
      { title: '50 Trading Days', icon: '📅', value: `${totalDays} days`, achieved: totalDays >= 50, category: 'Experience' },
      { title: '100 Trading Days', icon: '📆', value: `${totalDays} days`, achieved: totalDays >= 100, category: 'Experience' },
      { title: '250 Trading Days', icon: '📆', value: `${totalDays} days`, achieved: totalDays >= 250, category: 'Experience' },
    ];
    return list;
  }, [metrics, trades]);

  const achievedCount = milestones.filter(m => m.achieved).length;

  // Overall score
  const overallScore = useMemo(() => {
    const scores = goals.map(g => getProgress(g).pct);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }, [goals, metrics]);

  return (
    <div>
      <div className="flex justify-end items-center gap-3 mb-4">
        <ViewHeader />
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-mono uppercase font-bold hover:opacity-90 transition-opacity">
          <Plus className="w-3 h-3" /> New Goal
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Overall Score', value: `${overallScore.toFixed(0)}%`, valueClass: overallScore >= 70 ? 'text-positive' : overallScore >= 40 ? 'text-accent' : 'text-negative', type: overallScore >= 70 ? 'positive' as const : undefined },
          { label: 'Active Goals', value: String(goals.length) },
          { label: 'Milestones', value: `${achievedCount}/${milestones.length}`, change: `${((achievedCount / milestones.length) * 100).toFixed(0)}% unlocked`, type: 'positive' as const },
          { label: 'Month P&L', value: `${metrics.monthPnl >= 0 ? '+' : ''}$${metrics.monthPnl.toFixed(0)}`, valueClass: metrics.monthPnl >= 0 ? 'text-positive' : 'text-negative' },
          { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%`, valueClass: metrics.winRate >= 50 ? 'text-positive' : 'text-negative' },
          { label: 'Mistake Rate', value: `${metrics.mistakeRate.toFixed(1)}%`, valueClass: metrics.mistakeRate <= 10 ? 'text-positive' : 'text-negative' },
        ].map((s, i) => (
          <div key={i} className={`bg-card border border-border p-3 relative ${
            s.type === 'positive' ? 'stat-bar-positive-top' : 'stat-bar-accent-top'
          }`}>
            <div className="text-data-muted text-[10px] uppercase tracking-wide mb-1 font-body">{s.label}</div>
            <div className={`text-lg font-bold font-mono ${s.valueClass || ''}`}>{s.value}</div>
            {s.change && <div className="text-[10px] text-muted-foreground font-body">{s.change}</div>}
          </div>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Active Goals ({goals.length})</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {goals.map(goal => {
          const progress = getProgress(goal);
          const isComplete = progress.pct >= 100;
          const isEditing = editingId === goal.id;

          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              isComplete={isComplete}
              isEditing={isEditing}
              onEdit={() => setEditingId(goal.id)}
              onSave={(updates) => updateGoal(goal.id, updates)}
              onCancel={() => setEditingId(null)}
              onDelete={() => deleteGoal(goal.id)}
            />
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="bg-card border border-border p-8 text-center mb-6">
          <div className="text-muted-foreground text-[11px] font-mono mb-2">No goals set yet</div>
          <button onClick={() => setShowAddModal(true)} className="text-accent text-[10px] font-mono hover:underline">+ Create your first goal</button>
        </div>
      )}

      {/* Milestones */}
      {/* Milestones */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <h2 className="text-[13px] text-accent uppercase tracking-wider font-mono">Milestones ({achievedCount}/{milestones.length})</h2>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['All', ...Array.from(new Set(milestones.map(m => m.category)))].map(cat => {
          const count = cat === 'All' ? achievedCount : milestones.filter(m => m.category === cat && m.achieved).length;
          const total = cat === 'All' ? milestones.length : milestones.filter(m => m.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setMilestoneFilter(cat)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                milestoneFilter === cat
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-card border-border text-muted-foreground hover:border-accent/50'
              }`}
            >
              {cat} ({count}/{total})
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2">
        {milestones.filter(m => milestoneFilter === 'All' || m.category === milestoneFilter).map((m, i) => (
          <div key={i} className={`border p-2.5 transition-colors ${
            m.achieved
              ? 'bg-positive/5 border-positive/30'
              : 'bg-card border-border opacity-50'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm flex-shrink-0">{m.icon}</span>
              <span className={`text-[10px] font-mono font-bold ${m.achieved ? 'text-positive' : 'text-muted-foreground'}`}>{m.title}</span>
            </div>
            <div className="text-[9px] font-mono text-muted-foreground pl-[22px]">{m.value}</div>
            <div className="text-[8px] font-mono text-muted-foreground/50 pl-[22px] mt-0.5">{m.category}</div>
          </div>
        ))}
      </div>

      {showAddModal && <AddGoalModal onClose={() => setShowAddModal(false)} onAdd={addGoal} />}
    </div>
  );
}

function GoalCard({ goal, progress, isComplete, isEditing, onEdit, onSave, onCancel, onDelete }: {
  goal: CustomGoal; progress: { pct: number; current: string; target: string; isNegativeMetric: boolean };
  isComplete: boolean; isEditing: boolean;
  onEdit: () => void; onSave: (u: Partial<CustomGoal>) => void; onCancel: () => void; onDelete: () => void;
}) {
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editTarget, setEditTarget] = useState(String(goal.target));
  const [editDesc, setEditDesc] = useState(goal.description);

  useEffect(() => {
    setEditTitle(goal.title);
    setEditTarget(String(goal.target));
    setEditDesc(goal.description);
  }, [goal, isEditing]);

  const barColor = isComplete ? 'bg-positive' : progress.isNegativeMetric ? 'bg-negative' : progress.pct >= 70 ? 'bg-positive' : progress.pct >= 40 ? 'bg-accent' : 'bg-negative';

  return (
    <div className={`bg-card border ${isComplete ? 'border-positive/30' : 'border-border'} p-3`}>
      {isEditing ? (
        <div className="space-y-2">
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-mono focus:outline-none focus:border-accent" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Target Value</label>
              <input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)}
                className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Type</label>
              <div className="px-2 py-1.5 bg-surface-elevated border border-border text-[10px] font-mono text-muted-foreground">{goalTypeLabel(goal.type)}</div>
            </div>
          </div>
          <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description..."
            className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-body focus:outline-none focus:border-accent" />
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-2 py-1 text-[9px] font-mono border border-border text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={() => onSave({ title: editTitle, target: parseFloat(editTarget) || goal.target, description: editDesc })}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono bg-accent text-accent-foreground hover:opacity-90">
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                {isComplete ? <Trophy className="w-3.5 h-3.5 text-positive" /> : <Target className="w-3.5 h-3.5 text-accent" />}
                <strong className={`text-[11px] font-mono ${isComplete ? 'text-positive' : 'text-accent'}`}>{goal.title}</strong>
              </div>
              <div className="text-[9px] text-muted-foreground font-body mt-0.5 pl-5">{goal.description}</div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`font-bold text-[12px] font-mono ${isComplete ? 'text-positive' : progress.isNegativeMetric ? 'text-negative' : progress.pct >= 70 ? 'text-positive' : 'text-accent'}`}>
                {progress.pct.toFixed(0)}%
              </span>
              <button onClick={onEdit} className="p-1 text-muted-foreground hover:text-accent transition-colors">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-negative transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="h-2.5 bg-surface-elevated border border-border mb-2">
            <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.max(0, Math.min(100, progress.pct))}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-muted-foreground">Current: <span className="text-foreground">{progress.current}</span></span>
            <span className="text-muted-foreground">Target: <span className="text-foreground">{progress.target}</span></span>
          </div>
        </>
      )}
    </div>
  );
}

function goalTypeLabel(type: GoalType): string {
  const labels: Record<GoalType, string> = {
    pnl_monthly: 'Monthly P&L', pnl_weekly: 'Weekly P&L', pnl_total: 'Total P&L',
    win_rate: 'Win Rate %', mistake_rate: 'Mistake Rate %', trade_count: 'Trade Count',
    journal_pct: 'Journal %', profit_factor: 'Profit Factor', max_loss: 'Max Daily Loss',
    win_streak: 'Win Streak', custom_pct: 'Custom %',
  };
  return labels[type] || type;
}

function AddGoalModal({ onClose, onAdd }: { onClose: () => void; onAdd: (g: CustomGoal) => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('pnl_monthly');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !target) return;
    onAdd({
      id: String(Date.now()),
      title: title.trim(),
      type,
      target: parseFloat(target),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    });
  };

  const typeOptions: { value: GoalType; label: string; hint: string }[] = [
    { value: 'pnl_monthly', label: 'Monthly P&L', hint: 'Target dollar amount for the month' },
    { value: 'pnl_weekly', label: 'Weekly P&L', hint: 'Target dollar amount for the week' },
    { value: 'pnl_total', label: 'Total P&L', hint: 'Lifetime P&L target' },
    { value: 'win_rate', label: 'Win Rate', hint: 'Target win rate percentage' },
    { value: 'mistake_rate', label: 'Mistake Rate', hint: 'Keep mistakes below this %' },
    { value: 'trade_count', label: 'Trade Count', hint: 'Total number of trades' },
    { value: 'journal_pct', label: 'Journal Coverage', hint: '% of trades with notes' },
    { value: 'profit_factor', label: 'Profit Factor', hint: 'Gross wins / gross losses' },
    { value: 'max_loss', label: 'Max Daily Loss', hint: 'Keep worst day under this $' },
    { value: 'win_streak', label: 'Win Streak', hint: 'Consecutive winning trades' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={onClose}>
      <div className="bg-card border border-border p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-accent text-[12px] font-mono font-bold uppercase">Create New Goal</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Goal Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hit $10K Monthly"
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Goal Type *</label>
            <select value={type} onChange={e => setType(e.target.value as GoalType)}
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono">
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label} — {o.hint}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Target Value *</label>
            <input type="number" value={target} onChange={e => setTarget(e.target.value)}
              placeholder={type.includes('pnl') || type === 'max_loss' ? '5000' : type.includes('rate') || type.includes('pct') ? '65' : '100'}
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What this goal means to you..."
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[11px] font-body placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono border border-border text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSubmit} className="px-3 py-1.5 text-[10px] font-mono bg-accent text-accent-foreground hover:opacity-90">Create Goal</button>
        </div>
      </div>
    </div>
  );
}
