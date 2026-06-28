export type CryptoTab =
  | 'home' | 'markets' | 'btc' | 'eth' | 'defi' | 'deriv' | 'sent' | 'news';

export const cryptoTabs: { id: CryptoTab; label: string; code: string }[] = [
  { id: 'home',    label: 'Overview',     code: 'CRYP'  },
  { id: 'markets', label: 'Markets',      code: 'MKTD'  },
  { id: 'btc',     label: 'Bitcoin',      code: 'BTC'   },
  { id: 'eth',     label: 'Ethereum',     code: 'ETH'   },
  { id: 'defi',    label: 'DeFi',         code: 'DEFI'  },
  { id: 'deriv',   label: 'Derivatives',  code: 'FRAT'  },
  { id: 'sent',    label: 'Sentiment',    code: 'CRYS'  },
  { id: 'news',    label: 'News',         code: 'CRNW'  },
];

interface Props {
  activeTab: CryptoTab;
  onTabChange: (t: CryptoTab) => void;
}

export default function CryptoNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="bg-background border-b border-border px-2 flex gap-3 overflow-x-auto items-center h-6 flex-shrink-0">
      {cryptoTabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors flex-shrink-0
              ${isActive
                ? 'text-accent border-accent font-bold'
                : 'text-muted-foreground border-transparent hover:text-foreground'}`}
          >
            {tab.code}
          </button>
        );
      })}
    </nav>
  );
}
