import type { Product, ProductInput, StoreSettings } from '@/lib/types';

export interface CatalogRepo {
  /** Na loja só os ativos; no admin, `includeInactive` traz todos. */
  listProducts(opts?: { includeInactive?: boolean }): Promise<Product[]>;
  saveProduct(input: ProductInput): Promise<Product>;
  removeProduct(product: Product): Promise<void>;
  /** Envia a foto (já reduzida) e devolve a URL pública. */
  uploadImage(file: File): Promise<string>;
  getSettings(): Promise<StoreSettings>;
  saveSettings(settings: StoreSettings): Promise<void>;
}

export function sortProducts(list: Product[]): Product[] {
  return [...list].sort(
    (a, b) => a.category.localeCompare(b.category, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'),
  );
}
