import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { el, localPos, type MinigameFactory } from './types';

/** LIPAT: seret separuh atas adonan ke bawah sampai menutupi (empanada, mutabbaq). */
export const lipat: MinigameFactory = (h) => {
  if (h.step.type !== 'lipat') throw new Error('langkah bukan lipat');
  const { folds, ingredient } = h.step;
  const wrap = el('div', 'mg-lipat', '', h.area);
  const card = el('div', 'mg-fold', '', wrap);
  const svg = foodIcon(INGREDIENTS[ingredient]?.icon ?? '');
  el('div', 'mg-fold-bottom', svg, card);
  const flap = el('div', 'mg-fold-top', svg, card);
  el('div', 'mg-down-arrow', '', wrap);
  let n = 0, startY: number | null = null, k = 0, done = false;
  const hint = () => h.setHint(h.t('mg.foldHint', { n, total: folds }));
  hint();
  const render = () => { flap.style.transform = `rotateX(${-k * 180}deg)`; };
  wrap.addEventListener('pointerdown', (e) => { if (done) return; startY = localPos(wrap, e)[1]; wrap.setPointerCapture(e.pointerId); flap.style.transition = 'none'; });
  wrap.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    const H = card.clientHeight || 1;
    k = Math.max(0, Math.min(1, (localPos(wrap, e)[1] - startY) / H));
    render();
  });
  const up = () => {
    if (startY === null) return;
    startY = null;
    flap.style.transition = 'transform .25s ease-out';
    if (k > 0.6) {
      k = 1; render(); n++; h.sfx('flip'); hint();
      if (n >= folds) { done = true; setTimeout(() => h.done(1), 420); }
      else setTimeout(() => { flap.style.transition = 'none'; k = 0; render(); card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }, 450);
    } else { k = 0; render(); }
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);
  return { destroy() { wrap.remove(); } };
};
