// Bloomberg-style sub-tab strip — matches macro CmdTabs.
// Filled accent on active, sharp corners, mono, dense.
import { ReactNode } from "react";

interface SubTab { id: string; label: string }

interface Props {
  tabs: SubTab[];
  active: string;
  onChange: (id: string) => void;
  right?: ReactNode;
}

export default function OptionsSubTabs({ tabs, active, onChange, right }: Props) {
  return (
    <div className="flex items-center justify-between bg-surface-deep border-b border-border flex-shrink-0">
      <div className="flex items-center gap-0 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider border-r border-border transition-colors whitespace-nowrap
              ${active === t.id
                ? 'bg-accent text-background font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0 px-2">{right}</div>}
    </div>
  );
}
