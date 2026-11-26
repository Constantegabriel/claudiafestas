export interface Variation {
  id: string;
  name: string;
  /** Preço próprio da variação. `null` = usa o preço do produto. */
  price: number | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  /** `null` = "preço sob consulta". */
  price: number | null;
  /** URLs das fotos; a primeira é a principal. */
  images: string[];
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
