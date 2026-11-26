import type { SupabaseClient } from '@supabase/supabase-js';
import { resizeImage } from '@/lib/image';
import { newId } from '@/lib/format';
import { DEFAULT_SETTINGS, type Product, type Variation } from '@/lib/types';
import { sortProducts, type CatalogRepo } from './repo';

const BUCKET = 'produtos';

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number | string | null;
  images: string[] | null;
  variation_label: string;
  variations: Variation[] | null;
  active: boolean;
  created_at: string;
}

function fromRow(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    price: r.price === null ? null : Number(r.price),
    images: r.images ?? [],
    variationLabel: r.variation_label,
    variations: (r.variations ?? []).map((v) => ({ ...v, price: v.price === null ? null : Number(v.price) })),
    active: r.active,
    createdAt: r.created_at,
  };
}

/** Caminho do arquivo dentro do bucket, a partir da URL pública. */
function storagePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

export function createSupabaseRepo(sb: SupabaseClient): CatalogRepo {
  return {
    async listProducts(opts) {
      let q = sb.from('products').select('*');
      if (!opts?.includeInactive) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return sortProducts((data as ProductRow[]).map(fromRow));
    },
    async saveProduct(input) {
      const row = {
        ...(input.id ? { id: input.id } : {}),
        name: input.name,
        description: input.description,
        category: input.category,
        price: input.price,
        images: input.images,
        variation_label: input.variationLabel,
        variations: input.variations,
        active: input.active,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await sb.from('products').upsert(row).select().single();
      if (error) throw error;
      return fromRow(data as ProductRow);
    },
    async removeProduct(product) {
      const { error } = await sb.from('products').delete().eq('id', product.id);
      if (error) throw error;
      const paths = product.images.map(storagePath).filter((p): p is string => p !== null);
      if (paths.length) await sb.storage.from(BUCKET).remove(paths); // limpeza; falha aqui não importa
    },
    async uploadImage(file) {
      const blob = await resizeImage(file, 1200, 0.82);
      const path = `${newId()}.jpg`;
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      });
      if (error) throw error;
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
    async getSettings() {
      const { data, error } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_SETTINGS;
      return { storeName: data.store_name, whatsapp: data.whatsapp, tagline: data.tagline };
    },
    async saveSettings(s) {
      const { error } = await sb
        .from('settings')
        .upsert({ id: 1, store_name: s.storeName, whatsapp: s.whatsapp, tagline: s.tagline });
      if (error) throw error;
    },
  };
}
