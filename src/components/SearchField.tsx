import { Search, X } from 'lucide-react';

export function SearchField({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  return (
    <label className="search">
      <Search size={18} aria-hidden />
      <input
        type="search"
        placeholder="Buscar produtos…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Buscar produtos"
        enterKeyHint="search"
      />
      {value && (
        <button className="search-clear" aria-label="Limpar busca" onClick={() => onChange('')}>
          <X size={16} />
        </button>
      )}
    </label>
  );
}
