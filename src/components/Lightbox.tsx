import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Fotos em tela cheia; arraste para o lado para ver as outras. */
export function Lightbox({ images, start, alt, onClose }: { images: string[]; start: number; alt: string; onClose: () => void }) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = start * el.clientWidth;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (el && (e.key === 'ArrowRight' || e.key === 'ArrowLeft'))
        el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * el.clientWidth, behavior: 'smooth' });
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [start, onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button className="icon-btn lightbox-close" aria-label="Fechar">
        <X size={26} />
      </button>
      <div className="lightbox-track" ref={track}>
        {images.map((src) => (
          <div key={src} className="lightbox-slide">
            <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
          </div>
        ))}
      </div>
    </div>
  );
}
