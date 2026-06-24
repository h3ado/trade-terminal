import EconOverview from '@/components/macro/EconOverview';
import WorldMarkets from '@/components/macro/WorldMarkets';
import YieldCurve from '@/components/macro/YieldCurve';
import FXMatrix from '@/components/macro/FXMatrix';
import Commodities from '@/components/macro/Commodities';
import CentralBanks from '@/components/macro/CentralBanks';
import EconCalendar from '@/components/macro/EconCalendar';
import SectorHeatmap from '@/components/macro/SectorHeatmap';
import FedWatch from '@/components/macro/FedWatch';
import VolatilitySurface from '@/components/macro/VolatilitySurface';
import CreditMarkets from '@/components/macro/CreditMarkets';
import GlobalPMI from '@/components/macro/GlobalPMI';
import LaborMarket from '@/components/macro/LaborMarket';
import HousingMarket from '@/components/macro/HousingMarket';
import MoneyMarkets from '@/components/macro/MoneyMarkets';
import GlobalGDP from '@/components/macro/GlobalGDP';
import InflationMonitor from '@/components/macro/InflationMonitor';
import TradeFlow from '@/components/macro/TradeFlow';
import SovereignRisk from '@/components/macro/SovereignRisk';
import GlobalRates from '@/components/macro/GlobalRates';
import SupplyChain from '@/components/macro/SupplyChain';
import Sentiment from '@/components/macro/Sentiment';
import FiscalPolicy from '@/components/macro/FiscalPolicy';
import DebtMonitor from '@/components/macro/DebtMonitor';
import Crypto from '@/components/macro/Crypto';
import RealRatesMonitor from '@/components/macro/RealRatesMonitor';
import BalanceOfPayments from '@/components/macro/BalanceOfPayments';
import EnergyBalance from '@/components/macro/EnergyBalance';
import ManufacturingOrders from '@/components/macro/ManufacturingOrders';
import ConsumerHealth from '@/components/macro/ConsumerHealth';
import FinancialConditions from '@/components/macro/FinancialConditions';
import WorldEquityIndices from '@/components/macro/WorldEquityIndices';
import WorldEquityFutures from '@/components/macro/WorldEquityFutures';
import WorldEquityValuations from '@/components/macro/WorldEquityValuations';
import { MacroTab } from '@/components/TopNav';

interface Props {
  activeTab: MacroTab;
}

export default function MacroView({ activeTab }: Props) {
  switch (activeTab) {
    case 'overview': return <EconOverview />;
    case 'markets': return <WorldMarkets />;
    case 'yields': return <YieldCurve />;
    case 'fx': return <FXMatrix />;
    case 'commodities': return <Commodities />;
    case 'central': return <CentralBanks />;
    case 'calendar': return <EconCalendar />;
    case 'sectors': return <SectorHeatmap />;
    case 'fedwatch': return <FedWatch />;
    case 'volatility': return <VolatilitySurface />;
    case 'credit': return <CreditMarkets />;
    case 'pmi': return <GlobalPMI />;
    case 'labor': return <LaborMarket />;
    case 'housing': return <HousingMarket />;
    case 'money': return <MoneyMarkets />;
    case 'gdp': return <GlobalGDP />;
    case 'inflation': return <InflationMonitor />;
    case 'tradeflow': return <TradeFlow />;
    case 'sovereign': return <SovereignRisk />;
    case 'globalrates': return <GlobalRates />;
    case 'supplychain': return <SupplyChain />;
    case 'sentiment': return <Sentiment />;
    case 'fiscal': return <FiscalPolicy />;
    case 'debt': return <DebtMonitor />;
    case 'crypto': return <Crypto />;
    case 'realrates': return <RealRatesMonitor />;
    case 'bop': return <BalanceOfPayments />;
    case 'energy': return <EnergyBalance />;
    case 'mfg': return <ManufacturingOrders />;
    case 'consumer': return <ConsumerHealth />;
    case 'fci': return <FinancialConditions />;
    case 'wei': return <WorldEquityIndices />;
    case 'weif': return <WorldEquityFutures />;
    case 'wpe': return <WorldEquityValuations />;
    default: return <EconOverview />;
  }
}
