import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { timingQuality } from './timing';
import { el, type MinigameFactory } from './types';

/** BALIK: masak satu sisi, ketuk "Balik!" saat warnanya pas; sisi terakhir diangkat. */
export const balik: MinigameFactory = (h) => {
  if (h.step.type !== 'balik') throw new Error('langkah bukan balik');
  const { flips, seconds, ingredient } = h.step;
  const zone: [number, number] = [0.62, 0.86];
  const wrap = el('div', 'mg-balik', '', h.area);
  const grill = el('div', 'mg-grill', '', wrap);
  const item = el('div', 'mg-flipper', foodIcon(INGREDIENTS[ingredient]?.icon ?? ''), grill);
  const meter = el('div', 'mg-meter', '<div class="mg-meter-zone"></div><div class="mg-meter-fill"></div>', wrap);
  const fill = meter.querySelector('.mg-meter-fill') as HTMLElement;
  const z = meter.querySelector('.mg-meter-zone') as HTMLElement;
  z.style.left = `${zone[0] * 100}%`; z.style.width = `${(zone[1] - zone[0]) * 100}%`;
  const btn = el('button', 'btn btn-yellow mg-tap', h.t('mg.flip'), wrap);
  h.setHint(h.t('mg.flipHint'));
  let side = 0, v = 0, finished = false, flipping = 0, last = performance.now(), sz = 0;
  const qs: number[] = [];
  const totalSides = flips + 1;
  const next = (q: number) => {
    qs.push(q);
    side++;
    h.sfx('flip');
    if (side >= totalSides) {
      finished = true; btn.disabled = true;
      const avg = qs.reduce((a, b) => a + b, 0) / qs.length;
      setTimeout(() => h.done(avg), 420);
      return;
    }
    v = 0; flipping = 0.4;
    if (side === totalSides - 1) btn.textContent = h.t('mg.tapNow');
  };
  let raf = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!finished && flipping <= 0) {
      v += dt / seconds;
      sz += dt; if (sz > 0.4) { sz = 0; h.sfx('sizzle'); }
      if (v >= 1) next(0.5);
    }
    if (flipping > 0) flipping -= dt;
    const f = Math.max(0, flipping) / 0.4;
    item.style.transform = `translateY(${-Math.sin(f * Math.PI) * 60}px) rotateX(${f * 180}deg)`;
    const k = Math.min(1, v);
    item.style.filter = `brightness(${1.25 - k * 0.55}) saturate(${0.7 + k * 0.6})`;
    fill.style.width = `${k * 100}%`;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const tap = () => { if (!finished && flipping <= 0) next(timingQuality(v, zone)); };
  btn.addEventListener('click', tap);
  grill.addEventListener('pointerdown', tap);
  return { destroy() { cancelAnimationFrame(raf); wrap.remove(); } };
};
