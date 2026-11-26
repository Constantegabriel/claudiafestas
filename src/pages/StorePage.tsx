import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, PackageSearch, Sparkles } from 'lucide-react';
import { repo } from '@/data';
import { normalize } from '@/lib/format';
import { useSettings } from '@/lib/useSettings';
import { whatsappLink } from '@/lib/whatsapp';
import type { Product } from '@/lib/types';
import { Header } from '@/components/Header';
import { MobileMenu } from '@/components/MobileMenu';
import { ProductCard } from '@/components/ProductCard';
import { CartDrawer } from '@/components/CartDrawer';
import { CartBar } from '@/components/CartBar';
import { Logo } from '@/components/Logo';

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

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products ?? []) if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [products]);
  const categories = useMemo(() => [...counts.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR')), [counts]);

  const visible = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return (products ?? []).filter((p) => {
      if (category && p.category !== category) return false;
      if (!terms.length) return true;
      const haystack = normalize([p.name, p.description, p.category, ...p.variations.map((v) => v.name)].join(' '));
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, query, category]);

  const pickCategory = (c: string | null) => {
    setCategory(c);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const title = query.trim() ? `Resultados para “${query.trim()}”` : (category ?? 'Todos os produtos');

  return (
    <>
      <Header settings={settings} query={query} onQuery={setQuery} onMenu={() => setMenuOpen(true)} />

      {settings.tagline && (
        <div className="tagline">
          <div className="container">
            <Sparkles size={16} aria-hidden /> {settings.tagline}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <nav className="cat-bar" aria-label="Categorias">
          <div className="container cat-scroll">
            <button className={`chip ${category === null ? 'on' : ''}`} onClick={() => pickCategory(null)}>
              Todos
            </button>
            {categories.map((c) => (
              <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => pickCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="container layout">
        {categories.length > 0 && (
          <aside className="sidebar" aria-label="Categorias">
            <p className="sidebar-title">Categorias</p>
            <button className={`side-item ${category === null ? 'on' : ''}`} onClick={() => pickCategory(null)}>
              Todos os produtos <span>{products?.length ?? 0}</span>
            </button>
            {categories.map((c) => (
              <button key={c} className={`side-item ${category === c ? 'on' : ''}`} onClick={() => pickCategory(c)}>
                {c} <span>{counts.get(c)}</span>
              </button>
            ))}
            {settings.whatsapp && (
              <a
                className="side-help"
                href={whatsappLink(settings.whatsapp, 'Olá! Vim pelo catálogo e tenho uma dúvida.')}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={20} />
                <span>
                  <strong>Ficou com dúvida?</strong>
                  <small>Chame a gente no WhatsApp</small>
                </span>
              </a>
            )}
          </aside>
        )}

        <main className="main">
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
              <div className="main-head">
                <h1>{title}</h1>
                <span className="muted small">
                  {visible.length} {visible.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <div className="grid">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <Logo alt={settings.storeName} className="footer-logo" />
          <div>
            <p className="footer-name">{settings.storeName}</p>
            {settings.tagline && <p className="muted small">{settings.tagline}</p>}
            {settings.whatsapp && (
              <a
                className="footer-wa"
                href={whatsappLink(settings.whatsapp, 'Olá! Vim pelo catálogo e tenho uma dúvida.')}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} /> {settings.whatsapp}
              </a>
            )}
            <p className="muted small">© {new Date().getFullYear()} {settings.storeName}</p>
          </div>
        </div>
      </footer>

      <CartBar />
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
