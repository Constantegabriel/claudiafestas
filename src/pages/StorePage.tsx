import { useEffect, useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { repo } from '@/data';
import { normalize } from '@/lib/format';
import { useSettings } from '@/lib/useSettings';
import type { Product } from '@/lib/types';
import { Header } from '@/components/Header';
import { MobileMenu } from '@/components/MobileMenu';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';

export function StorePage() {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    repo
      .listProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  const categories = useMemo(
    () => [...new Set((products ?? []).map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [products],
  );

  const visible = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return (products ?? []).filter((p) => {
      if (category && p.category !== category) return false;
      if (!terms.length) return true;
      const haystack = normalize([p.name, p.description, p.category, ...p.variations.map((v) => v.name)].join(' '));
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, query, category]);

  return (
    <>
      <Header settings={settings} query={query} onQuery={setQuery} onMenu={() => setMenuOpen(true)} />

      {categories.length > 0 && (
        <div className="cat-bar">
          <div className="container cat-scroll">
            <button className={`chip ${category === null ? 'on' : ''}`} onClick={() => setCategory(null)}>
              Todos
            </button>
            {categories.map((c) => (
              <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="container main">
        {error ? (
          <div className="empty">
            <p>Não foi possível carregar os produtos. Verifique sua internet e tente de novo.</p>
            <button className="btn outline" onClick={() => window.location.reload()}>
              Tentar de novo
            </button>
          </div>
        ) : products === null ? (
          <div className="grid" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="card skeleton" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <PackageSearch size={44} />
            {products.length === 0 ? (
              <p>Nenhum produto cadastrado ainda.</p>
            ) : (
              <>
                <p>Nada encontrado{query && <> para “{query}”</>}.</p>
                <button
                  className="btn outline"
                  onClick={() => {
                    setQuery('');
                    setCategory(null);
                  }}
                >
                  Ver todos os produtos
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="result-count muted small">
              {category ?? 'Todos os produtos'} · {visible.length} {visible.length === 1 ? 'item' : 'itens'}
            </p>
            <div className="grid">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          © {new Date().getFullYear()} {settings.storeName}
        </div>
      </footer>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        settings={settings}
        categories={categories}
        activeCategory={category}
        onCategory={setCategory}
      />
      <CartDrawer settings={settings} />
    </>
  );
}
