// Top horizontal module nav — single Bloomberg breadcrumb row.
// CODE · LABEL pattern, orange underline on active, no chip backgrounds.
import { OptionsTab } from "@/types/trade";

export interface ModuleDef {
  id: OptionsTab;
  code: string;
  label: string;
  group?: string;
}

export const OPTIONS_MODULES: ModuleDef[] = [
  { id: "dash",  code: "DASH",  label: "Dashboard",      group: "OVERVIEW" },
  { id: "omon",  code: "OMON",  label: "Options Matrix", group: "CHAIN" },
  { id: "gamma", code: "GAMMA", label: "Gamma Levels",   group: "POSITIONING" },
  { id: "gex",   code: "GEX",   label: "GEX Profile",    group: "POSITIONING" },
  { id: "dpi",   code: "DPI",   label: "Dealer Intel",   group: "POSITIONING" },
  { id: "ovme",  code: "OVME",  label: "Vol Surface",    group: "VOLATILITY" },
  { id: "maxp",  code: "MAXP",  label: "Max Pain",       group: "POSITIONING" },
  { id: "pay",   code: "PAY",   label: "Payoff Lab",     group: "STRATEGY" },
  { id: "flow",  code: "FLOW",  label: "Dealer Flow",    group: "FLOW" },
  { id: "sent",  code: "SENT",  label: "Sentiment",      group: "FLOW" },
  { id: "grk",   code: "GRK",   label: "Greeks Book",    group: "STRATEGY" },
  { id: "qscr",  code: "QSCR",  label: "Q-Scores",       group: "SCAN" },
  { id: "scan",  code: "SCAN",  label: "Screener",       group: "SCAN" },
  { id: "uoa",   code: "UOA",   label: "Unusual Flow",   group: "FLOW" },
  { id: "earn",  code: "EARN",  label: "Earnings Play",  group: "STRATEGY" },
  { id: "varb",  code: "VARB",  label: "Vol Arb Lab",    group: "VOLATILITY" },
];

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
