import { useEffect, useRef, useState } from 'react';
import { Check, ImageOff, ShoppingCart } from 'lucide-react';
import { useCart } from '@/cart/CartContext';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { QtyStepper } from './QtyStepper';
import { Lightbox } from './Lightbox';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const hasVariations = product.variations.length > 0;
  const [variationId, setVariationId] = useState<string | null>(hasVariations ? null : '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [needChoice, setNeedChoice] = useState(false);
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const variation = product.variations.find((v) => v.id === variationId) ?? null;
  const unitPrice = variation?.price ?? product.price;
  const label = product.variationLabel || 'Opção';

  // Se as variações têm preços diferentes e nenhuma foi escolhida, mostra "a partir de".
  const prices = product.variations.map((v) => v.price ?? product.price).filter((p): p is number => p !== null);
  const fromPrice = !variation && prices.length > 1 && new Set(prices).size > 1 ? Math.min(...prices) : null;

  function addToCart() {
    if (hasVariations && !variation) {
      setNeedChoice(true);
      return;
    }
    add({
      productId: product.id,
      name: product.name,
      variation: variation?.name ?? null,
      unitPrice,
      image: product.images[0] ?? null,
      qty,
    });
    setQty(1);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="card">
      <div className="card-media">
        {product.images.length ? (
          <>
            <div
              className="gallery"
              onScroll={(e) => {
                const el = e.currentTarget;
                setPhoto(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {product.images.map((src, i) => (
                <button key={src} className="gallery-slide" onClick={() => setZoom(i)} aria-label={`Ampliar foto ${i + 1}`}>
                  <img src={src} alt={i === 0 ? product.name : ''} loading="lazy" />
                </button>
              ))}
            </div>
            {product.images.length > 1 && (
              <div className="dots" aria-hidden>
                {product.images.map((src, i) => (
                  <span key={src} className={i === photo ? 'on' : ''} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-photo">
            <ImageOff size={28} />
          </div>
        )}
      </div>

      <div className="card-body">
        {product.category && <span className="card-cat">{product.category}</span>}
        <h3 className="card-title">{product.name}</h3>
        {product.description && <p className="card-desc">{product.description}</p>}
        <p className="card-price">
          {fromPrice !== null ? (
            <>
              <small>a partir de</small> {formatPrice(fromPrice)}
            </>
          ) : (
            formatPrice(unitPrice)
          )}
        </p>

        {hasVariations && (
          <div className="variations" role="radiogroup" aria-label={label}>
            <span className={`variations-label ${needChoice ? 'warn' : ''}`}>
              {needChoice ? `Escolha ${label.toLowerCase()}:` : `${label}:`}
            </span>
            <div className="chips">
              {product.variations.map((v) => (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={variationId === v.id}
                  className={`chip ${variationId === v.id ? 'on' : ''}`}
                  onClick={() => {
                    setVariationId(v.id);
                    setNeedChoice(false);
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card-actions">
        <QtyStepper value={qty} onChange={setQty} />
        <button className={`btn primary add-btn ${added ? 'done' : ''}`} onClick={addToCart}>
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {added ? 'Adicionado' : 'Adicionar'}
        </button>
      </div>

      {zoom !== null && <Lightbox images={product.images} start={zoom} alt={product.name} onClose={() => setZoom(null)} />}
    </article>
  );
}
