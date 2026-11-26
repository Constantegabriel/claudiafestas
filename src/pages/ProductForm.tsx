import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, Star, Trash2, UploadCloud, X } from 'lucide-react';
import { repo } from '@/data';
import { newId, parsePrice, priceToInput } from '@/lib/format';
import type { Product, ProductInput } from '@/lib/types';
import { CartProvider } from '@/cart/CartContext';
import { ProductCard } from '@/components/ProductCard';

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

const DESC_MAX = 400;

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
  const [dragOver, setDragOver] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Alterações não salvas: avisa antes de sair.
  const snapshot = JSON.stringify({ name, category, description, price, images, variationLabel, variations, active });
  const initial = useRef(snapshot);
  const dirty = snapshot !== initial.current;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function cancel() {
    if (dirty && !confirm('Sair sem salvar? As alterações serão perdidas.')) return;
    onCancel();
  }

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

  function movePhoto(i: number, dir: -1 | 1) {
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const updateVariation = (id: string, patch: Partial<VariationDraft>) =>
    setVariations((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  function addVariation() {
    const id = newId();
    setVariations((prev) => [...prev, { id, name: '', price: '' }]);
    setFocusId(id);
  }

  /** Normaliza o preço digitado ao sair do campo ("15" → "15,00"). */
  const tidyPrice = (text: string) => {
    const n = parsePrice(text);
    return n === null ? text : priceToInput(n);
  };

  // O que vai aparecer na loja, para a pré-visualização.
  const preview: Product = useMemo(
    () => ({
      id: product?.id ?? 'preview',
      name: name.trim() || 'Nome do produto',
      category: category.trim(),
      description: description.trim(),
      price: parsePrice(price),
      images,
      variationLabel: variationLabel.trim(),
      variations: variations
        .filter((v) => v.name.trim())
        .map((v) => ({ id: v.id, name: v.name.trim(), price: parsePrice(v.price) })),
      active,
      createdAt: '',
    }),
    [product?.id, name, category, description, price, images, variationLabel, variations, active],
  );

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!name.trim()) return setError('Informe o nome do produto.');
    if (price.trim() && parsePrice(price) === null) return setError('Preço inválido. Use o formato 29,90.');
    const bad = variations.find((v) => v.price.trim() && parsePrice(v.price) === null);
    if (bad) return setError(`Preço inválido na opção "${bad.name || 'sem nome'}".`);

    const input: ProductInput = { ...preview, id: product?.id, name: name.trim() };
    delete (input as Partial<Product>).createdAt;
    setSaving(true);
    setError(null);
    try {
      onSaved(await repo.saveProduct(input));
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const busyLabel = saving ? 'Salvando…' : uploading > 0 ? 'Enviando fotos…' : 'Salvar produto';
  const busy = saving || uploading > 0;

  return (
    <form className="pf" onSubmit={submit} noValidate>
      <div className="pf-top">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={cancel}>
          <ArrowLeft size={22} />
        </button>
        <div className="pf-title">
          <h2>{product ? 'Editar produto' : 'Novo produto'}</h2>
          {dirty && <span className="pf-dirty">Alterações não salvas</span>}
        </div>
        <div className="pf-top-actions">
          <button type="button" className="btn outline" onClick={cancel}>
            Cancelar
          </button>
          <button className="btn primary" disabled={busy}>
            {busyLabel}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert error pf-error" role="alert">
          {error}
        </div>
      )}

      <div className="pf-grid">
        <div className="pf-col">
          <section className="panel pf-info">
            <h3>Informações</h3>
            <label className="field">
              <span>Nome do produto *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!product}
                placeholder="Ex.: Kit 50 balões metalizados"
              />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Categoria</span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  list="categories"
                  placeholder="Ex.: Balões"
                />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                <span>Preço</span>
                <div className="money">
                  <span>R$</span>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    onBlur={() => setPrice(tidyPrice(price))}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </div>
                <small className="hint">Deixe vazio para “Sob consulta”.</small>
              </label>
            </div>
            {categories.length > 0 && (
              <div className="pf-cats">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`chip chip-sm ${category === c ? 'on' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <label className="field">
              <span className="field-label-row">
                Descrição
                <small className={description.length > DESC_MAX ? 'over' : ''}>
                  {description.length}/{DESC_MAX}
                </small>
              </span>
              <textarea
                rows={4}
                value={description}
                maxLength={DESC_MAX + 100}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes que ajudam o cliente a escolher: medidas, material, quantidade…"
              />
            </label>
          </section>

          <section className="panel pf-variations">
            <div className="panel-head">
              <div>
                <h3>Opções / variações</h3>
                <p className="muted small">Ex.: cores, tamanhos, temas. O cliente escolhe uma antes de adicionar.</p>
              </div>
            </div>

            {variations.length > 0 && (
              <>
                <label className="field">
                  <span>Como chamar as opções?</span>
                  <input
                    value={variationLabel}
                    onChange={(e) => setVariationLabel(e.target.value)}
                    placeholder="Ex.: Cor, Tamanho, Tema"
                  />
                </label>
                <div className="var-head" aria-hidden>
                  <span>Opção</span>
                  <span>Preço próprio</span>
                  <span />
                </div>
                {variations.map((v, i) => (
                  <div key={v.id} className="var-row">
                    <input
                      value={v.name}
                      onChange={(e) => updateVariation(v.id, { name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (i === variations.length - 1) addVariation();
                        }
                      }}
                      autoFocus={v.id === focusId}
                      placeholder={`Opção ${i + 1}`}
                      aria-label={`Nome da opção ${i + 1}`}
                    />
                    <div className="money">
                      <span>R$</span>
                      <input
                        value={v.price}
                        onChange={(e) => updateVariation(v.id, { price: e.target.value })}
                        onBlur={() => updateVariation(v.id, { price: tidyPrice(v.price) })}
                        placeholder="Mesmo preço"
                        inputMode="decimal"
                        aria-label={`Preço da opção ${i + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`Remover opção ${i + 1}`}
                      onClick={() => setVariations((prev) => prev.filter((x) => x.id !== v.id))}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <p className="muted small">Preço vazio = mesmo preço do produto. Enter cria a próxima opção.</p>
              </>
            )}
            <button type="button" className="btn outline" onClick={addVariation}>
              <Plus size={18} /> {variations.length ? 'Adicionar opção' : 'Adicionar opções'}
            </button>
          </section>
        </div>

        <div className="pf-col pf-side">
          <section className="panel pf-photos">
            <div className="panel-head">
              <h3>Fotos</h3>
              {images.length > 0 && <span className="muted small">{images.length} foto(s)</span>}
            </div>
            <div
              className={`dropzone ${dragOver ? 'over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addPhotos(e.dataTransfer.files);
              }}
            >
              {images.length > 0 || uploading > 0 ? (
                <div className="photo-grid">
                  {images.map((src, i) => (
                    <div key={src} className={`photo ${i === 0 ? 'is-main' : ''}`}>
                      <img src={src} alt={`Foto ${i + 1}`} />
                      {i === 0 ? (
                        <span className="photo-tag">Principal</span>
                      ) : (
                        <button
                          type="button"
                          className="photo-btn star"
                          aria-label="Usar como foto principal"
                          title="Usar como principal"
                          onClick={() => setImages((prev) => [src, ...prev.filter((s) => s !== src)])}
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="photo-btn remove"
                        aria-label="Remover foto"
                        onClick={() => setImages((prev) => prev.filter((s) => s !== src))}
                      >
                        <X size={14} />
                      </button>
                      {images.length > 1 && (
                        <div className="photo-move">
                          <button type="button" aria-label="Mover para a esquerda" disabled={i === 0} onClick={() => movePhoto(i, -1)}>
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label="Mover para a direita"
                            disabled={i === images.length - 1}
                            onClick={() => movePhoto(i, 1)}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
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
              ) : (
                <button type="button" className="dropzone-empty" onClick={() => fileInput.current?.click()}>
                  <UploadCloud size={34} />
                  <strong>Adicionar fotos</strong>
                  <span className="muted small">Toque para escolher ou arraste as imagens aqui</span>
                </button>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
            {images.length > 1 && <p className="muted small">A primeira foto é a da capa. Use as setas para reordenar.</p>}
          </section>

          <section className="panel pf-visibility">
            <label className="switch">
              <input type="checkbox" role="switch" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span className="switch-track" aria-hidden />
              <span>
                <strong>{active ? 'Visível na loja' : 'Oculto'}</strong>
                <small className="muted">
                  {active ? 'Os clientes conseguem ver e pedir.' : 'Fica salvo, mas não aparece para os clientes.'}
                </small>
              </span>
            </label>
          </section>

          <section className="panel pf-preview">
            <h3>Como fica na loja</h3>
            <div className="preview-box" inert>
              <CartProvider>
                <ProductCard key={preview.variations.map((v) => v.id).join()} product={preview} />
              </CartProvider>
            </div>
          </section>
        </div>
      </div>

      <div className="pf-bottom">
        <button type="button" className="btn outline" onClick={cancel}>
          Cancelar
        </button>
        <button className="btn primary" disabled={busy}>
          {busyLabel}
        </button>
      </div>
    </form>
  );
}
