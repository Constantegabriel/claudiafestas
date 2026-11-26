export interface Variation {
  id: string;
  name: string;
  /** Preço próprio da variação. `null` = usa o preço do produto. */
  price: number | null;
}

/**
 * Foto + como ela aparece no quadro 1:1 da loja. O arquivo original não é alterado.
 * - `x`, `y`: ponto da foto (0 a 1) que fica no centro do quadro
 * - `zoom`: 1 = a foto preenche o quadro sem sobras; maior = aproxima
 * - `fit`: 'cover' corta para preencher; 'contain' mostra a foto inteira com fundo branco
 */
export interface ProductImage {
  url: string;
  x: number;
  y: number;
  zoom: number;
  fit: 'cover' | 'contain';
}

export const DEFAULT_CROP = { x: 0.5, y: 0.5, zoom: 1, fit: 'cover' as const };

/** Aceita o formato antigo (só a URL, texto) e o novo (objeto). */
export function toImage(value: unknown): ProductImage | null {
  if (typeof value === 'string') return value ? { url: value, ...DEFAULT_CROP } : null;
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<ProductImage>;
  if (typeof v.url !== 'string' || !v.url) return null;
  const num = (n: unknown, d: number) => (typeof n === 'number' && Number.isFinite(n) ? n : d);
  return {
    url: v.url,
    x: Math.min(1, Math.max(0, num(v.x, 0.5))),
    y: Math.min(1, Math.max(0, num(v.y, 0.5))),
    zoom: Math.min(4, Math.max(1, num(v.zoom, 1))),
    fit: v.fit === 'contain' ? 'contain' : 'cover',
  };
}

export function toImages(value: unknown): ProductImage[] {
  return Array.isArray(value) ? value.map(toImage).filter((i): i is ProductImage => i !== null) : [];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  /** `null` = "preço sob consulta". */
  price: number | null;
  /** Fotos; a primeira é a principal. */
  images: ProductImage[];
  /** Nome do grupo de variações, ex.: "Tamanho", "Cor". */
  variationLabel: string;
  variations: Variation[];
  active: boolean;
  createdAt: string;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt'> & { id?: string };

export interface StoreSettings {
  storeName: string;
  /** Número com DDD (e DDI opcional), ex.: 11 99999-0000. */
  whatsapp: string;
  /** Texto curto abaixo do nome, opcional. */
  tagline: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Claudia Festas',
  whatsapp: '',
  tagline: '',
};
