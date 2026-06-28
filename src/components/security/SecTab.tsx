import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, FileText } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface Filing {
  id: string;
  url: string;
  title: string;
  domain: string;
  seendate: string;
  formType?: string;
}

interface Props {
  ticker: string;
}

const FORM_COLORS: Record<string, string> = {
  '8-K':  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  '10-Q': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '10-K': 'bg-green-500/20 text-green-400 border-green-500/30',
};

function extractFormType(title: string, formType?: string): string {
  if (formType) return formType;
  const m = title.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : '—';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso.slice(0, 10); }
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

export default function SecTab({ ticker }: Props) {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ articles: Filing[]; error?: string }>('/api/market/news/sec', { ticker });
      if (data.error && !data.articles?.length) throw new Error(data.error);
      setFilings(data.articles ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load filings');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 overflow-y-auto h-full font-mono text-xs">
      <div className="flex items-center gap-2 border-b border-accent/30 pb-1 mb-3">
        <FileText size={11} className="text-accent" />
        <span className="text-[9px] text-accent font-bold uppercase tracking-widest">SEC Filings</span>
        <span className="text-[9px] text-muted-foreground">— {ticker}</span>
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-14 h-4 bg-surface-elevated rounded" />
              <div className="w-16 h-4 bg-surface-elevated rounded" />
              <div className="flex-1 h-4 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-[10px]">
          <span>Could not load filings</span>
          <button onClick={load} className="text-accent hover:underline">Retry</button>
        </div>
      )}

      {!loading && !error && filings.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-[10px]">
          No recent filings found for {ticker}
        </div>
      )}

      {!loading && !error && filings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1 pr-4 text-[9px] text-muted-foreground font-normal w-28">Date</th>
                <th className="text-left py-1 pr-4 text-[9px] text-muted-foreground font-normal w-16">Form</th>
                <th className="text-left py-1 text-[9px] text-muted-foreground font-normal">Title</th>
                <th className="py-1 w-6" />
              </tr>
            </thead>
            <tbody>
              {filings.map(f => {
                const form = extractFormType(f.title, f.formType);
                const colorClass = FORM_COLORS[form] ?? 'bg-surface-elevated text-muted-foreground border-border';
                return (
                  <tr key={f.id} className="border-b border-border/30 hover:bg-surface-elevated group">
                    <td className="py-1 pr-4 text-[9px] text-muted-foreground whitespace-nowrap">
                      {formatDate(f.seendate)}
                    </td>
                    <td className="py-1 pr-4">
                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold border rounded tracking-wider ${colorClass}`}>
                        {form}
                      </span>
                    </td>
                    <td className="py-1 text-[10px] text-foreground leading-tight">
                      {cleanTitle(f.title)}
                    </td>
                    <td className="py-1 pl-2">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 text-accent hover:text-accent/80 transition-opacity"
                        title="Open on EDGAR"
                      >
                        <ExternalLink size={10} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[9px] text-muted-foreground">
            Source: SEC EDGAR · Hover a row to open filing
          </p>
        </div>
      )}
    </div>
  );
}
