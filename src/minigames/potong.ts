import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { el, fitCanvas, localPos, type MinigameFactory } from './types';

/** POTONG: geser jari (swipe) melintasi bahan di garis putus-putus. */
export const potong: MinigameFactory = (h) => {
  if (h.step.type !== 'potong') throw new Error('langkah bukan potong');
  const { cuts, ingredient } = h.step;
  const name = h.t(`ing.${ingredient}`);
  const wrap = el('div', 'mg-potong', '', h.area);
  const board = el('div', 'mg-board', '', wrap);
  const item = el('div', 'mg-item', '', board);
  const svg = foodIcon(INGREDIENTS[ingredient]?.icon ?? '');
  const n = cuts + 1;
  const slices: HTMLElement[] = [];
  for (let i = 0; i < n; i++) {
    const s = el('div', 'mg-slice', svg, item);
    s.style.clipPath = `inset(0 ${100 - ((i + 1) * 100) / n}% 0 ${(i * 100) / n}%)`;
    slices.push(s);
  }
  const guides: HTMLElement[] = [];
  for (let i = 1; i < n; i++) { const g = el('div', 'mg-guide', '', item); g.style.left = `${(i * 100) / n}%`; guides.push(g); }
  const cv = fitCanvas(wrap);
  const done = new Array(cuts).fill(false);
  let made = 0, misses = 0;
  let trail: [number, number][] = [];
  let down = false;
  const hint = () => h.setHint(h.t('mg.swipeHint', { item: name, n: made, total: cuts }));
  hint();

  const draw = () => {
    const { ctx, state } = cv;
    ctx.clearRect(0, 0, state.w, state.h);
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(31,111,209,0.6)'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(trail[0][0], trail[0][1]);
      for (const p of trail) ctx.lineTo(p[0], p[1]);
      ctx.stroke(); ctx.shadowBlur = 0;
    }
  };
  let raf = 0;
  const loop = () => { draw(); if (trail.length && !down) trail = trail.slice(Math.ceil(trail.length / 6)); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);

  const onDown = (e: PointerEvent) => { down = true; trail = [localPos(wrap, e)]; wrap.setPointerCapture(e.pointerId); };
  const onMove = (e: PointerEvent) => { if (down) { trail.push(localPos(wrap, e)); if (trail.length > 40) trail.shift(); } };
  const onUp = () => {
    if (!down) return;
    down = false;
    const ir = item.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    const ix = ir.left - wr.left, iy = ir.top - wr.top;
    const ys = trail.map((p) => p[1]), xs = trail.map((p) => p[0]);
    const vert = Math.max(...ys) - Math.min(...ys);
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const crossed = vert > ir.height * 0.45 && avgX > ix - 20 && avgX < ix + ir.width + 20 && Math.max(...ys) > iy + ir.height * 0.3 && Math.min(...ys) < iy + ir.height * 0.7;
    if (!crossed) { if (vert > 30 || Math.abs(xs[xs.length - 1] - xs[0]) > 30) misses++; return; }
    // potongan terdekat yang belum dibuat
    const rel = (avgX - ix) / ir.width;
    let best = -1, bd = Infinity;
    done.forEach((d, i) => { if (d) return; const gx = (i + 1) / n; const dd = Math.abs(gx - rel); if (dd < bd) { bd = dd; best = i; } });
    if (best < 0) return;
    if (bd > 0.22) misses++;
    done[best] = true; made++;
    guides[best].classList.add('cut');
    slices.forEach((s, i) => { const shift = done.slice(0, i).filter(Boolean).length; s.style.transform = `translateX(${shift * 8 - (made * 4)}px)`; });
    h.sfx('chop');
    hint();
    if (made >= cuts) setTimeout(() => h.done(Math.max(0.6, 1 - misses * 0.08)), 350);
  };
  wrap.addEventListener('pointerdown', onDown);
  wrap.addEventListener('pointermove', onMove);
  wrap.addEventListener('pointerup', onUp);
  wrap.addEventListener('pointercancel', onUp);
  return { destroy() { cancelAnimationFrame(raf); cv.destroy(); wrap.remove(); } };
};
