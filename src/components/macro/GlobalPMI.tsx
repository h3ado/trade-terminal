import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { useExpandableRows, ExpandableRow, ExpandIcon, DetailMiniChart, DetailKV } from './MacroExpandable';

interface PMIData {
  country: string;
  code: string;
  flag: string;
  mfg: number;
  mfgPrev: number;
  svc: number;
  svcPrev: number;
  composite: number;
  compositePrev: number;
  trend: 'Expanding' | 'Contracting' | 'Stalling';
  newOrders: number;
  employment: number;
  prices: number;
  outputIndex?: number;
  backlogs?: number;
  deliveryTimes?: number;
  inputPrices?: number;
  outputPrices?: number;
  commentary?: string;
}

const pmiData: PMIData[] = [
  { country: 'United States', code: 'US', flag: '🇺🇸', mfg: 50.3, mfgPrev: 49.1, svc: 52.6, svcPrev: 53.4, composite: 52.1, compositePrev: 52.0, trend: 'Expanding', newOrders: 51.8, employment: 49.2, prices: 54.2, outputIndex: 53.4, backlogs: 47.2, deliveryTimes: 50.8, inputPrices: 58.4, outputPrices: 54.2, commentary: 'Manufacturing returned to expansion. Services still leading but momentum softening.' },
  { country: 'Eurozone', code: 'EU', flag: '🇪🇺', mfg: 46.8, mfgPrev: 46.5, svc: 51.2, svcPrev: 50.8, composite: 49.8, compositePrev: 49.4, trend: 'Stalling', newOrders: 45.2, employment: 48.4, prices: 52.8, outputIndex: 48.8, backlogs: 44.2, deliveryTimes: 49.2, inputPrices: 54.8, outputPrices: 52.8, commentary: 'Manufacturing recession continues. Services barely expanding. Germany dragging composite.' },
  { country: 'United Kingdom', code: 'UK', flag: '🇬🇧', mfg: 47.5, mfgPrev: 47.0, svc: 53.8, svcPrev: 53.2, composite: 52.4, compositePrev: 51.8, trend: 'Expanding', newOrders: 48.2, employment: 47.8, prices: 56.4, outputIndex: 52.8, backlogs: 46.8, deliveryTimes: 49.8, commentary: 'Services resilient despite high rates. Manufacturing contracting but improving.' },
  { country: 'Germany', code: 'DE', flag: '🇩🇪', mfg: 42.6, mfgPrev: 42.2, svc: 49.8, svcPrev: 49.2, composite: 47.2, compositePrev: 46.8, trend: 'Contracting', newOrders: 40.8, employment: 46.2, prices: 48.4, outputIndex: 44.2, backlogs: 39.8, commentary: 'Deep manufacturing recession. Auto sector under structural pressure.' },
  { country: 'France', code: 'FR', flag: '🇫🇷', mfg: 46.2, mfgPrev: 45.8, svc: 48.4, svcPrev: 48.0, composite: 47.8, compositePrev: 47.4, trend: 'Contracting', newOrders: 44.8, employment: 47.2, prices: 52.8, commentary: 'Both manufacturing and services contracting. Political uncertainty weighing on activity.' },
  { country: 'Japan', code: 'JP', flag: '🇯🇵', mfg: 48.2, mfgPrev: 47.9, svc: 54.1, svcPrev: 53.6, composite: 52.0, compositePrev: 51.4, trend: 'Expanding', newOrders: 47.8, employment: 50.2, prices: 52.4, commentary: 'Services expanding strongly on tourism/inbound demand. Manufacturing soft on yen weakness.' },
  { country: 'China', code: 'CN', flag: '🇨🇳', mfg: 50.8, mfgPrev: 50.4, svc: 52.4, svcPrev: 51.8, composite: 51.8, compositePrev: 51.2, trend: 'Expanding', newOrders: 51.2, employment: 48.8, prices: 49.2, commentary: 'Stimulus measures supporting activity. Export orders improving but employment still soft.' },
  { country: 'India', code: 'IN', flag: '🇮🇳', mfg: 56.8, mfgPrev: 56.2, svc: 61.2, svcPrev: 60.8, composite: 59.8, compositePrev: 59.2, trend: 'Expanding', newOrders: 58.4, employment: 54.2, prices: 52.8, commentary: 'Strongest expansion globally. Both manufacturing and services in robust growth territory.' },
  { country: 'South Korea', code: 'KR', flag: '🇰🇷', mfg: 49.8, mfgPrev: 49.2, svc: 51.4, svcPrev: 50.8, composite: 50.8, compositePrev: 50.2, trend: 'Expanding', newOrders: 49.4, employment: 48.8, prices: 51.2, commentary: 'Near stagnation. Semi cycle recovery supporting tech exports.' },
  { country: 'Brazil', code: 'BR', flag: '🇧🇷', mfg: 52.1, mfgPrev: 51.8, svc: 54.6, svcPrev: 54.2, composite: 53.8, compositePrev: 53.4, trend: 'Expanding', newOrders: 52.8, employment: 50.4, prices: 56.2, commentary: 'Solid expansion. Agricultural exports and domestic services driving growth.' },
  { country: 'Australia', code: 'AU', flag: '🇦🇺', mfg: 47.4, mfgPrev: 47.0, svc: 52.8, svcPrev: 52.4, composite: 51.2, compositePrev: 50.8, trend: 'Expanding', newOrders: 48.2, employment: 49.4, prices: 54.8 },
  { country: 'Canada', code: 'CA', flag: '🇨🇦', mfg: 49.2, mfgPrev: 48.8, svc: 51.8, svcPrev: 51.4, composite: 51.0, compositePrev: 50.6, trend: 'Expanding', newOrders: 48.8, employment: 48.2, prices: 52.4 },
  { country: 'Mexico', code: 'MX', flag: '🇲🇽', mfg: 51.4, mfgPrev: 51.0, svc: 53.2, svcPrev: 52.8, composite: 52.6, compositePrev: 52.2, trend: 'Expanding', newOrders: 52.2, employment: 50.8, prices: 54.4 },
  { country: 'Switzerland', code: 'CH', flag: '🇨🇭', mfg: 44.4, mfgPrev: 44.0, svc: 50.8, svcPrev: 50.4, composite: 48.4, compositePrev: 48.0, trend: 'Stalling', newOrders: 43.2, employment: 46.8, prices: 48.2 },
  { country: 'Turkey', code: 'TR', flag: '🇹🇷', mfg: 48.8, mfgPrev: 48.4, svc: 52.2, svcPrev: 51.8, composite: 51.0, compositePrev: 50.6, trend: 'Expanding', newOrders: 48.4, employment: 47.8, prices: 62.4, commentary: 'High input prices persisting. Tight monetary policy weighing on manufacturing.' },
  { country: 'Indonesia', code: 'ID', flag: '🇮🇩', mfg: 52.6, mfgPrev: 52.2, svc: 53.4, svcPrev: 53.0, composite: 53.0, compositePrev: 52.6, trend: 'Expanding', newOrders: 53.2, employment: 51.2, prices: 50.8 },
];

