import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import type { StoreSettings } from '@/lib/types';

interface Props {
  settings: StoreSettings;
  query: string;
  onQuery: (q: string) => void;
  onMenu: () => void;
}

export function Header({ settings, query, onQuery, onMenu }: Props) {
  const { count, setOpen } = useCart();
  return (
    <header className="header">
      <div className="header-row container">
        <button className="icon-btn" aria-label="Abrir menu" onClick={onMenu}>
          <Menu size={24} />
        </button>
        <a href="/" className="brand">
          <span className="brand-name">{settings.storeName}</span>
          {settings.tagline && <span className="brand-tagline">{settings.tagline}</span>}
        </a>
        <button className="icon-btn cart-btn" aria-label={`Abrir carrinho (${count} itens)`} onClick={() => setOpen(true)}>
          <ShoppingCart size={24} />
          {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
        </button>
      </div>
      <div className="container search-wrap">
        <label className="search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            placeholder="Buscar produtos…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            aria-label="Buscar produtos"
          />
          {query && (
            <button className="search-clear" aria-label="Limpar busca" onClick={() => onQuery('')}>
              <X size={16} />
            </button>
          )}
        </label>
      </div>
    </header>
  );
}
