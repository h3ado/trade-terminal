import { useEffect } from 'react';
import { COMMANDS } from '@/components/CommandLine';

const F_KEYS = [
  { fn: 'F1',  code: 'HELP',  label: 'Help — Terminal Keyboard Reference', band: 'yellow' },
  { fn: 'F2',  code: 'WB',    label: 'GOVT — World Bonds',                  band: 'yellow' },
  { fn: 'F3',  code: 'OPT',   label: 'CORP — Options Terminal',              band: 'green'  },
  { fn: 'F4',  code: 'MIST',  label: 'MTGE — Mistake Journal',               band: 'red'    },
  { fn: 'F5',  code: 'PERF',  label: 'M-MKT — Performance Analytics',        band: 'amber'  },
  { fn: 'F6',  code: 'WEI',   label: 'EQTY — World Equity Index Monitor',    band: 'orange' },
  { fn: 'F7',  code: 'GLCO',  label: 'CMDTY — Global Commodities',           band: 'orange' },
  { fn: 'F8',  code: 'GLOB',  label: 'INDX — Global Markets Globe 3D',       band: 'white'  },
  { fn: 'F9',  code: 'FX',    label: 'CRNCY — FX Cross-Rate Monitor',        band: 'pink'   },
  { fn: 'F10', code: 'ACCT',  label: 'CLIENT — Account Overview',            band: 'cyan'   },
  { fn: 'F11', code: 'JRNL',  label: 'PEOPLE — Trade Journal',               band: 'blue'   },
  { fn: 'F12', code: 'TOP',   label: 'NEWS — Top News & Wire',               band: 'blue'   },
];

const BAND_DOT: Record<string, string> = {
  yellow: 'bg-[hsl(50,100%,55%)]',
  orange: 'bg-[hsl(33,100%,50%)]',
  blue:   'bg-[hsl(210,80%,55%)]',
  green:  'bg-[hsl(140,60%,45%)]',
  red:    'bg-[hsl(0,72%,51%)]',
  pink:   'bg-[hsl(330,80%,65%)]',
  cyan:   'bg-[hsl(185,70%,50%)]',
  white:  'bg-[hsl(0,0%,90%)]',
  amber:  'bg-[hsl(40,100%,55%)]',
};

const SHORTCUTS = [
  { key: 'Alt + ←',  desc: 'Navigate back in history' },
  { key: 'Alt + →',  desc: 'Navigate forward in history' },
  { key: 'Escape',   desc: 'Clear CLI input / close overlay' },
  { key: '/',        desc: 'Focus command line from anywhere' },
  { key: 'F2–F12',  desc: 'Execute function key command' },
  { key: 'F1',       desc: 'Open this help overlay' },
  { key: '↑ ↓',     desc: 'Navigate autocomplete suggestions' },
  { key: 'Enter',    desc: 'Execute selected command' },
];

interface Props {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F1') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] bg-background/96 backdrop-blur-sm flex flex-col font-mono"
      onClick={onClose}
    >
      <div
        className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="text-[8px] text-muted-foreground">[F1]</span>
            <span className="text-accent font-bold text-xs tracking-widest uppercase">Help — Terminal Reference</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-[9px] border border-border px-2 py-0.5 hover:border-accent transition-colors"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Function Keys + Shortcuts */}
          <div>
            <div className="text-[7px] text-accent font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">
              Function Keys
            </div>
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left px-1 py-0.5 text-muted-foreground font-normal text-[7px]">KEY</th>
                  <th className="text-left px-1 py-0.5 text-muted-foreground font-normal text-[7px]">CODE</th>
                  <th className="text-left px-1 py-0.5 text-muted-foreground font-normal text-[7px]">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {F_KEYS.map(k => (
                  <tr key={k.fn} className="border-b border-border/20 hover:bg-surface-elevated transition-colors">
                    <td className="px-1 py-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-sm shrink-0 ${BAND_DOT[k.band]}`} />
                        <span className="text-foreground font-bold text-[8px]">{k.fn}</span>
                      </div>
                    </td>
                    <td className="px-1 py-0.5 text-accent font-bold">{k.code}</td>
                    <td className="px-1 py-0.5 text-muted-foreground">{k.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-5">
              <div className="text-[7px] text-accent font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">
                Keyboard Shortcuts
              </div>
              <table className="w-full text-[9px] border-collapse">
                <tbody>
                  {SHORTCUTS.map(s => (
                    <tr key={s.key} className="border-b border-border/20">
                      <td className="px-1 py-0.5 w-28">
                        <code className="text-accent bg-surface-elevated px-1 py-0.5 text-[8px]">{s.key}</code>
                      </td>
                      <td className="px-1 py-0.5 text-muted-foreground">{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: All Commands */}
          <div>
            <div className="text-[7px] text-accent font-bold uppercase tracking-widest mb-2 border-b border-border pb-1">
              All Commands ({COMMANDS.length})
            </div>
            <div className="h-[420px] overflow-y-auto border border-border">
              <table className="w-full text-[9px] border-collapse">
                <thead className="sticky top-0 bg-surface-deep border-b border-border">
                  <tr>
                    <th className="text-left px-2 py-0.5 text-muted-foreground font-normal text-[7px]">CODE</th>
                    <th className="text-left px-2 py-0.5 text-muted-foreground font-normal text-[7px]">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMANDS.map(c => (
                    <tr key={c.code} className="border-b border-border/20 hover:bg-surface-elevated transition-colors">
                      <td className="px-2 py-0.5 text-accent font-bold w-20">{c.code}</td>
                      <td className="px-2 py-0.5 text-foreground">{c.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-3 text-[7px] text-muted-foreground text-center tracking-widest uppercase">
          Trade Terminal · Type a command in the CLI and press Enter · Click anywhere outside to close
        </div>
      </div>
    </div>
  );
}
