import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Eye, EyeOff, ImageOff, LogOut, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import { repo } from '@/data';
import { formatPrice, normalize } from '@/lib/format';
import { isCloud, supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/useSettings';
import type { Product, StoreSettings } from '@/lib/types';
import { AdminLogin } from './AdminLogin';
import { ProductForm } from './ProductForm';
import { Logo } from '@/components/Logo';

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isCloud);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="center-screen muted">Carregando…</div>;
  if (isCloud && !session) return <AdminLogin />;
  return <AdminPanel email={session?.user.email ?? null} />;
}

type Tab = 'products' | 'settings';

function AdminPanel({ email }: { email: string | null }) {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    repo
      .listProducts({ includeInactive: true })
      .then(setProducts)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    reload();
  }, []);

  const categories = useMemo(
    () => [...new Set((products ?? []).map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return (products ?? []).filter((p) => !q || normalize(`${p.name} ${p.category}`).includes(q));
  }, [products, query]);

  async function toggleActive(p: Product) {
    try {
      await repo.saveProduct({ ...p, active: !p.active });
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir "${p.name}"? Isso não pode ser desfeito.`)) return;
    try {
      await repo.removeProduct(p);
      reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (editing) {
    return (
      <div className="admin">
        <div className="container form-wide">
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
              window.scrollTo(0, 0);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="container narrow admin-header-row">
          <span className="admin-brand">
            <Logo alt="Claudia Festas" />
            <strong>Admin</strong>
          </span>
          <div className="admin-header-actions">
            <a className="btn ghost" href="/" target="_blank" rel="noreferrer">
              <Store size={18} /> Ver loja
            </a>
            {supabase && (
              <button className="icon-btn" aria-label="Sair" title={email ?? 'Sair'} onClick={() => supabase!.auth.signOut()}>
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="container narrow tabs">
          <button className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>
            Produtos
          </button>
          <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>
            Configurações
          </button>
        </div>
      </header>

      <main className="container narrow admin-main">
        {!isCloud && (
          <div className="alert">
            <strong>Modo local:</strong> os produtos ficam salvos só neste navegador. Configure o Supabase para publicar
            (veja o README).
          </div>
        )}
        {error && <div className="alert error">{error}</div>}

        {tab === 'settings' ? (
          <SettingsForm />
        ) : (
          <>
            <div className="admin-toolbar">
              <label className="search">
                <Search size={18} aria-hidden />
                <input type="search" placeholder="Filtrar produtos…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <button className="btn primary" onClick={() => setEditing('new')}>
                <Plus size={18} /> Novo produto
              </button>
            </div>

            {products === null ? (
              <p className="muted">Carregando…</p>
            ) : products.length === 0 ? (
              <div className="empty">
                <p>Nenhum produto ainda. Comece cadastrando o primeiro.</p>
              </div>
            ) : (
              <ul className="admin-list">
                {visible.map((p) => (
                  <li key={p.id} className={p.active ? '' : 'inactive'}>
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" />
                    ) : (
                      <div className="cart-thumb">
                        <ImageOff size={18} />
                      </div>
                    )}
                    <button className="admin-item-info" onClick={() => setEditing(p)}>
                      <span className="cart-name">{p.name}</span>
                      <span className="muted small">
                        {[p.category, formatPrice(p.price), p.variations.length ? `${p.variations.length} variações` : '']
                          .filter(Boolean)
                          .join(' · ')}
                        {!p.active && ' · oculto'}
                      </span>
                    </button>
                    <div className="admin-item-actions">
                      <button
                        className="icon-btn"
                        aria-label={p.active ? 'Ocultar da loja' : 'Mostrar na loja'}
                        title={p.active ? 'Ocultar da loja' : 'Mostrar na loja'}
                        onClick={() => toggleActive(p)}
                      >
                        {p.active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button className="icon-btn" aria-label="Editar" onClick={() => setEditing(p)}>
                        <Pencil size={18} />
                      </button>
                      <button className="icon-btn danger" aria-label="Excluir" onClick={() => remove(p)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SettingsForm() {
  const { settings, loaded } = useSettings();
  return loaded ? <SettingsFields initial={settings} /> : <p className="muted">Carregando…</p>;
}

function SettingsFields({ initial }: { initial: StoreSettings }) {
  const [s, setS] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | string>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      await repo.saveSettings({ storeName: s.storeName.trim() || 'Claudia Festas', whatsapp: s.whatsapp.trim(), tagline: s.tagline.trim() });
      setStatus('saved');
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <label className="field">
        <span>Nome da loja</span>
        <input value={s.storeName} onChange={(e) => setS({ ...s, storeName: e.target.value })} />
      </label>
      <label className="field">
        <span>Frase curta (opcional)</span>
        <input value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} placeholder="Ex.: Entregamos em toda a cidade" />
      </label>
      <label className="field">
        <span>WhatsApp que recebe os pedidos</span>
        <input
          value={s.whatsapp}
          onChange={(e) => setS({ ...s, whatsapp: e.target.value })}
          inputMode="tel"
          placeholder="(11) 99999-0000"
        />
      </label>
      <p className="muted small">Com DDD. Para número de fora do Brasil, inclua o código do país.</p>
      {status !== 'idle' && status !== 'saving' && (
        <div className={`alert ${status === 'saved' ? 'success' : 'error'}`}>{status === 'saved' ? 'Salvo!' : status}</div>
      )}
      <button className="btn primary" disabled={status === 'saving'}>
        {status === 'saving' ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </form>
  );
}
