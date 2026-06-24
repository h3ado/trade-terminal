/**
 * Toggle button + state for the great-circle measure tool. The actual
 * click-handling and SVG drawing happens inside Map2D — this component just
 * owns the toolbar pill.
 */
import { Ruler, X } from 'lucide-react';

type Props = {
  active: boolean;
  onToggle: () => void;
  hint?: string;
};

export function MeasureToggle({ active, onToggle, hint }: Props) {
  return (
    <button
      onClick={onToggle}
      title={hint ?? 'Measure tool: click two points'}
      className={`flex items-center gap-1 px-2 py-1 border text-[9px] font-mono uppercase font-bold backdrop-blur ${
        active
          ? 'bg-accent text-accent-foreground border-accent'
          : 'bg-surface-deep/80 text-foreground border-border hover:border-accent'
      }`}
    >
      {active ? <X className="w-3 h-3" /> : <Ruler className="w-3 h-3" />}
      {active ? 'Cancel' : 'Measure'}
    </button>
  );
}