const getPMIColor = (val: number) => {
  if (val >= 55) return 'text-positive font-bold';
  if (val >= 50) return 'text-positive';
  if (val >= 48) return 'text-accent';
  return 'text-negative';
};

const getPMIBg = (val: number) => {
  if (val >= 55) return 'bg-positive/20';
  if (val >= 50) return 'bg-positive/10';
  if (val >= 48) return 'bg-accent/10';
  return 'bg-negative/10';
};

export default function GlobalPMI() {
  const { selectedCountry } = useMacroCountry();
  const { toggleRow, isExpanded } = useExpandableRows();
  const expanding = pmiData.filter(p => p.trend === 'Expanding').length;
  const contracting = pmiData.filter(p => p.trend === 'Contracting').length;
  const stalling = pmiData.filter(p => p.trend === 'Stalling').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-accent font-mono font-bold text-xs uppercase">🌍 Global PMI Tracker</span>
        <span className="text-muted-foreground font-mono text-[9px]">GPMI &lt;GO&gt;</span>
        <span className="text-[8px] font-mono text-muted-foreground ml-auto">Click any country for sub-indices</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">GLOBAL MFG PMI</div>
          <div className="text-xl font-mono font-bold text-positive">50.3</div>
          <div className="text-[9px] font-mono text-positive">Marginal expansion</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">EXPANDING</div>
          <div className="text-xl font-mono font-bold text-positive">{expanding}</div>
          <div className="text-[9px] font-mono text-muted-foreground">of {pmiData.length} countries</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">CONTRACTING</div>
          <div className="text-xl font-mono font-bold text-negative">{contracting}</div>
          <div className="text-[9px] font-mono text-muted-foreground">countries</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">STALLING</div>
          <div className="text-xl font-mono font-bold text-accent">{stalling}</div>
          <div className="text-[9px] font-mono text-muted-foreground">near 50 threshold</div>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-1">
        {pmiData.map(p => (
          <div key={p.code} className={`p-1.5 border ${p.code === selectedCountry ? 'border-accent' : 'border-border'} ${getPMIBg(p.mfg)} cursor-pointer hover:border-accent/50 transition-colors`} onClick={() => toggleRow(p.code)}>
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-[9px] text-foreground">{p.flag} {p.code}</span>
              <span className={`font-mono font-bold text-[10px] ${getPMIColor(p.mfg)}`}>{p.mfg}</span>
            </div>
            <div className="text-[7px] font-mono text-muted-foreground mt-0.5">MFG</div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="border border-border overflow-hidden">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="text-left px-1 py-1.5 text-accent font-bold w-4"></th>
              <th className="text-left px-2 py-1.5 text-accent font-bold">COUNTRY</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">MFG</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">PREV</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">SVC</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">COMP</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">ORDERS</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">EMPL</th>
              <th className="text-right px-2 py-1.5 text-accent font-bold">PRICES</th>
              <th className="text-center px-2 py-1.5 text-accent font-bold">TREND</th>
            </tr>
          </thead>
          <tbody>
            {pmiData.map((p, i) => {
              const expanded = isExpanded(p.code);
              const hist = [
                { label: 'Oct', value: p.mfg - 1.2 + Math.random() },
                { label: 'Nov', value: p.mfg - 0.8 + Math.random() * 0.5 },
                { label: 'Dec', value: p.mfgPrev - 0.4 },
                { label: 'Jan', value: p.mfgPrev + 0.2 },
                { label: 'Feb', value: p.mfgPrev },
                { label: 'Mar', value: p.mfg },
              ];
              return (
                <ExpandableRow
                  key={p.code}
                  id={p.code}
                  isExpanded={expanded}
                  onToggle={toggleRow}
                  colSpan={10}
                  className={p.code === selectedCountry ? 'bg-accent/10' : i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}
                  cells={
                    <>
                      <td className="px-1 py-1 w-4"><ExpandIcon isExpanded={expanded} /></td>
                      <td className="px-2 py-1 text-foreground font-bold">
                        <span className="mr-1">{p.flag}</span>{p.country}
                      </td>
                      <td className={`px-2 py-1 text-right ${getPMIColor(p.mfg)}`}>{p.mfg.toFixed(1)}</td>
                      <td className="px-2 py-1 text-right text-muted-foreground">{p.mfgPrev.toFixed(1)}</td>
                      <td className={`px-2 py-1 text-right ${getPMIColor(p.svc)}`}>{p.svc.toFixed(1)}</td>
                      <td className={`px-2 py-1 text-right ${getPMIColor(p.composite)}`}>{p.composite.toFixed(1)}</td>
                      <td className={`px-2 py-1 text-right ${getPMIColor(p.newOrders)}`}>{p.newOrders.toFixed(1)}</td>
                      <td className={`px-2 py-1 text-right ${getPMIColor(p.employment)}`}>{p.employment.toFixed(1)}</td>
                      <td className={`px-2 py-1 text-right ${p.prices > 55 ? 'text-negative' : p.prices > 50 ? 'text-accent' : 'text-positive'}`}>{p.prices.toFixed(1)}</td>
                      <td className="px-2 py-1 text-center">
                        <span className={`text-[8px] px-1 py-0.5 font-bold ${
                          p.trend === 'Expanding' ? 'text-positive bg-positive/10' :
                          p.trend === 'Contracting' ? 'text-negative bg-negative/10' :
                          'text-accent bg-accent/10'
                        }`}>{p.trend.toUpperCase()}</span>
                      </td>
                    </>
                  }
                  detail={
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Manufacturing PMI Trend</div>
                        <DetailMiniChart data={hist} dataKey="value" height={70} />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Sub-Indices</div>
                        <DetailKV items={[
                          { label: 'New Orders', value: p.newOrders.toFixed(1), color: getPMIColor(p.newOrders).split(' ')[0] },
                          { label: 'Employment', value: p.employment.toFixed(1), color: getPMIColor(p.employment).split(' ')[0] },
                          { label: 'Prices Paid', value: p.prices.toFixed(1), color: p.prices > 55 ? 'text-negative' : p.prices > 50 ? 'text-accent' : 'text-positive' },
                          ...(p.outputIndex ? [{ label: 'Output', value: p.outputIndex.toFixed(1), color: getPMIColor(p.outputIndex).split(' ')[0] }] : []),
                          ...(p.backlogs ? [{ label: 'Backlogs', value: p.backlogs.toFixed(1), color: getPMIColor(p.backlogs).split(' ')[0] }] : []),
                          ...(p.deliveryTimes ? [{ label: 'Delivery Times', value: p.deliveryTimes.toFixed(1) }] : []),
                          ...(p.inputPrices ? [{ label: 'Input Prices', value: p.inputPrices.toFixed(1), color: p.inputPrices > 55 ? 'text-negative' : 'text-foreground' }] : []),
                        ]} />
                      </div>
                      <div>
                        {p.commentary && (
                          <div>
                            <div className="text-[9px] font-mono text-accent font-bold uppercase mb-1">Analysis</div>
                            <div className="text-[9px] font-mono text-foreground border border-border p-2">{p.commentary}</div>
                          </div>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          <div className="border border-border p-1.5">
                            <div className="text-[8px] font-mono text-muted-foreground">Services</div>
                            <div className={`text-sm font-mono font-bold ${getPMIColor(p.svc)}`}>{p.svc.toFixed(1)}</div>
                          </div>
                          <div className="border border-border p-1.5">
                            <div className="text-[8px] font-mono text-muted-foreground">Composite</div>
                            <div className={`text-sm font-mono font-bold ${getPMIColor(p.composite)}`}>{p.composite.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
