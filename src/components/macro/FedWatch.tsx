import { useState } from 'react';
import { useMacroCountry } from '@/contexts/MacroCountryContext';
import { ChevronDown, ChevronRight } from 'lucide-react';
import FREDLiveStrip from './FREDLiveStrip';

interface Meeting {
  date: string;
  hold: number;
  cut25: number;
  cut50: number;
  hike25: number;
  impliedRate: number;
}

const countryRateWatch: Record<string, {
  bankName: string; currentRate: string; meetings: Meeting[];
  summary: { nextCut: string; nextCutProb: string; cutsYE: string; terminalRate: string };
}> = {
  US: {
    bankName: 'Federal Reserve', currentRate: '5.25–5.50%',
    meetings: [
      { date: '2026-05-07', hold: 82.4, cut25: 15.2, cut50: 1.8, hike25: 0.6, impliedRate: 5.46 },
      { date: '2026-06-18', hold: 62.8, cut25: 31.4, cut50: 4.2, hike25: 1.6, impliedRate: 5.38 },
      { date: '2026-07-30', hold: 44.2, cut25: 38.8, cut50: 14.2, hike25: 2.8, impliedRate: 5.22 },
      { date: '2026-09-17', hold: 28.6, cut25: 42.2, cut50: 22.4, hike25: 6.8, impliedRate: 5.04 },
      { date: '2026-11-05', hold: 18.4, cut25: 38.6, cut50: 32.8, hike25: 10.2, impliedRate: 4.82 },
      { date: '2026-12-17', hold: 12.2, cut25: 32.4, cut50: 38.2, hike25: 17.2, impliedRate: 4.58 },
    ],
    summary: { nextCut: 'Jun 2026', nextCutProb: '31.4%', cutsYE: '3–4 (~92bp)', terminalRate: '4.58%' },
  },
  UK: {
    bankName: 'Bank of England', currentRate: '5.25%',
    meetings: [
      { date: '2026-05-09', hold: 72.0, cut25: 24.8, cut50: 2.4, hike25: 0.8, impliedRate: 5.19 },
      { date: '2026-06-19', hold: 52.4, cut25: 38.2, cut50: 8.2, hike25: 1.2, impliedRate: 5.08 },
      { date: '2026-08-07', hold: 34.8, cut25: 42.4, cut50: 18.8, hike25: 4.0, impliedRate: 4.88 },
      { date: '2026-09-18', hold: 22.2, cut25: 40.8, cut50: 28.4, hike25: 8.6, impliedRate: 4.68 },
      { date: '2026-11-06', hold: 14.4, cut25: 36.2, cut50: 36.8, hike25: 12.6, impliedRate: 4.42 },
      { date: '2026-12-18', hold: 10.2, cut25: 30.8, cut50: 40.2, hike25: 18.8, impliedRate: 4.18 },
    ],
    summary: { nextCut: 'Jun 2026', nextCutProb: '38.2%', cutsYE: '4–5 (~107bp)', terminalRate: '4.18%' },
  },
  EU: {
    bankName: 'European Central Bank', currentRate: '4.50% (MRO) / 4.00% (DFR)',
    meetings: [
      { date: '2026-04-17', hold: 42.8, cut25: 48.2, cut50: 8.4, hike25: 0.6, impliedRate: 3.88 },
      { date: '2026-06-05', hold: 28.4, cut25: 52.8, cut50: 16.2, hike25: 2.6, impliedRate: 3.68 },
      { date: '2026-07-17', hold: 18.2, cut25: 48.4, cut50: 28.2, hike25: 5.2, impliedRate: 3.42 },
      { date: '2026-09-11', hold: 12.4, cut25: 40.8, cut50: 38.4, hike25: 8.4, impliedRate: 3.18 },
      { date: '2026-10-30', hold: 8.8, cut25: 34.2, cut50: 42.8, hike25: 14.2, impliedRate: 2.92 },
      { date: '2026-12-12', hold: 6.2, cut25: 28.4, cut50: 44.2, hike25: 21.2, impliedRate: 2.68 },
    ],
    summary: { nextCut: 'Apr 2026', nextCutProb: '48.2%', cutsYE: '5–6 (~132bp)', terminalRate: '2.68%' },
  },
  JP: {
    bankName: 'Bank of Japan', currentRate: '0.10%',
    meetings: [
      { date: '2026-04-26', hold: 68.4, cut25: 2.2, cut50: 0.4, hike25: 28.2, impliedRate: 0.17 },
      { date: '2026-06-14', hold: 48.2, cut25: 1.8, cut50: 0.2, hike25: 42.8, impliedRate: 0.24 },
      { date: '2026-07-31', hold: 32.4, cut25: 1.2, cut50: 0.1, hike25: 52.8, impliedRate: 0.32 },
      { date: '2026-09-19', hold: 22.8, cut25: 0.8, cut50: 0.1, hike25: 58.2, impliedRate: 0.38 },
      { date: '2026-10-31', hold: 18.2, cut25: 0.6, cut50: 0.1, hike25: 62.4, impliedRate: 0.44 },
      { date: '2026-12-19', hold: 14.4, cut25: 0.4, cut50: 0.1, hike25: 68.2, impliedRate: 0.48 },
    ],
    summary: { nextCut: 'N/A — Hiking', nextCutProb: 'N/A', cutsYE: '0 (3–4 hikes expected)', terminalRate: '0.48%' },
  },
};

