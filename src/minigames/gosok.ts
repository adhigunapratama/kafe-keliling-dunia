import type { Sfx } from '../engine/audio';
import { el, fitCanvas, localPos } from './types';

export interface WashHost {
  area: HTMLElement;
  /** Jumlah piring kotor tersisa di wastafel. */
  remaining(): number;
  /** Satu piring selesai dicuci. */
  washOne(): void;
  setHint(text: string): void;
  sfx(s: Sfx): void;
  t(key: string, p?: Record<string, string | number>): string;
  /** Tidak ada piring lagi. */
  finished(): void;
}

/** CUCI PIRING: gosok noda di piring sampai bersih. Satu piring = beberapa gosokan singkat. */
export function gosok(h: WashHost) {
  const wrap = el('div', 'mg-gosok', '', h.area);
  const cv = fitCanvas(wrap);
  let spots: { x: number; y: number; r: number; dirt: number; c: string }[] = [];
  let sparkle = 0;
  let down = false;
  let lastScrub = 0;
  const COLORS = ['#B08A5A', '#C9432A', '#7CCB6B', '#E0A052'];
  const newPlate = () => {
    spots = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6, d = 0.15 + Math.random() * 0.45;
      spots.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.9, r: 0.12 + Math.random() * 0.08, dirt: 1, c: COLORS[i % COLORS.length] });
    }
  };
  const hint = () => h.setHint(h.t('mg.wash', { n: h.remaining() }));
  newPlate(); hint();
  const geom = () => { const { w, h: H } = cv.state; const R = Math.min(w, H) * 0.42; return { cx: w / 2, cy: H / 2, R }; };
  const draw = () => {
    const { ctx, state } = cv; const { cx, cy, R } = geom();
    ctx.clearRect(0, 0, state.w, state.h);
    // air sabun
    ctx.fillStyle = '#CFEFFB'; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.18, R * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    // piring
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2B2340'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#DAD5E8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R * 0.68, 0, Math.PI * 2); ctx.stroke();
    for (const s of spots) {
      if (s.dirt <= 0) continue;
      ctx.globalAlpha = Math.min(1, s.dirt);
      ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(cx + s.x * R, cy + s.y * R, s.r * R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (sparkle > 0) {
      ctx.fillStyle = `rgba(255,236,140,${sparkle})`;
      for (let i = 0; i < 6; i++) { const a = i + (1 - sparkle) * 2; const x = cx + Math.cos(a) * R * 0.8, y = cy + Math.sin(a) * R * 0.8; ctx.beginPath(); ctx.arc(x, y, 10 * sparkle + 4, 0, Math.PI * 2); ctx.fill(); }
    }
  };
  let raf = 0, last = performance.now();
  const loop = (now: number) => { const dt = (now - last) / 1000; last = now; if (sparkle > 0) sparkle = Math.max(0, sparkle - dt * 1.6); draw(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  let prev: [number, number] | null = null;
  const scrub = (p: [number, number]) => {
    const { cx, cy, R } = geom();
    const dist = prev ? Math.hypot(p[0] - prev[0], p[1] - prev[1]) : 0;
    prev = p;
    let hit = false;
    for (const s of spots) {
      if (s.dirt <= 0) continue;
      const d = Math.hypot(p[0] - (cx + s.x * R), p[1] - (cy + s.y * R));
      if (d < s.r * R + 28) { s.dirt -= dist / 140; hit = true; }
    }
    const now = performance.now();
    if (hit && now - lastScrub > 110) { lastScrub = now; h.sfx('scrub'); }
    if (spots.every((s) => s.dirt <= 0)) {
      sparkle = 1;
      h.sfx('ding');
      h.washOne();
      if (h.remaining() > 0) { newPlate(); hint(); }
      else { down = false; setTimeout(() => h.finished(), 450); }
    }
  };
  wrap.addEventListener('pointerdown', (e) => { down = true; prev = localPos(wrap, e); wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', (e) => { if (down) scrub(localPos(wrap, e)); });
  const stop = () => { down = false; prev = null; };
  wrap.addEventListener('pointerup', stop);
  wrap.addEventListener('pointercancel', stop);
  return { destroy() { cancelAnimationFrame(raf); cv.destroy(); wrap.remove(); } };
}
