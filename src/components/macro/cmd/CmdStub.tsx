// Placeholder shell for a Bloomberg-style macro CMD screen.
// Each real CMD swaps this for its bespoke implementation.
interface Props {
  code: string;
  title: string;
  description: string;
}

export default function CmdStub({ code, title, description }: Props) {
  return (
    <div className="flex flex-col h-full bg-background border border-border">
      <div className="flex items-center justify-between px-2 py-1 bg-surface-deep border-b border-accent">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">{code}</span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">SCAFFOLD</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl text-center space-y-3">
          <div className="text-[10px] font-mono text-accent uppercase tracking-[0.2em]">{code} &lt;GO&gt;</div>
          <div className="text-lg font-mono font-bold text-foreground uppercase tracking-wider">{title}</div>
          <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">{description}</p>
          <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider pt-4">
            Screen scaffolded · implementation in progress
          </div>
        </div>
      </div>
    </div>
  );
}
