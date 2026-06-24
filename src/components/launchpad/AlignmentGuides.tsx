// SVG overlay drawing alignment guide lines while a tile is dragged/resized.
import { GridItem } from '@/hooks/useLaunchpadState';

interface Props {
  active: GridItem | null;
  items: GridItem[];
  cols: number;
  rowHeight: number;
  margin: number;
  containerWidth: number;
}

export default function AlignmentGuides({ active, items, cols, rowHeight, margin, containerWidth }: Props) {
  if (!active) return null;
  const colW = (containerWidth - margin * (cols + 1)) / cols;
  const toX = (cx: number) => margin + cx * (colW + margin);
  const toY = (cy: number) => margin + cy * (rowHeight + margin);

  const xs = new Set<number>();
  const ys = new Set<number>();
  const aL = active.x, aR = active.x + active.w;
  const aT = active.y, aB = active.y + active.h;

  for (const it of items) {
    if (it.i === active.i) continue;
    const l = it.x, r = it.x + it.w, t = it.y, b = it.y + it.h;
    if (aL === l || aL === r) xs.add(aL);
    if (aR === l || aR === r) xs.add(aR);
    if (aT === t || aT === b) ys.add(aT);
    if (aB === t || aB === b) ys.add(aB);
  }

  return (
    <svg className="absolute inset-0 pointer-events-none z-30" width="100%" height="100%">
      {[...xs].map(x => {
        const px = toX(x);
        return <line key={`vx${x}`} x1={px} x2={px} y1={0} y2="100%" stroke="hsl(var(--accent))" strokeWidth={1} strokeDasharray="3 2" />;
      })}
      {[...ys].map(y => {
        const py = toY(y);
        return <line key={`hy${y}`} x1={0} x2="100%" y1={py} y2={py} stroke="hsl(var(--accent))" strokeWidth={1} strokeDasharray="3 2" />;
      })}
    </svg>
  );
}
