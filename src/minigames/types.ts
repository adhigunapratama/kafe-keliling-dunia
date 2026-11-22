import type { RecipeStep } from '../data/recipes';
import type { Sfx } from '../engine/audio';

/** Yang disediakan overlay untuk setiap mini-game. */
export interface MinigameHost {
  /** Area masak (elemen kosong; mini-game mengisi sendiri). */
  area: HTMLElement;
  /** Kolom kanan (mis. grid bahan). Kosong bila tidak dipakai. */
  side: HTMLElement;
  step: RecipeStep;
  setHint(text: string): void;
  /** Selesai. quality 0..1 — salah langkah hanya menurunkan sedikit, tidak pernah gagal. */
  done(quality: number): void;
  sfx(s: Sfx): void;
  t(key: string, p?: Record<string, string | number>): string;
}

export interface MinigameInstance { destroy(): void }
export type MinigameFactory = (h: MinigameHost) => MinigameInstance;

/** Kanvas yang menyesuaikan ukuran elemen induk (tajam di layar retina). */
export function fitCanvas(parent: HTMLElement) {
  const c = document.createElement('canvas');
  c.className = 'mg-canvas';
  parent.appendChild(c);
  const ctx = c.getContext('2d')!;
  const state = { w: 1, h: 1 };
  const resize = () => {
    // clientWidth/Height tidak terpengaruh animasi transform (scale) panel
    const w = parent.clientWidth, hh = parent.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    state.w = w; state.h = hh;
    c.width = Math.max(1, w * dpr); c.height = Math.max(1, hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(parent);
  return { c, ctx, state, destroy: () => { ro.disconnect(); c.remove(); } };
}

/** Posisi pointer relatif terhadap elemen. */
export function localPos(el: HTMLElement, e: PointerEvent): [number, number] {
  const r = el.getBoundingClientRect();
  const sx = r.width ? el.clientWidth / r.width : 1, sy = r.height ? el.clientHeight / r.height : 1;
  return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, html = '', parent?: HTMLElement) {
  const e = document.createElement(tag);
  e.className = cls; if (html) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
}
