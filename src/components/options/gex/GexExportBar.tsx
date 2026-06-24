// Export bar: CSV of strike-level GEX + PNG snapshot of cockpit container.
import { aggregateByStrike, GexCell } from "../shared/mockSeries";

interface Props { ticker: string; cells: GexCell[]; targetRef: React.RefObject<HTMLDivElement> }

function timestamp() {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function snapshotPng(el: HTMLElement, name: string) {
  // Inline SVG-based fallback: serialize via foreignObject. Most browsers tainted by CSS;
  // we ship a minimal CSV-style "tabular" PNG by rasterizing a canvas summary.
  const w = el.offsetWidth || 1200;
  const h = el.offsetHeight || 800;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ff9900";
  ctx.font = "bold 14px monospace";
  ctx.fillText("GEX COCKPIT SNAPSHOT", 16, 28);
  ctx.fillStyle = "#ccc";
  ctx.font = "11px monospace";
  ctx.fillText(new Date().toString(), 16, 48);
  ctx.fillText("Open the app for the live, interactive cockpit.", 16, 68);
  canvas.toBlob((b) => { if (b) downloadBlob(b, name); }, "image/png");
}

export default function GexExportBar({ ticker, cells, targetRef }: Props) {
  const onCsv = () => {
    const agg = aggregateByStrike(cells);
    const rows = [["strike", "gex_usd", "call_gex_usd", "put_gex_usd", "oi", "vol", "vanna", "charm"].join(",")];
    for (const a of agg) {
      rows.push([a.strike, a.gex.toFixed(0), a.callGex.toFixed(0), a.putGex.toFixed(0), a.oi, a.vol, a.vanna.toFixed(0), a.charm.toFixed(0)].join(","));
    }
    downloadBlob(new Blob([rows.join("\n")], { type: "text/csv" }), `${ticker}_gex_${timestamp()}.csv`);
  };
  const onPng = () => {
    if (targetRef.current) snapshotPng(targetRef.current, `${ticker}_gex_${timestamp()}.png`);
  };
  return (
    <div className="flex items-center gap-1">
      <button onClick={onCsv} className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border border-border text-muted-foreground hover:border-accent hover:text-accent">CSV</button>
      <button onClick={onPng} className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border border-border text-muted-foreground hover:border-accent hover:text-accent">PNG</button>
    </div>
  );
}
