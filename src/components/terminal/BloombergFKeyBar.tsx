// Bloomberg-style F-key bar. Bands match classic key colors (yellow=Govt, orange=Cmdty, etc.).
// Each key dispatches a CLI execute event so routing stays centralized in CommandLine.
import { useEffect } from 'react';

interface Key {
  fn: string;             // e.g. "F1"
  code: string;           // CLI code to fire, or '' for inert
  label: string;
  band: 'yellow' | 'orange' | 'blue' | 'green' | 'red' | 'pink' | 'cyan' | 'white' | 'amber';
}

// Color bands by Bloomberg convention. Single-source-of-truth here.
const BAND: Record<Key['band'], string> = {
  yellow: 'bg-[hsl(50,100%,55%)] text-black',
  orange: 'bg-[hsl(33,100%,50%)] text-black',
  blue:   'bg-[hsl(210,80%,55%)] text-black',
  green:  'bg-[hsl(140,60%,45%)] text-black',
  red:    'bg-[hsl(0,72%,51%)] text-white',
  pink:   'bg-[hsl(330,80%,65%)] text-black',
  cyan:   'bg-[hsl(185,70%,50%)] text-black',
  white:  'bg-[hsl(0,0%,90%)] text-black',
  amber:  'bg-[hsl(40,100%,55%)] text-black',
};

const KEYS: Key[] = [
  { fn: 'F1',  code: '',      label: 'HELP',  band: 'yellow' },
  { fn: 'F2',  code: 'WB',    label: 'GOVT',  band: 'yellow' },
  { fn: 'F3',  code: 'OPT',   label: 'CORP',  band: 'green' },
  { fn: 'F4',  code: 'MIST',  label: 'MTGE',  band: 'red' },
  { fn: 'F5',  code: 'PERF',  label: 'M-MKT', band: 'amber' },
  { fn: 'F6',  code: 'WEI',   label: 'EQTY',  band: 'orange' },
  { fn: 'F7',  code: 'GLCO',  label: 'CMDTY', band: 'orange' },
  { fn: 'F8',  code: 'GLOB',  label: 'INDX',  band: 'white' },
  { fn: 'F9',  code: 'FX',    label: 'CRNCY', band: 'pink' },
  { fn: 'F10', code: 'ACCT',  label: 'CLIENT',band: 'cyan' },
  { fn: 'F11', code: 'JRNL',  label: 'PEOPLE',band: 'blue' },
  { fn: 'F12', code: 'TOP',   label: 'NEWS',  band: 'blue' },
];

interface Props {
  onLaunchpad?: () => void;
}

export default function FunctionKeyBar({ onLaunchpad }: Props) {
  const fire = (code: string) => {
    if (!code) return;
    window.dispatchEvent(new CustomEvent('lovable:cli-execute', { detail: { code } }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only F2-F12 (avoid hijacking F1 which is browser help)
      const m = /^F(\d{1,2})$/.exec(e.key);
      if (!m) return;
      const n = parseInt(m[1], 10);
      if (n < 2 || n > 12) return;
      const k = KEYS.find(x => x.fn === e.key);
      if (k?.code) {
        e.preventDefault();
        fire(k.code);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex items-stretch gap-[1px] bg-surface-deep border-t border-border h-[22px] text-[9px] font-mono font-bold uppercase tracking-wider select-none">
      {KEYS.map(k => (
        <button
          key={k.fn}
          onClick={() => fire(k.code)}
          disabled={!k.code}
          className={`flex-1 px-1 flex items-center justify-center gap-1 transition-opacity ${
            k.code ? BAND[k.band] + ' hover:opacity-80' : 'bg-surface-elevated text-muted-foreground cursor-not-allowed opacity-60'
          }`}
          title={k.code ? `${k.fn} → ${k.code}` : `${k.fn} (unassigned)`}
        >
          <span className="opacity-70">{k.fn}</span>
          <span>{k.label}</span>
        </button>
      ))}
      <button
        onClick={onLaunchpad}
        className="px-2 flex items-center justify-center gap-1 bg-accent text-accent-foreground hover:opacity-80 transition-opacity"
        title="Launchpad — multi-panel workspace"
      >
        LP
      </button>
    </div>
  );
}
