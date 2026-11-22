import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { el, type MinigameFactory } from './types';

/** SERET-BAHAN: seret bahan dari grid kanan ke piring/roti sesuai urutan resep. */
export const seretBahan: MinigameFactory = (h) => {
  if (h.step.type !== 'seret-bahan') throw new Error('langkah bukan seret-bahan');
  const { base, items, distractors = [] } = h.step;
  const wrap = el('div', 'mg-seret', '', h.area);
  const plate = el('div', 'mg-plate', '', wrap);
  const stack = el('div', 'mg-stack', '', plate);
  const addLayer = (id: string, i: number) => {
    const l = el('div', 'mg-layer', foodIcon(INGREDIENTS[id]?.icon ?? ''), stack);
    l.style.bottom = `${8 + i * 13}%`;
    l.style.zIndex = String(i + 1);
    return l;
  };
  addLayer(base, 0);
  // grid bahan (acak, tapi stabil)
  const pool = [...new Set([...items, ...distractors])];
  pool.sort((a, b) => (a.charCodeAt(1) * 7 + a.length) % 5 - (b.charCodeAt(1) * 7 + b.length) % 5);
  const grid = el('div', 'mg-grid', '', h.side);
  const btns = new Map<string, HTMLElement>();
  for (const id of pool) {
    const b = el('button', 'mg-ing', `${foodIcon(INGREDIENTS[id]?.icon ?? '')}<span>${h.t(`ing.${id}`)}</span>`, grid);
    b.dataset.id = id;
    btns.set(id, b);
  }
  let idx = 0, mistakes = 0;
  const refresh = () => {
    btns.forEach((b, id) => b.classList.toggle('next', id === items[idx]));
    if (idx < items.length) h.setHint(h.t('mg.dragHint', { item: h.t(`ing.${items[idx]}`), n: idx, total: items.length }));
  };
  refresh();

  let ghost: HTMLElement | null = null, dragId = '';
  const onDown = (e: PointerEvent) => {
    const b = (e.target as HTMLElement).closest('.mg-ing') as HTMLElement | null;
    if (!b || idx >= items.length) return;
    e.preventDefault();
    dragId = b.dataset.id!;
    ghost = el('div', 'mg-ghost', foodIcon(INGREDIENTS[dragId]?.icon ?? ''), document.body);
    move(e);
    h.sfx('pop');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const move = (e: PointerEvent) => { if (ghost) ghost.style.transform = `translate(${e.clientX - 44}px, ${e.clientY - 44}px)`; };
  const up = (e: PointerEvent) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (!ghost) return;
    const pr = plate.getBoundingClientRect();
    const inside = e.clientX > pr.left - 30 && e.clientX < pr.right + 30 && e.clientY > pr.top - 60 && e.clientY < pr.bottom + 30;
    const g = ghost; ghost = null;
    if (inside && dragId === items[idx]) {
      g.remove();
      const l = addLayer(dragId, idx + 1);
      l.classList.add('drop');
      idx++;
      h.sfx('plate');
      refresh();
      if (idx >= items.length) { btns.forEach((b) => b.classList.remove('next')); setTimeout(() => h.done(Math.max(0.6, 1 - mistakes * 0.08)), 450); }
    } else {
      if (inside) { mistakes++; h.sfx('boing'); plate.classList.remove('shake'); void plate.offsetWidth; plate.classList.add('shake'); }
      const b = btns.get(dragId)!.getBoundingClientRect();
      g.style.transition = 'transform .25s ease-out, opacity .25s';
      g.style.transform = `translate(${b.left + b.width / 2 - 44}px, ${b.top + b.height / 2 - 44}px) scale(.6)`;
      g.style.opacity = '0';
      setTimeout(() => g.remove(), 260);
    }
  };
  grid.addEventListener('pointerdown', onDown);
  return { destroy() { ghost?.remove(); grid.remove(); wrap.remove(); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); } };
};
