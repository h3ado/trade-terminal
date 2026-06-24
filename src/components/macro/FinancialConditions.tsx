// FCI — Financial Conditions Index. NFCI + proxy stress dial.
import { ExpandableResponsiveContainer } from '@/components/shared/ExpandChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

const nfciHist = Array.from({ length: 36 }, (_, i) => {
  const t = i / 35;
  const nfci = -0.55 + Math.sin(i / 5) * 0.18 + (i > 28 ? 0.08 : 0);
  return { m: `M${i + 1}`, nfci: +nfci.toFixed(3), anfci: +(nfci + 0.12).toFixed(3) };
});

const components = [
  { name: 'VIX',         z:  0.42, weight: 18, contrib:  7.6 },
  { name: 'MOVE',        z:  0.18, weight: 14, contrib:  2.5 },
  { name: 'IG OAS',      z: -0.31, weight: 16, contrib: -5.0 },
  { name: 'HY OAS',      z: -0.22, weight: 12, contrib: -2.6 },
  { name: 'USD Broad',   z:  0.08, weight: 12, contrib:  1.0 },
  { name: 'SPX 5d Ret',  z: -0.14, weight: 10, contrib: -1.4 },
  { name: 'Repo / SOFR', z:  0.04, weight:  8, contrib:  0.3 },
  { name: '2s10s',       z:  0.22, weight: 10, contrib:  2.2 },
];

// Stress score 0-100, summing weighted z-scores normalized.
const stress = Math.max(0, Math.min(100, 50 + components.reduce((a, c) => a + c.contrib, 0) * 4));
const regime =
  stress < 25 ? { label: 'EASY',     color: 'text-positive' } :
  stress < 50 ? { label: 'NEUTRAL',  color: 'text-accent'   } :
  stress < 75 ? { label: 'TIGHT',    color: 'text-negative' } :
                { label: 'STRESSED', color: 'text-negative' };

export default function FinancialConditions() {
  return (
    <div className="space-y-2 p-2">
      <div className="grid grid-cols-4 gap-2">
        <Stat label="CHICAGO NFCI" value="-0.51" delta="LOOSER vs hist" up />
        <Stat label="ANFCI (ADJ)" value="-0.34" delta="vs growth ctrl" />
        <Stat label="STRESS SCORE" value={stress.toFixed(0)} delta={regime.label} />
        <Stat label="REGIME" value={regime.label} delta="proxy FCI" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 border border-border bg-surface-primary p-3 flex flex-col items-center justify-center">
          <div className="text-[10px] font-mono text-muted-foreground mb-2 self-start">Stress Dial</div>
          <div className="relative w-full h-32 flex items-end justify-center">
            <svg viewBox="0 0 200 110" className="w-full h-full">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--border))" strokeWidth="14" />
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none"
                stroke={stress < 25 ? 'hsl(var(--positive))' : stress < 50 ? 'hsl(var(--accent))' : 'hsl(var(--negative))'}
                strokeWidth="14"
                strokeDasharray={`${(stress / 100) * 251} 251`} />
              <text x="100" y="80" textAnchor="middle" className="fill-foreground" fontSize="28" fontFamily="monospace" fontWeight="bold">{stress.toFixed(0)}</text>
              <text x="100" y="98" textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontFamily="monospace">/ 100</text>
            </svg>
          </div>
          <div className={`text-[11px] font-mono font-bold mt-2 ${regime.color}`}>{regime.label}</div>
        </div>

        <div className="col-span-2 border border-border bg-surface-primary p-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-2">NFCI vs Adjusted NFCI (36m)</div>
          <ExpandableResponsiveContainer width="100%" height={180}>
            <LineChart data={nfciHist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="m" tick={{ fontSize: 8, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label={{ value: 'avg', fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
              <Line type="monotone" dataKey="nfci" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="NFCI" />
              <Line type="monotone" dataKey="anfci" stroke="hsl(var(--positive))" strokeWidth={1.5} dot={false} name="ANFCI" />
            </LineChart>
          </ExpandableResponsiveContainer>
        </div>
      </div>

      <div className="border border-border bg-surface-primary p-3">
        <div className="text-[10px] font-mono text-muted-foreground mb-2">Contribution Waterfall — Proxy FCI (bps, positive = tightening)</div>
        <ExpandableResponsiveContainer width="100%" height={180}>
          <BarChart data={components}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--accent))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--accent))', fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--accent))' }} itemStyle={{ color: 'hsl(var(--accent))' }} labelStyle={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
            <Bar dataKey="contrib">
              {components.map((c, i) => (
                <Cell key={i} fill={c.contrib >= 0 ? 'hsl(var(--negative))' : 'hsl(var(--positive))'} />
              ))}
            </Bar>
          </BarChart>
        </ExpandableResponsiveContainer>
      </div>

      <div className="border border-border overflow-hidden">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border">
          <span className="text-accent font-mono font-bold text-[10px] uppercase">FCI Components</span>
        </div>
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1 text-muted-foreground">COMPONENT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">Z-SCORE</th>
              <th className="text-right px-2 py-1 text-muted-foreground">WEIGHT</th>
              <th className="text-right px-2 py-1 text-muted-foreground">CONTRIB (bp)</th>
              <th className="text-right px-2 py-1 text-muted-foreground">DIRECTION</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c, i) => (
              <tr key={c.name} className={`border-b border-grid-line last:border-0 hover:bg-accent/5 ${i % 2 ? 'bg-surface-elevated/30' : ''}`}>
                <td className="px-2 py-1 text-foreground">{c.name}</td>
                <td className={`px-2 py-1 text-right font-bold ${Math.abs(c.z) > 1 ? 'text-negative' : c.z > 0 ? 'text-accent' : 'text-positive'}`}>{c.z > 0 ? '+' : ''}{c.z.toFixed(2)}</td>
                <td className="px-2 py-1 text-right text-muted-foreground">{c.weight}%</td>
                <td className={`px-2 py-1 text-right font-bold ${c.contrib >= 0 ? 'text-negative' : 'text-positive'}`}>{c.contrib > 0 ? '+' : ''}{c.contrib.toFixed(1)}</td>
                <td className={`px-2 py-1 text-right ${c.contrib >= 0 ? 'text-negative' : 'text-positive'}`}>{c.contrib >= 0 ? 'TIGHTENING' : 'LOOSENING'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="border border-border p-2 bg-surface-primary">
      <div className="text-[8px] font-mono text-muted-foreground uppercase">{label}</div>
      <div className="text-xl font-mono font-bold text-foreground">{value}</div>
      <div className={`text-[9px] font-mono ${up ? 'text-positive' : 'text-muted-foreground'}`}>{delta}</div>
    </div>
  );
}
