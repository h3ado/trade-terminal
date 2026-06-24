import { useState } from 'react';
import type { SecurityFundamentals, IncomeStatement } from '@/hooks/useSecurityData';

function fmtBig(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function fmtPct(n: number | null | undefined, isDecimal = true): string {
  if (n == null || !isFinite(n)) return '—';
  const pct = isDecimal ? n * 100 : n;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function margin(num: number | null, denom: number | null): string {
  if (num == null || denom == null || denom === 0) return '—';
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function pctClass(n: number | null | undefined, isDecimal = true): string {
  if (n == null) return 'text-foreground';
  const v = isDecimal ? n * 100 : n;
  return v >= 0 ? 'text-positive' : 'text-negative';
}

interface Props {
  fundamentals: SecurityFundamentals;
}

export default function FinancialsTab({ fundamentals }: Props) {
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const { financials } = fundamentals;
  const stmts: IncomeStatement[] = period === 'annual' ? financials.annualIncome : financials.quarterlyIncome;

  const cols = stmts.slice(0, 4);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full font-mono text-xs">
      {/* Key ratios TTM */}
      <section>
        <div className="flex items-center justify-between border-b border-accent/30 pb-1 mb-2">
          <span className="text-[9px] text-accent font-bold uppercase tracking-widest">Key Ratios (TTM)</span>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-1">
          <RatioCell label="Gross Margin"    value={`${financials.grossMargins != null ? (financials.grossMargins * 100).toFixed(1) : '—'}%`} />
          <RatioCell label="Op Margin"       value={`${financials.operatingMargins != null ? (financials.operatingMargins * 100).toFixed(1) : '—'}%`} />
          <RatioCell label="Net Margin"      value={`${financials.profitMargins != null ? (financials.profitMargins * 100).toFixed(1) : '—'}%`} />
          <RatioCell label="ROE"             value={`${financials.returnOnEquity != null ? (financials.returnOnEquity * 100).toFixed(1) : '—'}%`} />
          <RatioCell label="ROA"             value={`${financials.returnOnAssets != null ? (financials.returnOnAssets * 100).toFixed(1) : '—'}%`} />
          <RatioCell label="Free Cash Flow"  value={fmtBig(financials.freeCashflow)} />
          <RatioCell label="Rev Growth YoY"
            value={fmtPct(financials.revenueGrowth)}
            valueClass={pctClass(financials.revenueGrowth)}
          />
          <RatioCell label="EPS Growth YoY"
            value={fmtPct(financials.earningsGrowth)}
            valueClass={pctClass(financials.earningsGrowth)}
          />
          <RatioCell label="Total Debt"  value={fmtBig(financials.totalDebt)} />
          <RatioCell label="Cash & Eq."  value={fmtBig(financials.totalCash)} />
        </div>
      </section>

      {/* Income statement */}
      <section>
        <div className="flex items-center justify-between border-b border-accent/30 pb-1 mb-2">
          <span className="text-[9px] text-accent font-bold uppercase tracking-widest">Income Statement</span>
          <div className="flex gap-0.5">
            {(['annual', 'quarterly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${
                  period === p ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'annual' ? 'Annual' : 'Quarterly'}
              </button>
            ))}
          </div>
        </div>

        {cols.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">No income statement data available</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[9px] text-muted-foreground border-b border-border">
                <th className="text-left py-0.5 pr-3 font-normal w-36">Metric</th>
                {cols.map(s => (
                  <th key={s.endDate} className="text-right py-0.5 pr-2 font-normal">{s.endDate}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <IncomeRow label="Revenue"          rows={cols} field="totalRevenue" fmt={fmtBig} />
              <IncomeRow label="Gross Profit"     rows={cols} field="grossProfit"  fmt={fmtBig} />
              <IncomeRow label="Gross Margin"     rows={cols}
                fmt={() => ''}
                computed={cols.map(s => margin(s.grossProfit, s.totalRevenue))}
                isMargin
              />
              <IncomeRow label="Operating Inc."  rows={cols} field="operatingIncome" fmt={fmtBig} />
              <IncomeRow label="Op Margin"       rows={cols}
                fmt={() => ''}
                computed={cols.map(s => margin(s.operatingIncome, s.totalRevenue))}
                isMargin
              />
              <IncomeRow label="Net Income"      rows={cols} field="netIncome" fmt={fmtBig} />
              <IncomeRow label="Net Margin"      rows={cols}
                fmt={() => ''}
                computed={cols.map(s => margin(s.netIncome, s.totalRevenue))}
                isMargin
              />
              <IncomeRow label="EPS (Basic)"     rows={cols} field="basicEPS"
                fmt={n => n != null ? `$${n.toFixed(2)}` : '—'}
              />
              <IncomeRow label="EBITDA"          rows={cols} field="ebitda" fmt={fmtBig} />
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function RatioCell({ label, value, valueClass = 'text-foreground' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col py-1 border-b border-border/40">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function IncomeRow({
  label, rows, field, fmt, computed, isMargin,
}: {
  label: string;
  rows: IncomeStatement[];
  field?: keyof IncomeStatement;
  fmt: (n: number | null) => string;
  computed?: string[];
  isMargin?: boolean;
}) {
  return (
    <tr className={`border-b border-border/40 hover:bg-surface-elevated ${isMargin ? 'text-muted-foreground' : ''}`}>
      <td className="py-0.5 pr-3 text-[9px] text-muted-foreground">{label}</td>
      {rows.map((s, i) => {
        const val = computed ? computed[i] : fmt(field ? (s[field] as number | null) : null);
        return (
          <td key={i} className="py-0.5 pr-2 text-right text-[10px] font-semibold tabular-nums">
            {val ?? '—'}
          </td>
        );
      })}
    </tr>
  );
}
