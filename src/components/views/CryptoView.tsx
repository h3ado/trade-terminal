import { useEffect } from 'react';
import { CryptoTab, cryptoTabs } from '@/components/CryptoNav';
import CryptoHome        from '@/components/crypto/CryptoHome';
import CryptoMarkets     from '@/components/crypto/CryptoMarkets';
import CryptoBTC         from '@/components/crypto/CryptoBTC';
import CryptoETH         from '@/components/crypto/CryptoETH';
import CryptoDeFi        from '@/components/crypto/CryptoDeFi';
import CryptoDerivatives from '@/components/crypto/CryptoDerivatives';
import CryptoSentiment   from '@/components/crypto/CryptoSentiment';
import CryptoNews        from '@/components/crypto/CryptoNews';

interface Props {
  activeTab: CryptoTab;
  onTabChange?: (t: CryptoTab) => void;
}

const FKEY_MAP: { key: string; id: CryptoTab }[] = [
  { key: 'F1', id: 'home'    },
  { key: 'F2', id: 'markets' },
  { key: 'F3', id: 'btc'     },
  { key: 'F4', id: 'eth'     },
  { key: 'F5', id: 'defi'    },
  { key: 'F6', id: 'deriv'   },
  { key: 'F7', id: 'sent'    },
  { key: 'F8', id: 'news'    },
];

function renderTab(tab: CryptoTab) {
  switch (tab) {
    case 'home':    return <CryptoHome />;
    case 'markets': return <CryptoMarkets />;
    case 'btc':     return <CryptoBTC />;
    case 'eth':     return <CryptoETH />;
    case 'defi':    return <CryptoDeFi />;
    case 'deriv':   return <CryptoDerivatives />;
    case 'sent':    return <CryptoSentiment />;
    case 'news':    return <CryptoNews />;
    default:        return <CryptoHome />;
  }
}

export default function CryptoView({ activeTab, onTabChange }: Props) {
  const meta = cryptoTabs.find(t => t.id === activeTab) ?? cryptoTabs[0];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable);
      if (inField) return;
      const match = FKEY_MAP.find(m => m.key === e.key);
      if (!match) return;
      e.preventDefault();
      onTabChange?.(match.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTabChange]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        {renderTab(activeTab)}
      </div>

      {/* Bloomberg footer bar */}
      <div className="flex items-center gap-3 border-t border-border bg-surface-deep px-2 py-0.5 flex-shrink-0 text-[9px] font-mono text-muted-foreground overflow-x-auto uppercase tracking-wider">
        <span className="text-accent font-bold">Crypto Terminal</span>
        <span className="text-muted-foreground/60">{meta.code} &lt;GO&gt;</span>
        <span className="text-muted-foreground/40">·</span>
        {FKEY_MAP.map(({ key, id }) => {
          const m = cryptoTabs.find(t => t.id === id);
          if (!m) return null;
          return (
            <button key={key} onClick={() => onTabChange?.(id)} className="hover:text-accent whitespace-nowrap">
              <span className="text-accent">{key}</span> {m.code}
            </button>
          );
        })}
      </div>
    </div>
  );
}
