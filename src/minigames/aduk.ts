import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { el, fitCanvas, localPos, type MinigameFactory } from './types';

/** ADUK: putar jari melingkar di dalam mangkuk/panci beberapa putaran. */
export const aduk: MinigameFactory = (h) => {
  if (h.step.type !== 'aduk') throw new Error('langkah bukan aduk');
  const { turns, ingredient } = h.step;
  const name = h.t(`ing.${ingredient}`);
  const wrap = el('div', 'mg-aduk', '', h.area);
  const bowl = el('div', 'mg-bowl', '', wrap);
  const swirl = el('div', 'mg-swirl', foodIcon(INGREDIENTS[ingredient]?.icon ?? ''), bowl);
  el('div', 'mg-spoon', '', bowl);
  const cv = fitCanvas(wrap);
  let total = 0, prevAng: number | null = null, done = false, lastSfx = 0;
  const hint = () => h.setHint(h.t('mg.stirHint', { item: name, n: Math.min(turns, Math.floor(total / (Math.PI * 2))), total: turns }));
  hint();
  const center = () => { const r = bowl.getBoundingClientRect(), w = wrap.getBoundingClientRect(); const sx = wrap.clientWidth / (w.width || 1); return [(r.left - w.left + r.width / 2) * sx, (r.top - w.top + r.height / 2) * sx, (r.width / 2) * sx] as const; };
  let trail: [number, number][] = [];
  const draw = () => {
    const { ctx, state } = cv;
    ctx.clearRect(0, 0, state.w, state.h);
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(trail[0][0], trail[0][1]); for (const p of trail) ctx.lineTo(p[0], p[1]); ctx.stroke();
    }
    // panah melingkar petunjuk
    if (!done && total < 0.5) {
      const [cx, cy, R] = center(); const t = performance.now() / 600;
      ctx.strokeStyle = 'rgba(43,35,64,.35)'; ctx.lineWidth = 6; ctx.setLineDash([10, 12]);
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, t, t + Math.PI * 1.5); ctx.stroke(); ctx.setLineDash([]);
    }
  };
  let raf = 0;
  const loop = () => { draw(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  let down = false;
  const onMove = (e: PointerEvent) => {
    if (!down || done) return;
    const p = localPos(wrap, e);
    trail.push(p); if (trail.length > 24) trail.shift();
    const [cx, cy, R] = center();
    const d = Math.hypot(p[0] - cx, p[1] - cy);
    if (d < R * 0.12 || d > R * 1.4) { prevAng = null; return; }
    const a = Math.atan2(p[1] - cy, p[0] - cx);
    if (prevAng !== null) {
      let da = a - prevAng; da = Math.atan2(Math.sin(da), Math.cos(da));
      total += Math.abs(da);
      swirl.style.transform = `rotate(${(total * 180) / Math.PI}deg)`;
      const now = performance.now(); if (now - lastSfx > 180) { lastSfx = now; h.sfx('scrub'); }
      const mix = Math.min(1, total / (turns * Math.PI * 2));
      bowl.style.setProperty('--mix', String(mix));
      hint();
      if (total >= turns * Math.PI * 2) { done = true; h.sfx('ding'); setTimeout(() => h.done(1), 380); }
    }
    prevAng = a;
  };
  wrap.addEventListener('pointerdown', (e) => { down = true; prevAng = null; trail = []; wrap.setPointerCapture(e.pointerId); });
  wrap.addEventListener('pointermove', onMove);
  const up = () => { down = false; prevAng = null; trail = []; };
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
  return { destroy() { cancelAnimationFrame(raf); cv.destroy(); wrap.remove(); } };
};
