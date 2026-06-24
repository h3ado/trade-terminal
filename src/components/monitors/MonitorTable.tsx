// Shared Bloomberg-style monitor table primitive: dense, mono, sharp-cornered.
import React, { ReactNode } from 'react';

export interface MonitorCol<T> {
  key: string;
  label: string;
  width?: string; // e.g. "w-20"
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
}

interface Props<T> {
  title: string;
  code: string;
  cols: MonitorCol<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey: (row: T, i: number) => string;
  sectionHeaders?: Array<{ afterIndex: number; label: string }>;
  ts?: number | null;
}

export default function MonitorTable<T>({
  title, code, cols, rows, loading, emptyText, rowKey, sectionHeaders, ts,
}: Props<T>) {
  const headerInsertAt = (i: number) =>
    sectionHeaders?.find(h => h.afterIndex === i - 1)?.label;

  return (
    <div className="flex flex-col h-full bg-background border border-border">
      <div className="flex items-center justify-between px-2 py-1 bg-surface-deep border-b border-accent">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">{code}</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-[9px] font-mono text-accent animate-pulse">LOADING…</span>}
          {ts && (
            <span className="text-[9px] font-mono text-muted-foreground">
              {new Date(ts).toLocaleTimeString('en-US', { hour12: false })}
            </span>
          )}
          <span className="text-[9px] font-mono text-muted-foreground">{rows.length} ROWS</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-surface-deep z-10">
            <tr className="border-b border-border">
              {cols.map(c => (
                <th
                  key={c.key}
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground ${
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                  } ${c.width ?? ''}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan={cols.length} className="px-2 py-4 text-center text-[10px] font-mono text-muted-foreground">{emptyText ?? 'No data'}</td></tr>
            )}
            {rows.map((r, i) => {
              const sec = headerInsertAt(i);
              const rk = rowKey(r, i);
              return (
                <React.Fragment key={rk}>
                  {sec && (
                    <tr>
                      <td colSpan={cols.length} className="px-2 py-0.5 bg-surface-elevated border-y border-border text-[9px] font-mono font-bold uppercase tracking-wider text-accent">
                        {sec}
                      </td>
                    </tr>
                  )}
                  <tr
                    className="border-b border-border/40 hover:bg-surface-elevated transition-colors"
                  >
                    {cols.map(c => (
                      <td
                        key={c.key}
                        className={`px-2 py-0.5 text-[11px] font-mono tabular-nums ${
                          c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {c.render(r)}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
