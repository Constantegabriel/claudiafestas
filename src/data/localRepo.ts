import { blobToDataUrl, resizeImage } from '@/lib/image';
import { newId } from '@/lib/format';
import { DEFAULT_SETTINGS, type Product, type StoreSettings } from '@/lib/types';
import { sortProducts, type CatalogRepo } from './repo';

const PRODUCTS = 'catalogo:products';
const SETTINGS = 'catalogo:settings';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error('Sem espaço no navegador. Remova algumas fotos ou configure o Supabase.');
  }
}

/** Tudo salvo só neste navegador. Usado quando o Supabase não está configurado. */
export function createLocalRepo(): CatalogRepo {
  return {
    async listProducts(opts) {
      const all = read<Product[]>(PRODUCTS, []);
      return sortProducts(opts?.includeInactive ? all : all.filter((p) => p.active));
    },
    async saveProduct(input) {
      const all = read<Product[]>(PRODUCTS, []);
      const existing = input.id ? all.find((p) => p.id === input.id) : undefined;
      const product: Product = {
        ...input,
        id: existing?.id ?? newId(),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      write(PRODUCTS, existing ? all.map((p) => (p.id === product.id ? product : p)) : [...all, product]);
      return product;
    },
    async removeProduct(product) {
      write(PRODUCTS, read<Product[]>(PRODUCTS, []).filter((p) => p.id !== product.id));
    },
    async uploadImage(file) {
      // Menor que na nuvem, porque o navegador guarda só ~5 MB.
      return blobToDataUrl(await resizeImage(file, 800, 0.75));
    },
    async getSettings() {
      return { ...DEFAULT_SETTINGS, ...read<Partial<StoreSettings>>(SETTINGS, {}) };
    },
    async saveSettings(settings) {
      write(SETTINGS, settings);
    },
  };
}
