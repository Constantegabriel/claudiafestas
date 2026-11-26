import { ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { cartTotal } from '@/lib/whatsapp';

/** Barra fixa no rodapé do celular quando há itens no carrinho. */
export function CartBar() {
  const { items, count, isOpen, setOpen } = useCart();
  if (count === 0) return null;
  const { total, hasUnpriced } = cartTotal(items);
  return (
    <>
      <div className="cart-bar-spacer" aria-hidden />
      <button className={`cart-bar ${isOpen ? 'hidden' : ''}`} onClick={() => setOpen(true)}>
      <span className="cart-bar-icon">
        <ShoppingCart size={20} />
        <span className="badge">{count > 99 ? '99+' : count}</span>
      </span>
      <span className="cart-bar-text">
        <strong>Ver carrinho</strong>
        <small>
          {formatPrice(total)}
          {hasUnpriced && ' + a consultar'}
        </small>
      </span>
      <ChevronRight size={22} />
      </button>
    </>
  );
}
