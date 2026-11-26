import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Crosshair, Maximize, Minus, Move, Plus, Square, X } from 'lucide-react';
import { boxStyle, centerFromBox, clampBox, cropBox, ratioCache, type Box } from '@/lib/crop';
import { DEFAULT_CROP, type ProductImage } from '@/lib/types';

interface Props {
  image: ProductImage;
  onApply: (image: ProductImage) => void;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Ajusta qual parte da foto aparece no quadro 1:1 da loja. */
export function CropEditor({ image, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<ProductImage>(image);
  const [ratio, setRatio] = useState<number | undefined>(() => ratioCache.get(image.url));
  const frame = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ box: Box; x: number; y: number; dist: number; zoom: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const box = ratio ? cropBox(ratio, draft) : null;
  const cover = draft.fit === 'cover';

  // Quando a foto tem praticamente o formato quadrado e zoom 1, não há o que arrastar.
  const canPan = cover && box !== null && (box.width > 1.001 || box.height > 1.001);

  function startGesture() {
    const pts = [...pointers.current.values()];
    if (!box || !pts.length) return (gesture.current = null);
    const mid = pts.length > 1 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { box, x: mid.x, y: mid.y, dist, zoom: draft.zoom };
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (!cover) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!pointers.current.has(e.pointerId) || !gesture.current || !ratio || !frame.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    const size = frame.current.clientWidth;

    if (pts.length > 1 && g.dist > 0) {
      // Pinça: zoom
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setDraft((d) => ({ ...d, zoom: clampZoom(g.zoom * (dist / g.dist)) }));
      return;
    }
    const moved = clampBox({
      ...g.box,
      left: g.box.left + (pts[0].x - g.x) / size,
      top: g.box.top + (pts[0].y - g.y) / size,
    });
    setDraft((d) => ({ ...d, ...centerFromBox(moved) }));
  }

  function onPointerUp(e: ReactPointerEvent) {
    pointers.current.delete(e.pointerId);
    startGesture();
  }

  const setZoom = (z: number) => setDraft((d) => ({ ...d, zoom: clampZoom(z) }));

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Ajustar foto">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal crop-modal">
        <div className="modal-head">
          <h2>Ajustar foto</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="crop-body">
          <div className="segmented" role="radiogroup" aria-label="Como mostrar a foto">
            <button
              type="button"
              role="radio"
              aria-checked={cover}
              className={cover ? 'on' : ''}
              onClick={() => setDraft((d) => ({ ...d, fit: 'cover' }))}
            >
              <Square size={16} /> Preencher o quadro
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!cover}
              className={!cover ? 'on' : ''}
              onClick={() => setDraft((d) => ({ ...d, fit: 'contain' }))}
            >
              <Maximize size={16} /> Foto inteira
            </button>
          </div>

          <div
            className={`crop-stage ${canPan ? 'can-pan' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(e) => cover && setZoom(draft.zoom * (1 - e.deltaY * 0.0015))}
          >
            <div className={`crop-frame ${cover ? '' : 'is-contain'}`} ref={frame}>
              <img
                src={draft.url}
                alt=""
                draggable={false}
                style={box ? boxStyle(box) : { inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  const r = el.naturalWidth / el.naturalHeight;
                  ratioCache.set(draft.url, r);
                  setRatio(r);
                }}
              />
            </div>
            <div className="crop-mask" aria-hidden />
            {canPan && (
              <span className="crop-hint" aria-hidden>
                <Move size={14} /> Arraste para escolher a parte que aparece
              </span>
            )}
          </div>

          {cover ? (
            <div className="zoom-row">
              <button type="button" className="icon-btn" aria-label="Diminuir zoom" onClick={() => setZoom(draft.zoom - 0.25)} disabled={draft.zoom <= MIN_ZOOM}>
                <Minus size={18} />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={draft.zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
              />
              <button type="button" className="icon-btn" aria-label="Aumentar zoom" onClick={() => setZoom(draft.zoom + 0.25)} disabled={draft.zoom >= MAX_ZOOM}>
                <Plus size={18} />
              </button>
              <button
                type="button"
                className="btn ghost small-btn"
                onClick={() => setDraft((d) => ({ ...d, x: DEFAULT_CROP.x, y: DEFAULT_CROP.y, zoom: DEFAULT_CROP.zoom }))}
              >
                <Crosshair size={16} /> Centralizar
              </button>
            </div>
          ) : (
            <p className="muted small crop-note">A foto aparece inteira, com fundo branco nas sobras.</p>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn primary" onClick={() => onApply(draft)}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
