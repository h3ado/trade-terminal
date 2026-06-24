// Expiry filter chip strip for GEX cockpit.
const CHIPS = ["ALL", "0DTE", "WEEKLY", "MONTHLY", "QUARTERLY"] as const;
export type GexExpiryFilterKey = typeof CHIPS[number];

interface Props { value: GexExpiryFilterKey; onChange: (v: GexExpiryFilterKey) => void }

export default function GexExpiryFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mr-1">Expiry</span>
      {CHIPS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${
            value === c ? "border-accent text-accent bg-surface-elevated" : "border-border text-muted-foreground hover:border-accent hover:text-accent"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
