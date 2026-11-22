import { INGREDIENTS } from '../data/ingredients';
import { foodIcon } from '../ui/icons';
import { el, fitCanvas, type MinigameFactory } from './types';

/** Kualitas dari posisi jarum terhadap zona hijau. */
export function timingQuality(v: number, zone: [number, number]): number {
  if (v >= zone[0] && v <= zone[1]) return 1;
  const d = v < zone[0] ? zone[0] - v : v - zone[1];
  return d < 0.12 ? 0.8 : 0.6;
}

/** TIMING: jarum bergerak dari mentah ke gosong; ketuk saat di zona hijau. */
export const timing: MinigameFactory = (h) => {
  if (h.step.type !== 'timing') throw new Error('langkah bukan timing');
  const { seconds, zone, ingredient, action } = h.step;
  const wrap = el('div', 'mg-timing', '', h.area);
  const pot = el('div', `mg-pot mg-pot-${action}`, '', wrap);
  const food = el('div', 'mg-pot-food', foodIcon(INGREDIENTS[ingredient]?.icon ?? ''), pot);
  const gaugeBox = el('div', 'mg-gauge', '', wrap);
  const cv = fitCanvas(gaugeBox);
  const btn = el('button', 'btn btn-yellow mg-tap', h.t('mg.tapNow'), wrap);
  h.setHint(h.t('mg.timingHint'));
  let v = 0, finished = false, last = performance.now();
  let bubbleT = 0;
  const finish = (q: number) => {
    if (finished) return; finished = true;
    btn.disabled = true;
    h.sfx(q >= 1 ? 'star' : 'ding');
    setTimeout(() => h.done(q), 380);
  };
  const draw = () => {
    const { ctx, state } = cv;
    const w = state.w, H = state.h;
    ctx.clearRect(0, 0, w, H);
    const cx = w / 2, cy = H * 0.92, r = Math.min(w * 0.45, H * 0.85);
    const arc = (a: number, b: number, col: string) => { ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = r * 0.22; ctx.arc(cx, cy, r * 0.8, Math.PI + a * Math.PI, Math.PI + b * Math.PI); ctx.stroke(); };
    arc(0, zone[0] - 0.12, '#F7C9BF'); arc(zone[0] - 0.12, zone[0], '#FFE07A'); arc(zone[0], zone[1], '#4CC27A'); arc(zone[1], zone[1] + 0.12, '#FFE07A'); arc(zone[1] + 0.12, 1, '#E9573F');
    const a = Math.PI + v * Math.PI;
    ctx.strokeStyle = '#2B2340'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); ctx.stroke();
    ctx.fillStyle = '#2B2340'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
  };
  let raf = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!finished) {
      v += dt / seconds;
      bubbleT += dt;
      if (bubbleT > 0.35) { bubbleT = 0; h.sfx('sizzle'); }
      if (v >= 1) { v = 1; finish(0.5); }
    }
    // warna makanan: pucat -> keemasan -> cokelat
    const k = Math.min(1, v);
    food.style.filter = `sepia(${Math.min(0.6, k * 0.75)}) saturate(${0.9 + k * 1.6}) brightness(${k > 0.8 ? 1 - (k - 0.8) * 2.2 : 1.02})`;
    pot.style.setProperty('--bub', String(k));
    draw();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const tap = () => { if (!finished) finish(timingQuality(v, zone)); };
  btn.addEventListener('click', tap);
  pot.addEventListener('pointerdown', tap);
  return { destroy() { cancelAnimationFrame(raf); cv.destroy(); wrap.remove(); } };
};
