import type { CartItem } from '@/cart/CartContext';
import { formatPrice } from './format';

/** Só dígitos; se vier sem DDI (10–11 dígitos), assume Brasil (55). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function cartTotal(items: CartItem[]): { total: number; hasUnpriced: boolean } {
  let total = 0;
  let hasUnpriced = false;
  for (const it of items) {
    if (it.unitPrice === null) hasUnpriced = true;
    else total += it.unitPrice * it.qty;
  }
  return { total, hasUnpriced };
}

export function buildOrderMessage(items: CartItem[], customer: { name: string; notes: string }): string {
  const lines = ['Olá! Gostaria de fazer este pedido:', ''];
  for (const it of items) {
    const label = it.variation ? `${it.name} (${it.variation})` : it.name;
    const price = it.unitPrice === null ? 'preço a consultar' : formatPrice(it.unitPrice * it.qty);
    lines.push(`• ${it.qty}x ${label} — ${price}`);
  }
  const { total, hasUnpriced } = cartTotal(items);
  lines.push('', `*Total: ${formatPrice(total)}*${hasUnpriced ? ' + itens a consultar' : ''}`);
  if (customer.name.trim()) lines.push('', `Nome: ${customer.name.trim()}`);
  if (customer.notes.trim()) lines.push(`Observações: ${customer.notes.trim()}`);
  return lines.join('\n');
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
