// Bloomberg-style sub-tab strip used inside individual CMDs.
import { ReactNode } from 'react';

interface TabDef { id: string; label: string; hint?: string; }

interface Props {
  tabs: ReadonlyArray<TabDef>;
  active: string;
  onChange: (id: any) => void;
  right?: ReactNode;
}

export default function CmdTabs({ tabs, active, onChange, right }: Props) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5">
      <div className="flex items-center gap-0 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            title={t.hint}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider border-r border-border transition-colors whitespace-nowrap
              ${active === t.id
                ? 'bg-accent text-background font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0 pl-2">{right}</div>}
    </div>
  );
}

