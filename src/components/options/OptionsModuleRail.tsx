// Top horizontal module nav — single Bloomberg breadcrumb row.
// CODE · LABEL pattern, orange underline on active, no chip backgrounds.
import { OptionsTab } from "@/types/trade";
import { optionsModules } from "@/config/options";

export interface ModuleDef {
  id: OptionsTab;
  code: string;
  label: string;
  group?: string;
}

export const OPTIONS_MODULES: ModuleDef[] = optionsModules;

interface Props {
  active: OptionsTab;
  onSelect: (id: OptionsTab) => void;
}

export default function OptionsModuleRail({ active, onSelect }: Props) {
  return (
    <nav className="bg-background border-b border-border px-2 flex gap-3 overflow-x-auto items-center h-6 flex-shrink-0">
      {OPTIONS_MODULES.map((m) => {
        const isActive = active === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            title={m.label}
            className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors flex-shrink-0
              ${isActive
                ? 'text-accent border-accent font-bold'
                : 'text-muted-foreground border-transparent hover:text-foreground'}`}
          >
            {m.code}
          </button>
        );
      })}
    </nav>
  );
}
