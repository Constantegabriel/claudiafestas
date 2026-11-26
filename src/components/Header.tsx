import { Menu, MessageCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import { whatsappLink } from '@/lib/whatsapp';
import type { StoreSettings } from '@/lib/types';
import { Logo } from './Logo';
import { SearchField } from './SearchField';

interface Props {
  settings: StoreSettings;
  query: string;
  onQuery: (q: string) => void;
  onMenu: () => void;
}

/**
 * Celular: linha do logo (rola junto com a página) + barra de busca fixa no topo.
 * Notebook: uma linha só, fixa, com logo, busca, WhatsApp e carrinho.
 */
export function Header({ settings, query, onQuery, onMenu }: Props) {
  const { count, setOpen } = useCart();
  return (
    <>
      <header className="header">
        <div className="container header-row">
          <button className="icon-btn menu-btn" aria-label="Abrir menu" onClick={onMenu}>
            <Menu size={26} />
          </button>
          <a href="/" className="brand" aria-label={`${settings.storeName}, início`}>
            <Logo alt={settings.storeName} />
          </a>
          <div className="header-search-desktop">
            <SearchField value={query} onChange={onQuery} />
          </div>
          {settings.whatsapp && (
            <a
              className="header-link"
              href={whatsappLink(settings.whatsapp, 'Olá! Vim pelo catálogo e tenho uma dúvida.')}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={20} /> Fale conosco
            </a>
          )}
          <button className="cart-btn" aria-label={`Abrir carrinho (${count} itens)`} onClick={() => setOpen(true)}>
            <ShoppingCart size={24} />
            <span className="cart-btn-label">Carrinho</span>
            {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
          </button>
        </div>
      </header>
      <div className="search-sticky">
        <div className="container">
          <SearchField value={query} onChange={onQuery} />
        </div>
      </div>
    </>
  );
}
