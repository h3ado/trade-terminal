// Per-workspace grid settings: columns, row height, gap.
import { useEffect, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { GridCfg } from '@/hooks/useLaunchpadState';

interface Props {
  cfg: GridCfg;
  onChange: (cfg: GridCfg) => void;
}

export default function GridSettingsPopover({ cfg, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const Row = ({ label, value, min, max, step = 1, suffix, onChange: oc }: {
    label: string; value: number; min: number; max: number; step?: number; suffix?: string;
    onChange: (v: number) => void;
  }) => (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-[10px] font-mono text-muted-foreground uppercase w-16">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => oc(Number(e.target.value))}
        className="flex-1 accent-[hsl(var(--accent))]"
      />
      <span className="text-[10px] font-mono text-accent w-10 text-right">{value}{suffix}</span>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 h-5 text-[10px] font-mono font-bold text-muted-foreground uppercase bg-surface-elevated border border-border hover:text-foreground transition-colors"
        title="Grid settings"
      >
        <Settings2 className="w-3 h-3" /> GRID
      </button>
      {open && (
        <div className="absolute top-6 right-0 z-50 w-[260px] bg-card border border-accent/60 shadow-2xl">
          <div className="px-2 py-1 text-[10px] font-mono font-bold text-accent uppercase border-b border-border bg-surface-deep">
            Grid Settings
          </div>
          <Row label="Columns"   value={cfg.cols}       min={6}  max={24} onChange={v => onChange({ ...cfg, cols: v })} />
          <Row label="Row H"     value={cfg.rowHeight}  min={16} max={64} suffix="px" onChange={v => onChange({ ...cfg, rowHeight: v })} />
          <Row label="Gap"       value={cfg.margin}     min={0}  max={12} suffix="px" onChange={v => onChange({ ...cfg, margin: v })} />
          <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground border-t border-border">
            Tiles rescale with column changes.
          </div>
        </div>
      )}
    </div>
  );
}
