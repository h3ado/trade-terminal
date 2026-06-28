// Full GEX cockpit — composes all GEX panels with shared expiry filter + strike drill-down.
import { useMemo, useRef, useState } from "react";
import {
  gexSpot, gexStrikes, gexTermGrid, aggregateByStrike, gexIntraday, gexKeyLevels,
  GEX_EXPIRY_GROUPS, fmtUsd,
} from "../shared/mockSeries";
import GexKpiPanel from "../GexKpiPanel";
import GexExpiryFilter, { GexExpiryFilterKey } from "./GexExpiryFilter";
import GexExportBar from "./GexExportBar";
import GexMainChart from "./GexMainChart";
import GexTermHeatmap from "./GexTermHeatmap";
import GexIntradayEvolution from "./GexIntradayEvolution";
import VannaCharmProfiles from "./VannaCharmProfiles";
import OptionDetailDrawer from "../shared/OptionDetailDrawer";
import LiveDataBar from "../LiveDataBar";
import { useIbkrGex } from "@/hooks/useIbkrGex";

interface Props { ticker: string; redact?: boolean }

export default function GexCockpit({ ticker, redact }: Props) {
  const [filter, setFilter] = useState<GexExpiryFilterKey>("ALL");
  const [drillStrike, setDrillStrike] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const ibkrGex = useIbkrGex();

  const { spot, strikes, allCells, cells, agg, levels, intraday } = useMemo(() => {
    const live = ibkrGex.data;
    if (live && live.loadedTicker === ticker) {
      const expiries = GEX_EXPIRY_GROUPS[filter];
      const filteredCells = live.cells.filter((c) => expiries.includes(c.expiry));
      const filteredAgg = aggregateByStrike(filteredCells);
      const liveStrikes = [...new Set(live.cells.map((c) => c.strike))].sort((a, b) => a - b);
      return {
        spot: live.spot,
        strikes: liveStrikes,
        allCells: live.cells,
        cells: filteredCells,
        agg: filteredAgg,
        levels: live.levels,
        intraday: gexIntraday(ticker, live.spot, 78),
      };
    }
    const spot = gexSpot(ticker);
    const strikes = gexStrikes(spot, 21, 2);
    const allCells = gexTermGrid(ticker, spot, strikes);
    const expiries = GEX_EXPIRY_GROUPS[filter];
    const cells = allCells.filter((c) => expiries.includes(c.expiry));
    const agg = aggregateByStrike(cells);
    const levels = gexKeyLevels(ticker, spot, agg);
    const intraday = gexIntraday(ticker, spot, 78);
    return { spot, strikes, allCells, cells, agg, levels, intraday };
  }, [ticker, filter, ibkrGex.data]);

  const vcRows = agg.map((a) => ({ strike: a.strike, vanna: a.vanna, charm: a.charm }));

  const drillContributors = drillStrike == null ? [] : allCells.filter((c) => c.strike === drillStrike);

  return (
    <div ref={ref} className="space-y-3">
      <GexKpiPanel ticker={ticker} redact={redact} />

      <LiveDataBar
        ticker={ticker}
        loading={ibkrGex.loading}
        error={ibkrGex.error}
        loadedTicker={ibkrGex.data?.loadedTicker ?? null}
        ts={ibkrGex.data?.ts ?? null}
        isLive={ibkrGex.isLive}
        onLoad={() => ibkrGex.load(ticker)}
      />

      <div className="card-terminal p-2 flex flex-wrap items-center justify-between gap-2">
        <GexExpiryFilter value={filter} onChange={setFilter} />
        <GexExportBar ticker={ticker} cells={cells} targetRef={ref} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <GexMainChart ticker={ticker} data={agg} levels={levels} onSelectStrike={setDrillStrike} redact={redact} />
        <GexTermHeatmap ticker={ticker} cells={cells} strikes={strikes} expiries={GEX_EXPIRY_GROUPS[filter]} spot={spot} onSelectStrike={setDrillStrike} redact={redact} />
      </div>

      <GexIntradayEvolution ticker={ticker} data={intraday} spot={spot} redact={redact} />

      <VannaCharmProfiles ticker={ticker} data={vcRows} spot={spot} redact={redact} />

      <OptionDetailDrawer
        open={drillStrike != null}
        onOpenChange={(o) => !o && setDrillStrike(null)}
        code="GEX"
        title={drillStrike != null ? `${ticker} ${drillStrike} STRIKE` : ""}
        subtitle="Per-expiry contributors · OI · Δ-hedge · Vanna · Charm"
        kpis={drillStrike != null ? (() => {
          const tot = drillContributors.reduce((a, c) => ({
            gex: a.gex + c.gex, oi: a.oi + c.oi, vol: a.vol + c.vol, hedge: a.hedge + c.hedge,
          }), { gex: 0, oi: 0, vol: 0, hedge: 0 });
          return [
            { label: "$GEX", value: fmtUsd(tot.gex), tone: tot.gex >= 0 ? "up" : "down" } as const,
            { label: "OI", value: tot.oi.toLocaleString(), tone: "neutral" } as const,
            { label: "Δ-HEDGE", value: `${Math.abs(tot.hedge).toLocaleString()} sh`, tone: "accent" } as const,
          ];
        })() : []}
      >
        {drillStrike != null && (
          <div className="border border-border bg-surface-elevated">
            <table className="w-full text-[10px] font-mono">
              <thead className="bg-surface-deep">
                <tr className="text-muted-foreground">
                  <th className="px-2 py-1 text-left">Expiry</th>
                  <th className="px-2 py-1 text-right">$GEX</th>
                  <th className="px-2 py-1 text-right">OI</th>
                  <th className="px-2 py-1 text-right">Δ-hdg</th>
                  <th className="px-2 py-1 text-right">Vanna</th>
                  <th className="px-2 py-1 text-right">Charm</th>
                </tr>
              </thead>
              <tbody>
                {drillContributors.map((c) => (
                  <tr key={c.expiry} className="border-t border-border">
                    <td className="px-2 py-1">{c.expiry}</td>
                    <td className={`px-2 py-1 text-right tabular-nums ${c.gex >= 0 ? "text-up" : "text-down"}`}>{fmtUsd(c.gex)}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{c.oi.toLocaleString()}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{c.hedge >= 0 ? "+" : ""}{c.hedge.toLocaleString()}</td>
                    <td className={`px-2 py-1 text-right tabular-nums ${c.vanna >= 0 ? "text-up" : "text-down"}`}>{fmtUsd(c.vanna)}</td>
                    <td className={`px-2 py-1 text-right tabular-nums ${c.charm >= 0 ? "text-up" : "text-down"}`}>{fmtUsd(c.charm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OptionDetailDrawer>
    </div>
  );
}
