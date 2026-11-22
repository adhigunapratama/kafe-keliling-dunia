import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { el, localPos, type MinigameFactory } from './types';

/** GULUNG: geser jari panjang dari bawah ke atas beberapa kali (sushi, croissant). */
export const gulung: MinigameFactory = (h) => {
  if (h.step.type !== 'gulung') throw new Error('langkah bukan gulung');
  const { rolls, ingredient } = h.step;
  const wrap = el('div', 'mg-gulung', '', h.area);
  const mat = el('div', `mg-mat mg-mat-${ingredient}`, '', wrap);
  const sheet = el('div', 'mg-sheet', foodIcon(INGREDIENTS[ingredient]?.icon ?? ''), mat);
  const roll = el('div', 'mg-roll', '', mat);
  const arrow = el('div', 'mg-up-arrow', '', wrap);
  let n = 0, start: [number, number] | null = null, misses = 0, done = false;
  const hint = () => h.setHint(h.t('mg.rollHint', { n, total: rolls }));
  hint();
  const update = () => {
    const k = n / rolls;
    sheet.style.clipPath = `inset(0 0 ${k * 100}% 0)`;
    roll.style.bottom = `${k * 70}%`;
    roll.style.height = `${14 + k * 26}%`;
    roll.style.opacity = n ? '1' : '0';
  };
  update();
  wrap.addEventListener('pointerdown', (e) => { start = localPos(wrap, e); wrap.setPointerCapture(e.pointerId); });
  const up = (e: PointerEvent) => {
    if (!start || done) return;
    const end = localPos(wrap, e);
    const dy = start[1] - end[1], dx = Math.abs(end[0] - start[0]);
    start = null;
    if (dy > wrap.clientHeight * 0.3 && dy > dx) {
      n++; h.sfx('whoosh'); update(); hint();
      arrow.style.opacity = '0';
      if (n >= rolls) { done = true; setTimeout(() => h.done(Math.max(0.6, 1 - misses * 0.1)), 380); }
    } else if (dy > 20 || dx > 40) { misses++; h.sfx('boing'); }
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', () => { start = null; });
  return { destroy() { wrap.remove(); } };
};
