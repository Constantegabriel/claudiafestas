import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartItem {
  /** produto + variação: o mesmo produto em tamanhos diferentes vira linhas diferentes. */
  key: string;
  productId: string;
  name: string;
  variation: string | null;
  unitPrice: number | null;
  image: string | null;
  qty: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const KEY = 'catalogo:cart';
const CartContext = createContext<CartState | null>(null);

function load(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* navegador sem armazenamento: o carrinho só vive nesta aba */
    }
  }, [items]);

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((n, it) => n + it.qty, 0),
      add: (item) => {
        const key = `${item.productId}::${item.variation ?? ''}`;
        setItems((prev) => {
          const found = prev.find((it) => it.key === key);
          return found
            ? prev.map((it) => (it.key === key ? { ...it, qty: it.qty + item.qty } : it))
            : [...prev, { ...item, key }];
        });
      },
      setQty: (key, qty) =>
        setItems((prev) => prev.map((it) => (it.key === key ? { ...it, qty: Math.max(1, qty) } : it))),
      remove: (key) => setItems((prev) => prev.filter((it) => it.key !== key)),
      clear: () => setItems([]),
      isOpen,
      setOpen,
    }),
    [items, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}
