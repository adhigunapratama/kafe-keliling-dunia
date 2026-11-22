/**
 * Loop render global. Hanya berjalan bila ada yang aktif, dan berhenti saat tab tidak terlihat.
 */
type Tick = (dt: number, now: number) => void;
const ticks = new Set<Tick>();
let raf = 0;
let last = 0;
let paused = false;

function frame(now: number) {
  raf = 0;
  if (paused || ticks.size === 0) return;
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
  last = now;
  ticks.forEach((f) => f(dt, now / 1000));
  raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && !paused && ticks.size) { last = 0; raf = requestAnimationFrame(frame); } }

export function addTick(f: Tick) { ticks.add(f); kick(); return () => { ticks.delete(f); }; }

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (paused) { cancelAnimationFrame(raf); raf = 0; } else kick();
  });
}
