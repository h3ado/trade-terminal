import { useNewsBrief } from '@/hooks/useNewsBrief';
import type { NewsArticle, NewsScope } from '@/hooks/useGdeltNews';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
  scope: NewsScope | 'cluster';
  value: string;
  headlines: NewsArticle[];
  autoOnMount?: boolean;
}

export default function AiBriefPanel({ scope, value, headlines, autoOnMount }: Props) {
  const { data, loading, error, generate, reset } = useNewsBrief();

  useEffect(() => {
    reset();
    if (autoOnMount && headlines.length > 0) generate(scope, value, headlines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, value]);

  return (
    <div className="border border-border bg-surface-deep">
      <div className="px-2 py-1 border-b border-border bg-surface-elevated flex items-center justify-between">
        <span className="text-[9px] font-mono text-accent uppercase font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Brief
        </span>
        {data?.riskScore !== null && data?.riskScore !== undefined && (
          <span className={`text-[9px] font-mono font-bold px-1.5 ${
            data.riskScore >= 7 ? 'bg-negative/30 text-negative' :
            data.riskScore >= 4 ? 'bg-accent/30 text-accent' :
            'bg-positive/20 text-positive'
          }`}>
            RISK {data.riskScore}/10
          </span>
        )}
      </div>

      {!data && !loading && !error && (
        <div className="p-3">
          <button
            disabled={headlines.length === 0}
            onClick={() => generate(scope, value, headlines)}
            className="w-full text-[10px] font-mono uppercase font-bold py-2 bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            Generate AI Brief ({headlines.length} headlines)
          </button>
          <p className="text-[9px] font-mono text-muted-foreground mt-2">
            Summarizes the current cluster via Lovable AI. Limit: 10 briefs/hour.
          </p>
        </div>
      )}

      {loading && (
        <div className="p-4 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Synthesizing brief…
        </div>
      )}

      {error && (
        <div className="p-3 text-[10px] font-mono text-negative flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 mt-0.5" />
          <div>
            {error.includes('rate_limit') ? 'Hourly brief limit reached. Try again later.'
              : error.includes('credits') ? 'AI credits exhausted. Add credits in Workspace settings.'
              : `Brief failed: ${error}`}
          </div>
        </div>
      )}

      {data?.brief && (
        <div className="p-3 space-y-2">
          <pre className="whitespace-pre-wrap text-[11px] font-mono leading-snug text-foreground">
            {data.brief}
          </pre>
          {data.citations.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-[9px] font-mono uppercase text-accent mb-1">Sources</div>
              <div className="flex flex-wrap gap-1">
                {data.citations.map((d) => (
                  <span key={d} className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-elevated text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => generate(scope, value, headlines)}
            className="text-[9px] font-mono uppercase text-accent hover:underline"
          >
            ↻ Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
