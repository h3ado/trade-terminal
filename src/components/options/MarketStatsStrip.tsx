// Top-of-page metrics strip: NET GEX/DEX/IV RANK/etc. + REGIME row.
interface Stat { label: string; value: string; tone?: "up" | "down" | "neutral" | "accent" | "vanna" | "charm" }
interface Props { ticker?: string; redact?: boolean }

const PRIMARY: Stat[] = [
  { label: "SPOT",       value: "$432.00", tone: "accent" },
  { label: "AVG IV",     value: "25.1%",   tone: "accent" },
  { label: "NET GEX",    value: "232.0M",  tone: "up" },
  { label: "NET DEX",    value: "282.0M",  tone: "up" },
  { label: "NET VANNA",  value: "15.8M",   tone: "vanna" },
  { label: "NET CHARM",  value: "46.3K",   tone: "charm" },
  { label: "P/C OI",     value: "0.95",    tone: "up" },
  { label: "P/C VOL",    value: "1.00",    tone: "neutral" },
];

const SECONDARY: Stat[] = [
  { label: "CALL WALL",  value: "$432",    tone: "up" },
  { label: "PUT WALL",   value: "$436",    tone: "down" },
  { label: "MAX PAIN",   value: "$432",    tone: "accent" },
  { label: "MAX Γ",      value: "$432",    tone: "accent" },
  { label: "REGIME",     value: "LONG Γ",  tone: "up" },
  { label: "PREMIUM",    value: "$1.2B",   tone: "up" },
  { label: "IV RANK",    value: "57%",     tone: "accent" },
  { label: "IV %ILE",    value: "75%",     tone: "accent" },
];

const TERTIARY: Stat[] = [
  { label: "GAMMA FLIP",  value: "$434",   tone: "accent" },
  { label: "RV 20D",      value: "17.3%",  tone: "up" },
  { label: "VRP",         value: "6.7",    tone: "up" },
  { label: "TOTAL OI",    value: "582.3K", tone: "neutral" },
  { label: "TOTAL VOL",   value: "182.3K", tone: "neutral" },
  { label: "0DTE SHARE",  value: "57%",    tone: "accent" },
];

const toneClass = (t: Stat["tone"]) => {
  switch (t) {
    case "up": return "text-up";
    case "down": return "text-down";
    case "accent": return "text-accent";
    case "vanna": return "text-[hsl(280_70%_65%)]";
    case "charm": return "text-[hsl(180_70%_55%)]";
    default: return "text-foreground";
  }
};

function Tile({ s, redact }: { s: Stat; redact?: boolean }) {
  return (
    <div className="card-terminal px-3 py-2 flex flex-col items-center justify-center min-w-0">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</div>
      <div className={`text-base font-mono font-bold tabular-nums ${toneClass(s.tone)}`}>{redact ? "••" : s.value}</div>
    </div>
  );
}

export default function MarketStatsStrip({ ticker = "SPY", redact = false }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
        {PRIMARY.map((s) => <Tile key={s.label} s={s} redact={redact} />)}
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
        {SECONDARY.map((s) => <Tile key={s.label} s={s} redact={redact} />)}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {TERTIARY.map((s) => <Tile key={s.label} s={s} redact={redact} />)}
      </div>
    </div>
  );
}