const getCountryRateWatch = (code: string) => countryRateWatch[code] || countryRateWatch['US'];

const getBarWidth = (pct: number) => `${Math.max(pct, 0.5)}%`;

export default function FedWatch() {
  const { selectedCountry, countryInfo } = useMacroCountry();
  const data = getCountryRateWatch(selectedCountry);
  const isHiking = selectedCountry === 'JP';
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {selectedCountry === 'US' && (
        <FREDLiveStrip keys={['fed_funds', 'two_year', 'ten_year']} title="LIVE · FRED RATES" />
      )}
      <div className="flex items-center gap-2">
        <span className="text-sm">{countryInfo.flag}</span>
        <span className="text-accent font-mono font-bold text-xs uppercase">{data.bankName} Rate Watch</span>
        <span className="text-muted-foreground font-mono text-[9px]">WIRP &lt;GO&gt;</span>
      </div>

      <div className="border border-border">
        <div className="bg-surface-elevated px-2 py-1 border-b border-border flex justify-between">
          <span className="text-accent font-mono font-bold text-[10px]">Rate Futures Implied Probabilities</span>
          <span className="text-muted-foreground font-mono text-[9px]">Current: {data.currentRate}</span>
        </div>

        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="border-b border-grid-line">
              <th className="text-left px-2 py-1.5 text-muted-foreground">MEETING</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground">HOLD</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground">-25bp</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground">-50bp</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground">+25bp</th>
              <th className="text-right px-2 py-1.5 text-muted-foreground">IMPLIED</th>
              <th className="px-2 py-1.5 text-muted-foreground w-48">PROBABILITY</th>
            </tr>
          </thead>
          <tbody>
            {data.meetings.map((m, i) => {
              const fmtDate = new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const isSelected = selectedMeeting === m.date;
              return (
                <>
                <tr key={m.date} onClick={() => setSelectedMeeting(isSelected ? null : m.date)} className={`border-b border-grid-line last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-accent/15' : 'hover:bg-accent/5'} ${i % 2 !== 0 ? 'bg-surface-elevated/30' : ''}`}>
                  <td className="px-2 py-1.5 text-foreground font-bold flex items-center gap-1">
                    {isSelected ? <ChevronDown className="w-2.5 h-2.5 text-accent" /> : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />}
                    {fmtDate}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-bold ${m.hold > 50 ? 'text-accent' : 'text-muted-foreground'}`}>{m.hold.toFixed(1)}%</td>
                  <td className={`px-2 py-1.5 text-right font-bold ${m.cut25 > 30 ? 'text-positive' : 'text-muted-foreground'}`}>{m.cut25.toFixed(1)}%</td>
                  <td className={`px-2 py-1.5 text-right font-bold ${m.cut50 > 20 ? 'text-positive' : 'text-muted-foreground'}`}>{m.cut50.toFixed(1)}%</td>
                  <td className={`px-2 py-1.5 text-right font-bold ${m.hike25 > 10 ? 'text-negative' : 'text-muted-foreground'}`}>{m.hike25.toFixed(1)}%</td>
                  <td className="px-2 py-1.5 text-right text-foreground font-bold">{m.impliedRate.toFixed(2)}%</td>
                  <td className="px-2 py-1.5">
                    <div className="flex h-3 gap-px overflow-hidden rounded-sm">
                      <div className="bg-accent/80 h-full transition-all" style={{ width: getBarWidth(m.hold) }} title={`Hold: ${m.hold}%`} />
                      <div className="bg-positive/80 h-full transition-all" style={{ width: getBarWidth(m.cut25) }} title={`-25bp: ${m.cut25}%`} />
                      <div className="bg-positive h-full transition-all" style={{ width: getBarWidth(m.cut50) }} title={`-50bp: ${m.cut50}%`} />
                      <div className="bg-negative/60 h-full transition-all" style={{ width: getBarWidth(m.hike25) }} title={`+25bp: ${m.hike25}%`} />
                    </div>
                  </td>
                </tr>
                {isSelected && (
                  <tr className="border-b border-grid-line"><td colSpan={7} className="p-0">
                    <div className="bg-surface-elevated/50 border-t border-accent/20 p-3 animate-in slide-in-from-top-1 duration-200 grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Meeting Details</div>
                        {[{ l: 'Date', v: fmtDate }, { l: 'Implied Rate', v: `${m.impliedRate.toFixed(3)}%` }, { l: 'Current Rate', v: data.currentRate }, { l: 'Expected Move', v: `${((m.impliedRate - 5.46 + (i * 0.08)) * 100).toFixed(0)}bp` }, { l: 'Days Until', v: `${Math.max(1, Math.floor((new Date(m.date).getTime() - Date.now()) / 86400000))}` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono"><span className="text-muted-foreground">{r.l}</span><span className="font-bold text-foreground">{r.v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Scenario Analysis</div>
                        {[{ l: 'Most Likely', v: m.hold > 50 ? 'HOLD' : m.cut25 > m.hike25 ? '-25bp CUT' : '+25bp HIKE', c: m.hold > 50 ? 'text-accent' : m.cut25 > m.hike25 ? 'text-positive' : 'text-negative' }, { l: 'Cumul. Cuts (from here)', v: `${((5.46 - m.impliedRate) * 100).toFixed(0)}bp` }, { l: '2nd Most Likely', v: `${Math.max(m.cut25, m.hold, m.hike25) === m.hold ? (m.cut25 > m.hike25 ? '-25bp' : '+25bp') : 'HOLD'}` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono"><span className="text-muted-foreground">{r.l}</span><span className={`font-bold ${r.c || 'text-foreground'}`}>{r.v}</span></div>
                        ))}
                      </div>
                      <div>
                        <div className="text-[8px] font-mono text-accent font-bold uppercase mb-1">Market Pricing</div>
                        {[{ l: 'OIS Rate', v: `${m.impliedRate.toFixed(3)}%` }, { l: 'FF Futures', v: `${(100 - m.impliedRate).toFixed(3)}` }, { l: '1W Change', v: `${(Math.random() * 6 - 3).toFixed(1)}%` }].map(r => (
                          <div key={r.l} className="flex justify-between py-0.5 text-[9px] font-mono"><span className="text-muted-foreground">{r.l}</span><span className="font-bold text-foreground">{r.v}</span></div>
                        ))}
                      </div>
                    </div>
                  </td></tr>
                )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-[9px] font-mono px-1">
        <div className="flex items-center gap-1"><div className="w-3 h-2 bg-accent/80 rounded-sm" /> Hold</div>
        <div className="flex items-center gap-1"><div className="w-3 h-2 bg-positive/80 rounded-sm" /> Cut 25bp</div>
        <div className="flex items-center gap-1"><div className="w-3 h-2 bg-positive rounded-sm" /> Cut 50bp</div>
        <div className="flex items-center gap-1"><div className="w-3 h-2 bg-negative/60 rounded-sm" /> Hike 25bp</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">{isHiking ? 'NEXT HIKE PRICED' : 'NEXT CUT PRICED'}</div>
          <div className={`text-lg font-mono font-bold ${isHiking ? 'text-negative' : 'text-positive'}`}>{data.summary.nextCut}</div>
          <div className="text-[9px] font-mono text-muted-foreground">{data.summary.nextCutProb} probability</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">MOVES PRICED YE2026</div>
          <div className="text-lg font-mono font-bold text-accent">{data.summary.cutsYE}</div>
        </div>
        <div className="border border-border p-2">
          <div className="text-[9px] font-mono text-muted-foreground">TERMINAL RATE</div>
          <div className="text-lg font-mono font-bold text-foreground">{data.summary.terminalRate}</div>
          <div className="text-[9px] font-mono text-muted-foreground">Dec 2026 implied</div>
        </div>
      </div>
    </div>
  );
}
