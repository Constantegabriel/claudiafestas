import type { CSSProperties } from 'react';
import type { ProductImage } from './types';

export interface Box {
  /** Tudo em frações do lado do quadro (1 = 100%). */
  left: number;
  top: number;
  width: number;
  height: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Onde a foto fica dentro do quadro quadrado.
 * `ratio` = largura / altura da foto original.
 */
export function cropBox(ratio: number, img: Pick<ProductImage, 'x' | 'y' | 'zoom' | 'fit'>): Box {
  if (img.fit === 'contain') {
    const width = ratio >= 1 ? 1 : ratio;
    const height = ratio >= 1 ? 1 / ratio : 1;
    return { width, height, left: (1 - width) / 2, top: (1 - height) / 2 };
  }
  const width = (ratio >= 1 ? ratio : 1) * img.zoom;
  const height = (ratio >= 1 ? 1 : 1 / ratio) * img.zoom;
  return {
    width,
    height,
    left: clamp(0.5 - img.x * width, 1 - width, 0),
    top: clamp(0.5 - img.y * height, 1 - height, 0),
  };
}

/** Ponto central (x, y) a partir da posição da foto — usado ao arrastar no editor. */
export function centerFromBox(box: Box): { x: number; y: number } {
  return {
    x: clamp((0.5 - box.left) / box.width, 0, 1),
    y: clamp((0.5 - box.top) / box.height, 0, 1),
  };
}

/** Limita a posição para não sobrar espaço vazio no quadro. */
export function clampBox(box: Box): Box {
  return { ...box, left: clamp(box.left, 1 - box.width, 0), top: clamp(box.top, 1 - box.height, 0) };
}

export function boxStyle(box: Box): CSSProperties {
  return {
    left: `${box.left * 100}%`,
    top: `${box.top * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  };
}

/** Proporção das fotos já carregadas, para não "piscar" ao remontar. */
export const ratioCache = new Map<string, number>();
