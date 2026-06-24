// Composition wrapper for the Volatility Arbitrage Lab.
import VolConeChart from "./VolConeChart";
import IvRvSpread from "./IvRvSpread";
import DispersionPanel from "./DispersionPanel";
import TermRolldown from "./TermRolldown";

interface Props { ticker: string; redact?: boolean; }

export default function VarbWorkspace({ ticker, redact = false }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <VolConeChart ticker={ticker} redact={redact} />
      <IvRvSpread ticker={ticker} redact={redact} />
      <DispersionPanel ticker={ticker} redact={redact} />
      <TermRolldown ticker={ticker} redact={redact} />
    </div>
  );
}
