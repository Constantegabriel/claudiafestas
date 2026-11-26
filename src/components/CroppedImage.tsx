import { useState, type CSSProperties } from 'react';
import { boxStyle, cropBox, ratioCache } from '@/lib/crop';
import type { ProductImage } from '@/lib/types';

interface Props {
  image: ProductImage;
  alt: string;
  className?: string;
  lazy?: boolean;
}

/** Foto num quadro 1:1, cortada/posicionada como configurado no admin. */
export function CroppedImage({ image, alt, className, lazy }: Props) {
  const [ratio, setRatio] = useState<number | undefined>(() => ratioCache.get(image.url));

  // Antes de saber o tamanho da foto, usa o recorte padrão do navegador (sem "pulo" visível).
  const style: CSSProperties = ratio
    ? boxStyle(cropBox(ratio, image))
    : {
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: image.fit === 'contain' ? 'contain' : 'cover',
        objectPosition: `${image.x * 100}% ${image.y * 100}%`,
      };

  return (
    <div className={`cropped ${image.fit === 'contain' ? 'is-contain' : ''} ${className ?? ''}`}>
      <img
        src={image.url}
        alt={alt}
        loading={lazy ? 'lazy' : undefined}
        draggable={false}
        style={style}
        onLoad={(e) => {
          const el = e.currentTarget;
          if (!el.naturalWidth || !el.naturalHeight) return;
          const r = el.naturalWidth / el.naturalHeight;
          ratioCache.set(image.url, r);
          setRatio(r);
        }}
      />
    </div>
  );
}
