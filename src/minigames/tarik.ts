import { el, localPos, type MinigameFactory } from './types';

/** TARIK: geser lebar ke kiri-kanan berulang; tiap tarikan menggandakan helai mi. */
export const tarik: MinigameFactory = (h) => {
  if (h.step.type !== 'tarik') throw new Error('langkah bukan tarik');
  const { pulls } = h.step;
  const wrap = el('div', 'mg-tarik', '', h.area);
  const bar = el('div', 'mg-noodle', '', wrap);
  let n = 0, startX: number | null = null, done = false;
  const hint = () => h.setHint(h.t('mg.pullHint', { n, total: pulls }));
  const render = () => {
    const strands = Math.min(16, 2 ** n);
    bar.innerHTML = Array.from({ length: strands }, () => '<i></i>').join('');
    bar.style.setProperty('--w', `${40 + (n / pulls) * 50}%`);
  };
  hint(); render();
  wrap.addEventListener('pointerdown', (e) => { startX = localPos(wrap, e)[0]; wrap.setPointerCapture(e.pointerId); });
  const up = (e: PointerEvent) => {
    if (startX === null || done) return;
    const dx = Math.abs(localPos(wrap, e)[0] - startX);
    startX = null;
    if (dx > wrap.clientWidth * 0.3) {
      n++; h.sfx('whoosh'); render(); hint();
      bar.classList.remove('stretch'); void bar.offsetWidth; bar.classList.add('stretch');
      if (n >= pulls) { done = true; setTimeout(() => h.done(1), 400); }
    }
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', () => { startX = null; });
  return { destroy() { wrap.remove(); } };
};
