import { Minus, Plus } from 'lucide-react';

export function QtyStepper({ value, onChange, small }: { value: number; onChange: (n: number) => void; small?: boolean }) {
  return (
    <div className={`qty ${small ? 'qty-sm' : ''}`}>
      <button type="button" aria-label="Diminuir quantidade" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1}>
        <Minus size={16} />
      </button>
      <input
        inputMode="numeric"
        aria-label="Quantidade"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(Number.isFinite(n) && n > 0 ? Math.min(n, 999) : 1);
        }}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" aria-label="Aumentar quantidade" onClick={() => onChange(Math.min(999, value + 1))}>
        <Plus size={16} />
      </button>
    </div>
  );
}
