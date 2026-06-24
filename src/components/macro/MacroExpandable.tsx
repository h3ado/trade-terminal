import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

// Hook for managing expanded row state
export function useExpandableRows() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isExpanded = (id: string) => expandedRows.has(id);

  return { toggleRow, isExpanded };
}

// Expandable table row wrapper
interface ExpandableRowProps {
  id: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  cells: ReactNode;
  colSpan: number;
  detail: ReactNode;
  className?: string;
}

export function ExpandableRow({ id, isExpanded, onToggle, cells, colSpan, detail, className = '' }: ExpandableRowProps) {
  return (
    <>
      <tr
        onClick={() => onToggle(id)}
        className={`border-b border-grid-line cursor-pointer hover:bg-accent/5 transition-colors ${className}`}
      >
        {cells}
      </tr>
      {isExpanded && (
        <tr className="border-b border-grid-line">
          <td colSpan={colSpan} className="p-0">
            <div className="bg-surface-elevated/50 border-t border-accent/20 p-3 animate-in slide-in-from-top-1 duration-200">
              {detail}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Expand indicator icon for the first cell
export function ExpandIcon({ isExpanded }: { isExpanded: boolean }) {
  return isExpanded ? (
    <ChevronDown className="w-2.5 h-2.5 text-accent inline mr-1" />
  ) : (
    <ChevronRight className="w-2.5 h-2.5 text-muted-foreground inline mr-1" />
  );
}

// Reusable detail section components
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">{title}</div>
      {children}
    </div>
  );
}

export function DetailGrid({ children, cols = 3 }: { children: ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-1 lg:grid-cols-2' : cols === 4 ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
      {children}
    </div>
  );
}

export function DetailStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-border p-1.5">
      <div className="text-[8px] font-mono text-muted-foreground">{label}</div>
      <div className={`text-sm font-mono font-bold ${color || 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-[8px] font-mono text-muted-foreground">{sub}</div>}
    </div>
  );
}

// Mini sparkline chart for detail panels
export function DetailMiniChart({ data, dataKey, color = 'hsl(var(--accent))', height = 80, labelKey = 'label' }: {
  data: Record<string, any>[];
  dataKey: string;
  color?: string;
  height?: number;
  labelKey?: string;
}) {
  return (
    <ExpandableResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 7, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
        <YAxis tick={{ fontSize: 7, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} domain={['auto', 'auto']} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ExpandableResponsiveContainer>
  );
}

export function DetailMiniBar({ data, dataKey, color = 'hsl(var(--accent))', height = 80, labelKey = 'label' }: {
  data: Record<string, any>[];
  dataKey: string;
  color?: string;
  height?: number;
  labelKey?: string;
}) {
  return (
    <ExpandableResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 7, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
        <YAxis tick={{ fontSize: 7, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontFamily: 'monospace', fontSize: 9 }} />
        <Bar dataKey={dataKey} fill={color} />
      </BarChart>
    </ExpandableResponsiveContainer>
  );
}

// Key-value pairs for detail panel
export function DetailKV({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <div key={item.label} className="flex justify-between text-[9px] font-mono">
          <span className="text-muted-foreground">{item.label}</span>
          <span className={`font-bold ${item.color || 'text-foreground'}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
