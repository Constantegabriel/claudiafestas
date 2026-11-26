import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import { repo } from '@/data';
import { newId, parsePrice, priceToInput } from '@/lib/format';
import type { Product, ProductInput } from '@/lib/types';

interface VariationDraft {
  id: string;
  name: string;
  price: string;
}

interface Props {
  product: Product | null;
  categories: string[];
  onSaved: (p: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSaved, onCancel }: Props) {
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(priceToInput(product?.price ?? null));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variationLabel, setVariationLabel] = useState(product?.variationLabel ?? '');
  const [variations, setVariations] = useState<VariationDraft[]>(
    (product?.variations ?? []).map((v) => ({ id: v.id, name: v.name, price: priceToInput(v.price) })),
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const url = await repo.uploadImage(file);
        setImages((prev) => [...prev, url]);
      } catch (e) {
        setError(`Não foi possível enviar "${file.name}": ${(e as Error).message}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  const updateVariation = (id: string, patch: Partial<VariationDraft>) =>
    setVariations((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Informe o nome do produto.');
    if (price.trim() && parsePrice(price) === null) return setError('Preço inválido. Use o formato 29,90.');
    const bad = variations.find((v) => v.price.trim() && parsePrice(v.price) === null);
    if (bad) return setError(`Preço inválido na variação "${bad.name || 'sem nome'}".`);

    const input: ProductInput = {
      id: product?.id,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: parsePrice(price),
      images,
      variationLabel: variationLabel.trim(),
      variations: variations
        .filter((v) => v.name.trim())
        .map((v) => ({ id: v.id, name: v.name.trim(), price: parsePrice(v.price) })),
      active,
    };
    setSaving(true);
    setError(null);
    try {
      onSaved(await repo.saveProduct(input));
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-form-head">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={onCancel}>
          <ArrowLeft size={22} />
        </button>
        <h2>{product ? 'Editar produto' : 'Novo produto'}</h2>
      </div>

      <section className="panel">
        <label className="field">
          <span>Nome *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus={!product} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Categoria</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} list="categories" placeholder="Ex.: Camisetas" />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Preço (R$)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Vazio = sob consulta"
            />
          </label>
        </div>
        <label className="field">
          <span>Descrição</span>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>Visível na loja</span>
        </label>
      </section>

      <section className="panel">
        <h3>Fotos</h3>
        <p className="muted small">A primeira foto é a principal. Toque na estrela para escolher outra.</p>
        <div className="photo-grid">
          {images.map((src, i) => (
            <div key={src} className={`photo ${i === 0 ? 'main' : ''}`}>
              <img src={src} alt="" />
              <button
                type="button"
                className="photo-btn star"
                aria-label="Usar como foto principal"
                onClick={() => setImages((prev) => [src, ...prev.filter((s) => s !== src)])}
              >
                <Star size={14} fill={i === 0 ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className="photo-btn remove"
                aria-label="Remover foto"
                onClick={() => setImages((prev) => prev.filter((s) => s !== src))}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <div key={`up${i}`} className="photo loading">
              <Loader2 size={22} className="spin" />
            </div>
          ))}
          <button type="button" className="photo add" onClick={() => fileInput.current?.click()}>
            <ImagePlus size={24} />
            <span>Adicionar</span>
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addPhotos(e.target.files)}
        />
      </section>

      <section className="panel">
        <h3>Variações</h3>
        <p className="muted small">
          Opcional. Ex.: tamanhos P, M, G ou cores. Deixe o preço vazio para usar o preço do produto.
        </p>
        {(variations.length > 0 || variationLabel) && (
          <label className="field">
            <span>Nome do grupo</span>
            <input value={variationLabel} onChange={(e) => setVariationLabel(e.target.value)} placeholder="Ex.: Tamanho" />
          </label>
        )}
        {variations.map((v) => (
          <div key={v.id} className="variation-row">
            <input
              value={v.name}
              onChange={(e) => updateVariation(v.id, { name: e.target.value })}
              placeholder="Opção (ex.: M)"
              aria-label="Nome da variação"
            />
            <input
              value={v.price}
              onChange={(e) => updateVariation(v.id, { price: e.target.value })}
              placeholder="Preço"
              inputMode="decimal"
              aria-label="Preço da variação"
            />
            <button
              type="button"
              className="icon-btn danger"
              aria-label="Remover variação"
              onClick={() => setVariations((prev) => prev.filter((x) => x.id !== v.id))}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn outline"
          onClick={() => setVariations((prev) => [...prev, { id: newId(), name: '', price: '' }])}
        >
          <Plus size={18} /> Adicionar variação
        </button>
      </section>

      {error && <div className="alert error">{error}</div>}

      <div className="admin-form-actions">
        <button type="button" className="btn outline" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn primary" disabled={saving || uploading > 0}>
          {saving ? 'Salvando…' : uploading > 0 ? 'Enviando fotos…' : 'Salvar produto'}
        </button>
      </div>
    </form>
  );
}
