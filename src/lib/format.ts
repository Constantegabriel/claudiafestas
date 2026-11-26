const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(value: number | null): string {
  return value === null ? 'Sob consulta' : brl.format(value);
}

/** Aceita "29,90", "1.299,90", "R$ 15" ou "15.5". Vazio → `null`. */
export function parsePrice(text: string): number | null {
  let s = text.replace(/[R$\s]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** Preço → texto editável no formulário ("29,90"). */
export function priceToInput(value: number | null): string {
  return value === null ? '' : value.toFixed(2).replace('.', ',');
}

/** Minúsculas e sem acentos, para a busca. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function newId(): string {
  return crypto.randomUUID();
}
