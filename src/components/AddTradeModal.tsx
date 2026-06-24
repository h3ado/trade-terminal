import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { Trade, calcPnlForTrade } from '@/types/trade';
import { useTrades } from '@/contexts/TradeContext';
import { usePrivacy } from '@/contexts/PrivacyContext';

const DEFAULT_STRATEGIES = ['Day Trading', 'Swing Trading', 'Scalping', 'Options Trading', 'Breakout', 'VWAP Reversal', 'Earnings Play', 'Momentum', 'Mean Reversion', 'Gap Fill', 'Range Trading', 'Trend Following', 'Futures Spread', 'Carry Trade', 'Hedging', 'News Trading'];
const DEFAULT_MISTAKES = [
  'None', 'FOMO Entry', 'Revenge Trading', 'Moved Stop Loss', 'Over-Sized Position', 'Early Exit',
  'No Stop Loss', 'Chased Entry', 'Averaged Down', 'Ignored Rules', 'Held Through News',
  'Overtraded', 'Wrong Size', 'Didn\'t Take Profit', 'Traded Against Trend', 'Emotional Entry',
  'Pre-Market FOMO', 'Held Overnight', 'Ignored Volume', 'Too Many Tickers', 'Fat Finger',
  'Traded While Tired', 'Scaled In Wrong', 'Ignored Margin', 'Wrong Contract', 'Rolled Too Late',
];
const DEFAULT_SECTORS = ['Technology', 'Consumer', 'Healthcare', 'Financials', 'Energy', 'Industrials', 'Materials', 'Utilities', 'Real Estate', 'Communication', 'Indices', 'Crypto', 'Commodities', 'Forex', 'Bonds', 'Agriculture', 'Metals', 'Other'];
const MARKET_CONDITIONS = ['Trending Up', 'Trending Down', 'Ranging', 'Volatile', 'Low Volume', 'High Volume', 'Breakout', 'Choppy', 'News-Driven'];
const EMOTIONAL_STATES = ['Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'Frustrated', 'Focused', 'Distracted', 'Revenge', 'FOMO'];

const FUTURES_CONTRACTS: Record<string, { multiplier: number; tickSize: number; label: string }> = {
  'ES': { multiplier: 50, tickSize: 0.25, label: 'E-mini S&P 500' },
  'NQ': { multiplier: 20, tickSize: 0.25, label: 'E-mini Nasdaq' },
  'YM': { multiplier: 5, tickSize: 1, label: 'E-mini Dow' },
  'RTY': { multiplier: 50, tickSize: 0.1, label: 'E-mini Russell' },
  'MES': { multiplier: 5, tickSize: 0.25, label: 'Micro E-mini S&P' },
  'MNQ': { multiplier: 2, tickSize: 0.25, label: 'Micro E-mini Nasdaq' },
  'CL': { multiplier: 1000, tickSize: 0.01, label: 'Crude Oil' },
  'GC': { multiplier: 100, tickSize: 0.1, label: 'Gold' },
  'SI': { multiplier: 5000, tickSize: 0.005, label: 'Silver' },
  'ZB': { multiplier: 1000, tickSize: 0.03125, label: '30-Year Bond' },
  'ZN': { multiplier: 1000, tickSize: 0.015625, label: '10-Year Note' },
  '6E': { multiplier: 125000, tickSize: 0.00005, label: 'Euro FX' },
  'CUSTOM': { multiplier: 1, tickSize: 0.01, label: 'Custom' },
};

interface AddTradeModalProps {
  onClose: () => void;
}

export default function AddTradeModal({ onClose }: AddTradeModalProps) {
  const { trades, addTrade } = useTrades();
  const { activeAccountId } = usePrivacy();
  const [form, setForm] = useState({
    symbol: '', type: 'Equity' as Trade['type'], side: 'LONG' as Trade['side'],
    entry: '', exit: '', size: '', strategy: 'Day Trading', setup: 'B' as Trade['setup'],
    tags: '', notes: '', mistake: '', holdTime: '1h', sector: 'Other', fees: '1.50',
    leverage: '', contractSize: '', margin: '', commission: '', swap: '',
    strikePrice: '', expiry: '', optionPremium: '', iv: '', delta: '', theta: '',
    contractMultiplier: '100',
    stopLoss: '', takeProfit: '', riskAmount: '', riskPercent: '',
    slippage: '', maxDrawdown: '', maxRunup: '',
    emotionalState: '', marketCondition: '',
    futuresContract: '',
  });

  const dynamicStrategies = useMemo(() => {
    const fromTrades = new Set(trades.map(t => t.strategy));
    const all = new Set([...DEFAULT_STRATEGIES, ...fromTrades]);
    return Array.from(all).sort();
  }, [trades]);

  const dynamicMistakes = useMemo(() => {
    const fromTrades = new Set(trades.map(t => t.mistake).filter(Boolean) as string[]);
    const custom = (() => { try { const s = localStorage.getItem('custom-mistake-types'); return s ? Object.keys(JSON.parse(s)) : []; } catch { return []; } })();
    const all = new Set([...DEFAULT_MISTAKES, ...fromTrades, ...custom]);
    return ['None', ...Array.from(all).filter(m => m !== 'None').sort()];
  }, [trades]);

  const dynamicSectors = useMemo(() => {
    const fromTrades = new Set(trades.map(t => t.sector));
    const all = new Set([...DEFAULT_SECTORS, ...fromTrades]);
    return Array.from(all).sort();
  }, [trades]);

  const dynamicTags = useMemo(() => {
    const allTags = new Set(trades.flatMap(t => t.tags));
    return Array.from(allTags).sort();
  }, [trades]);

  useEffect(() => {
    if (form.type === 'Futures' && form.futuresContract && FUTURES_CONTRACTS[form.futuresContract]) {
      const spec = FUTURES_CONTRACTS[form.futuresContract];
      setForm(f => ({ ...f, contractSize: String(spec.multiplier) }));
    }
  }, [form.futuresContract, form.type]);

  useEffect(() => {
    if (form.type === 'Futures' && form.symbol) {
      const sym = form.symbol.toUpperCase();
      const match = Object.keys(FUTURES_CONTRACTS).find(k => sym.startsWith(k));
      if (match && match !== form.futuresContract) {
        setForm(f => ({ ...f, futuresContract: match }));
      }
    }
  }, [form.symbol, form.type]);

  const handleSubmit = () => {
    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const size = parseInt(form.size);
    if (!form.symbol || isNaN(entry) || isNaN(exit) || isNaN(size)) return;

    const leverage = parseFloat(form.leverage) || undefined;
    const contractSize = parseFloat(form.contractSize) || undefined;
    const contractMultiplier = parseFloat(form.contractMultiplier) || 100;

    const pnl = calcPnlForTrade({
      side: form.side, entry, exit, size,
      type: form.type, leverage, contractSize, contractMultiplier,
    });

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const stopLoss = parseFloat(form.stopLoss) || undefined;
    const riskAmount = parseFloat(form.riskAmount) || (stopLoss ? Math.abs(entry - stopLoss) * size * (contractSize || (form.type === 'Option' ? contractMultiplier : 1)) : undefined);
    const rr = riskAmount ? `${(Math.abs(pnl) / riskAmount).toFixed(1)}:1` : `${(Math.abs(pnl) / (Math.abs(pnl) * 0.5 || 1)).toFixed(1)}:1`;

    addTrade({
      accountId: activeAccountId,
      date, symbol: form.symbol.toUpperCase(), type: form.type, side: form.side,
      entry, exit, size, pnl, rr,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      strategy: form.strategy, notes: form.notes, setup: form.setup,
      mistake: form.mistake === 'None' ? undefined : form.mistake || undefined,
      holdTime: form.holdTime, fees: parseFloat(form.fees) || 0,
      sector: form.sector,
      leverage,
      contractSize,
      margin: parseFloat(form.margin) || undefined,
      commission: parseFloat(form.commission) || undefined,
      swap: parseFloat(form.swap) || undefined,
      strikePrice: parseFloat(form.strikePrice) || undefined,
      expiry: form.expiry || undefined,
      optionPremium: parseFloat(form.optionPremium) || undefined,
      iv: parseFloat(form.iv) || undefined,
      delta: parseFloat(form.delta) || undefined,
      theta: parseFloat(form.theta) || undefined,
      contractMultiplier: form.type === 'Option' ? contractMultiplier : undefined,
      stopLoss,
      takeProfit: parseFloat(form.takeProfit) || undefined,
      riskAmount,
      riskPercent: parseFloat(form.riskPercent) || undefined,
      slippage: parseFloat(form.slippage) || undefined,
      maxDrawdown: parseFloat(form.maxDrawdown) || undefined,
      maxRunup: parseFloat(form.maxRunup) || undefined,
      emotionalState: form.emotionalState || undefined,
      marketCondition: form.marketCondition || undefined,
    });
    onClose();
  };

  const pnlPreview = useMemo(() => {
    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const size = parseInt(form.size);
    if (isNaN(entry) || isNaN(exit) || isNaN(size)) return null;
    return calcPnlForTrade({
      side: form.side, entry, exit, size,
      type: form.type,
      leverage: parseFloat(form.leverage) || undefined,
      contractSize: parseFloat(form.contractSize) || undefined,
      contractMultiplier: parseFloat(form.contractMultiplier) || 100,
    });
  }, [form.entry, form.exit, form.size, form.side, form.type, form.leverage, form.contractSize, form.contractMultiplier]);

  const riskPreview = useMemo(() => {
    const entry = parseFloat(form.entry);
    const sl = parseFloat(form.stopLoss);
    const tp = parseFloat(form.takeProfit);
    const size = parseInt(form.size);
    if (isNaN(entry) || isNaN(size)) return null;
    const cs = parseFloat(form.contractSize) || (form.type === 'Option' ? (parseFloat(form.contractMultiplier) || 100) : 1);
    const risk = !isNaN(sl) ? Math.abs(entry - sl) * size * cs : null;
    const reward = !isNaN(tp) ? Math.abs(tp - entry) * size * cs : null;
    const rrRatio = risk && reward ? (reward / risk).toFixed(1) : null;
    return { risk, reward, rrRatio };
  }, [form.entry, form.stopLoss, form.takeProfit, form.size, form.type, form.contractSize, form.contractMultiplier]);

  const isOptions = form.type === 'Option';
  const isFutures = form.type === 'Futures';
  const isCFD = form.type === 'CFD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={onClose}>
      <div className="bg-card border border-border p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-accent text-[12px] font-mono font-bold uppercase">Add New Trade</h3>
          <div className="flex items-center gap-3">
            {pnlPreview !== null && (
              <span className={`text-[11px] font-mono font-bold ${pnlPreview >= 0 ? 'text-positive' : 'text-negative'}`}>
                P&L: {pnlPreview >= 0 ? '+' : ''}${pnlPreview.toFixed(2)}
              </span>
            )}
            {riskPreview?.rrRatio && (
              <span className="text-[10px] font-mono text-muted-foreground">
                R:R {riskPreview.rrRatio}:1
              </span>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Section: Instrument */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Instrument</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ModalInput label="Symbol" value={form.symbol} onChange={v => setForm(f => ({ ...f, symbol: v }))} placeholder={isFutures ? 'ES, NQ, CL...' : 'SPY'} />
            <ModalSelect label="Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v as any }))} options={['Equity', 'Option', 'Futures', 'CFD']} />
            <ModalSelect label="Side" value={form.side} onChange={v => setForm(f => ({ ...f, side: v as any }))}
              options={isOptions ? ['CALL', 'PUT'] : ['LONG', 'SHORT']} />
            <SearchableSelect label="Sector" value={form.sector} onChange={v => setForm(f => ({ ...f, sector: v }))} options={dynamicSectors} allowCustom />
          </div>
        </div>

        {/* Section: Instrument Details (conditional) */}
        {(isOptions || isFutures || isCFD) && (
          <div className="mb-3">
            <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">
              {isOptions ? 'Options Details' : isFutures ? 'Futures Details' : 'CFD Details'}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {isOptions && (
                <>
                  <ModalInput label="Strike Price" value={form.strikePrice} onChange={v => setForm(f => ({ ...f, strikePrice: v }))} placeholder="450.00" type="number" />
                  <ModalInput label="Expiry Date" value={form.expiry} onChange={v => setForm(f => ({ ...f, expiry: v }))} placeholder="2024-12-20" />
                  <ModalInput label="Premium" value={form.optionPremium} onChange={v => setForm(f => ({ ...f, optionPremium: v }))} placeholder="5.50" type="number" />
                  <ModalInput label="Contract Multiplier" value={form.contractMultiplier} onChange={v => setForm(f => ({ ...f, contractMultiplier: v }))} placeholder="100" type="number" />
                  <ModalInput label="IV %" value={form.iv} onChange={v => setForm(f => ({ ...f, iv: v }))} placeholder="25.5" type="number" />
                  <ModalInput label="Delta" value={form.delta} onChange={v => setForm(f => ({ ...f, delta: v }))} placeholder="0.45" type="number" />
                  <ModalInput label="Theta" value={form.theta} onChange={v => setForm(f => ({ ...f, theta: v }))} placeholder="-0.05" type="number" />
                </>
              )}
              {isFutures && (
                <>
                  <ModalSelect label="Contract" value={form.futuresContract} onChange={v => setForm(f => ({ ...f, futuresContract: v }))}
                    options={Object.keys(FUTURES_CONTRACTS)} />
                  <ModalInput label="Contract Size" value={form.contractSize} onChange={v => setForm(f => ({ ...f, contractSize: v }))} placeholder="50" type="number" />
                  <ModalInput label="Margin Required" value={form.margin} onChange={v => setForm(f => ({ ...f, margin: v }))} placeholder="13200" type="number" />
                  <ModalInput label="Commission/Contract" value={form.commission} onChange={v => setForm(f => ({ ...f, commission: v }))} placeholder="2.25" type="number" />
                </>
              )}
              {isCFD && (
                <>
                  <ModalInput label="Leverage (x)" value={form.leverage} onChange={v => setForm(f => ({ ...f, leverage: v }))} placeholder="20" type="number" />
                  <ModalInput label="Margin Required" value={form.margin} onChange={v => setForm(f => ({ ...f, margin: v }))} placeholder="500" type="number" />
                  <ModalInput label="Swap/Funding" value={form.swap} onChange={v => setForm(f => ({ ...f, swap: v }))} placeholder="-1.50" type="number" />
                  <ModalInput label="Commission" value={form.commission} onChange={v => setForm(f => ({ ...f, commission: v }))} placeholder="7.00" type="number" />
                </>
              )}
            </div>
            {isFutures && form.futuresContract && FUTURES_CONTRACTS[form.futuresContract] && (
              <div className="mt-1.5 text-[9px] font-mono text-muted-foreground">
                {FUTURES_CONTRACTS[form.futuresContract].label} • ${FUTURES_CONTRACTS[form.futuresContract].multiplier}/pt • Tick: {FUTURES_CONTRACTS[form.futuresContract].tickSize}
              </div>
            )}
          </div>
        )}

        {/* Section: Execution */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Execution</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ModalInput label="Entry Price" value={form.entry} onChange={v => setForm(f => ({ ...f, entry: v }))} placeholder="0.00" type="number" />
            <ModalInput label="Exit Price" value={form.exit} onChange={v => setForm(f => ({ ...f, exit: v }))} placeholder="0.00" type="number" />
            <ModalInput label={isFutures ? 'Contracts' : isOptions ? 'Contracts' : 'Shares/Units'} value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="100" type="number" />
            <ModalInput label="Fees" value={form.fees} onChange={v => setForm(f => ({ ...f, fees: v }))} placeholder="1.50" type="number" />
            <ModalInput label="Slippage" value={form.slippage} onChange={v => setForm(f => ({ ...f, slippage: v }))} placeholder="0.02" type="number" />
          </div>
        </div>

        {/* Section: Risk Management */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Risk Management</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ModalInput label="Stop Loss" value={form.stopLoss} onChange={v => setForm(f => ({ ...f, stopLoss: v }))} placeholder="0.00" type="number" />
            <ModalInput label="Take Profit" value={form.takeProfit} onChange={v => setForm(f => ({ ...f, takeProfit: v }))} placeholder="0.00" type="number" />
            <ModalInput label="Risk Amount ($)" value={form.riskAmount} onChange={v => setForm(f => ({ ...f, riskAmount: v }))} placeholder="200" type="number" />
            <ModalInput label="Risk % of Acct" value={form.riskPercent} onChange={v => setForm(f => ({ ...f, riskPercent: v }))} placeholder="1.0" type="number" />
          </div>
          {riskPreview && (riskPreview.risk || riskPreview.reward) && (
            <div className="mt-1.5 flex gap-4 text-[9px] font-mono">
              {riskPreview.risk && <span className="text-negative">Risk: ${riskPreview.risk.toFixed(2)}</span>}
              {riskPreview.reward && <span className="text-positive">Reward: ${riskPreview.reward.toFixed(2)}</span>}
              {riskPreview.rrRatio && <span className="text-accent">R:R {riskPreview.rrRatio}:1</span>}
            </div>
          )}
        </div>

        {/* Section: Excursion */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Trade Excursion</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ModalInput label="Max Adverse Excursion" value={form.maxDrawdown} onChange={v => setForm(f => ({ ...f, maxDrawdown: v }))} placeholder="0.00" type="number" />
            <ModalInput label="Max Favorable Excursion" value={form.maxRunup} onChange={v => setForm(f => ({ ...f, maxRunup: v }))} placeholder="0.00" type="number" />
          </div>
        </div>

        {/* Section: Classification */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Classification</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <SearchableSelect label="Strategy" value={form.strategy} onChange={v => setForm(f => ({ ...f, strategy: v }))} options={dynamicStrategies} allowCustom />
            <ModalSelect label="Setup Grade" value={form.setup} onChange={v => setForm(f => ({ ...f, setup: v as any }))} options={['A+', 'A', 'B', 'C']} />
            <ModalInput label="Hold Time" value={form.holdTime} onChange={v => setForm(f => ({ ...f, holdTime: v }))} placeholder="1h" />
            <SearchableSelect label="Mistake" value={form.mistake || 'None'} onChange={v => setForm(f => ({ ...f, mistake: v === 'None' ? '' : v }))} options={dynamicMistakes} allowCustom />
          </div>
        </div>

        {/* Section: Context */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Market & Psychology</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ModalSelect label="Market Condition" value={form.marketCondition} onChange={v => setForm(f => ({ ...f, marketCondition: v }))}
              options={['', ...MARKET_CONDITIONS]} />
            <ModalSelect label="Emotional State" value={form.emotionalState} onChange={v => setForm(f => ({ ...f, emotionalState: v }))}
              options={['', ...EMOTIONAL_STATES]} />
          </div>
        </div>

        {/* Section: Tags & Notes */}
        <div className="mb-3">
          <div className="text-[9px] font-mono text-accent uppercase tracking-wider mb-2 pb-1 border-b border-border">Tags & Notes</div>
          <div className="mb-2">
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Tags</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {dynamicTags.slice(0, 20).map(tag => {
                const isSelected = form.tags.split(',').map(s => s.trim()).includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const current = form.tags.split(',').map(s => s.trim()).filter(Boolean);
                      const updated = isSelected ? current.filter(t => t !== tag) : [...current, tag];
                      setForm(f => ({ ...f, tags: updated.join(', ') }));
                    }}
                    className={`px-1.5 py-0.5 text-[9px] font-mono border transition-colors ${
                      isSelected ? 'bg-accent/20 border-accent text-accent' : 'border-border text-muted-foreground hover:border-accent/50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Or type: Swing, Breakout, ..."
              className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Trade notes, rationale, observations..."
              rows={2} className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-mono border border-border text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSubmit} className="px-3 py-1.5 text-[10px] font-mono bg-accent text-accent-foreground hover:opacity-90">Add Trade</button>
        </div>
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, placeholder = '', type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-accent" />
    </div>
  );
}

function ModalSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono focus:outline-none focus:border-accent">
        {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </div>
  );
}

function SearchableSelect({ label, value, onChange, options, allowCustom = false }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const showCustom = allowCustom && search && !options.some(o => o.toLowerCase() === search.toLowerCase());

  return (
    <div ref={ref} className="relative">
      <label className="text-[9px] font-mono text-muted-foreground uppercase block mb-0.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-2 py-1.5 bg-surface-elevated border border-border text-foreground text-[10px] font-mono text-left flex items-center justify-between focus:outline-none focus:border-accent"
      >
        <span className={value ? '' : 'text-muted-foreground'}>{value || 'Select...'}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-[60] top-full left-0 right-0 mt-0.5 bg-card border border-border shadow-lg max-h-48 overflow-hidden flex flex-col">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search or type new..."
            autoFocus
            className="px-2 py-1.5 bg-surface-elevated border-b border-border text-foreground text-[10px] font-mono placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="overflow-y-auto max-h-36">
            {filtered.map(o => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-2 py-1.5 text-[10px] font-mono hover:bg-accent/10 transition-colors ${
                  o === value ? 'bg-accent/20 text-accent' : 'text-foreground'
                }`}
              >
                {o}
              </button>
            ))}
            {showCustom && (
              <button
                onClick={() => { onChange(search); setOpen(false); setSearch(''); }}
                className="w-full text-left px-2 py-1.5 text-[10px] font-mono hover:bg-accent/10 text-accent border-t border-border"
              >
                <Plus className="w-3 h-3 inline mr-1" />Add "{search}"
              </button>
            )}
            {filtered.length === 0 && !showCustom && (
              <div className="px-2 py-2 text-[10px] font-mono text-muted-foreground text-center">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
