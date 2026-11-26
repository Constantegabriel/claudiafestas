import { useState } from 'react';
import { ImageOff, MessageCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { buildOrderMessage, cartTotal, whatsappLink } from '@/lib/whatsapp';
import type { StoreSettings } from '@/lib/types';
import { Drawer } from './Drawer';
import { QtyStepper } from './QtyStepper';

export function CartDrawer({ settings }: { settings: StoreSettings }) {
  const { items, isOpen, setOpen, setQty, remove, clear } = useCart();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const { total, hasUnpriced } = cartTotal(items);
  const canSend = items.length > 0 && Boolean(settings.whatsapp);
  const link = canSend ? whatsappLink(settings.whatsapp, buildOrderMessage(items, { name, notes })) : undefined;

  const footer =
    items.length > 0 ? (
      <>
        <div className="total-row">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        {hasUnpriced && <p className="muted small">+ itens com preço a consultar</p>}
        {settings.whatsapp ? (
          <a className="btn whatsapp block" href={link} target="_blank" rel="noreferrer">
            <MessageCircle size={20} /> Enviar pedido pelo WhatsApp
          </a>
        ) : (
          <p className="alert">A loja ainda não informou o número de WhatsApp.</p>
        )}
      </>
    ) : null;

  return (
    <Drawer open={isOpen} onClose={() => setOpen(false)} side="right" title="Seu carrinho" footer={footer}>
      {items.length === 0 ? (
        <div className="empty">
          <ShoppingCart size={40} />
          <p>Seu carrinho está vazio.</p>
          <button className="btn outline" onClick={() => setOpen(false)}>
            Ver produtos
          </button>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((it) => (
              <li key={it.key} className="cart-item">
                {it.image ? <img src={it.image} alt="" /> : <div className="cart-thumb"><ImageOff size={18} /></div>}
                <div className="cart-info">
                  <p className="cart-name">{it.name}</p>
                  {it.variation && <p className="muted small">{it.variation}</p>}
                  <p className="cart-price">
                    {it.unitPrice === null ? 'Sob consulta' : formatPrice(it.unitPrice * it.qty)}
                  </p>
                  <div className="cart-controls">
                    <QtyStepper small value={it.qty} onChange={(n) => setQty(it.key, n)} />
                    <button className="icon-btn danger" aria-label={`Remover ${it.name}`} onClick={() => remove(it.key)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="checkout-fields">
            <label className="field">
              <span>Seu nome (opcional)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="field">
              <span>Observações (opcional)</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: entrega, forma de pagamento…"
              />
            </label>
          </div>

          <button
            className="link-btn muted small"
            onClick={() => {
              if (confirm('Esvaziar o carrinho?')) clear();
            }}
          >
            Esvaziar carrinho
          </button>
        </>
      )}
    </Drawer>
  );
}
