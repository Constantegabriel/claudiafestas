import { ChevronRight, MessageCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import { whatsappLink } from '@/lib/whatsapp';
import type { StoreSettings } from '@/lib/types';
import { Drawer } from './Drawer';

interface Props {
  open: boolean;
  onClose: () => void;
  settings: StoreSettings;
  categories: string[];
  activeCategory: string | null;
  onCategory: (c: string | null) => void;
}

export function MobileMenu({ open, onClose, settings, categories, activeCategory, onCategory }: Props) {
  const { setOpen: setCartOpen, count } = useCart();
  const pick = (c: string | null) => {
    onCategory(c);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Drawer open={open} onClose={onClose} side="left" title={settings.storeName}>
      <nav className="menu">
        <p className="menu-label">Categorias</p>
        <button className={`menu-item ${activeCategory === null ? 'active' : ''}`} onClick={() => pick(null)}>
          Todos os produtos <ChevronRight size={18} />
        </button>
        {categories.map((c) => (
          <button key={c} className={`menu-item ${activeCategory === c ? 'active' : ''}`} onClick={() => pick(c)}>
            {c} <ChevronRight size={18} />
          </button>
        ))}

        <p className="menu-label">Pedido</p>
        <button
          className="menu-item"
          onClick={() => {
            onClose();
            setCartOpen(true);
          }}
        >
          <span className="menu-icon">
            <ShoppingCart size={18} /> Meu carrinho {count > 0 && <span className="pill">{count}</span>}
          </span>
          <ChevronRight size={18} />
        </button>
        {settings.whatsapp && (
          <a
            className="menu-item"
            href={whatsappLink(settings.whatsapp, 'Olá! Vim pelo catálogo e tenho uma dúvida.')}
            target="_blank"
            rel="noreferrer"
          >
            <span className="menu-icon">
              <MessageCircle size={18} /> Falar no WhatsApp
            </span>
            <ChevronRight size={18} />
          </a>
        )}
      </nav>
    </Drawer>
  );
}
