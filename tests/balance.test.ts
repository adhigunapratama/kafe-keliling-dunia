import { describe, expect, it } from 'vitest';
import { CafeSim, starsFor } from '../src/game/sim';
import { suggestWaiterTarget } from '../src/game/guide';
import { LEVELS } from '../src/data/levels';

/** Bot dengan kecepatan tertentu: chefT = detik per langkah masak, waitT = jeda Pelayan. */
function play(level: number, chefT: number, waitT: number, seed: number) {
  const sim = new CafeSim({ level, seed });
  let busy = 0, wn = 0;
  while (!sim.state.ended) {
    const s = sim.state;
    if (!s.waiter.goal && s.t >= wn) { const tg = suggestWaiterTarget(s); if (tg) { sim.waiterTap(tg); wn = s.t + waitT; } }
    if (s.t >= busy) { const tk = s.tickets.find((t) => t.state === 'cooking'); if (tk) { sim.completeStep(tk.id, 0.85); busy = s.t + chefT; } else if (s.sink > 0) { sim.washPlate(); busy = s.t + chefT * 0.6; } }
    if (s.pass.some((d) => !d.announced)) sim.ringBell();
    sim.tick(0.05);
  }
  return sim.state.stats;
}
const avg = (level: number, c: number, w: number) => [1, 2, 3].map((seed) => play(level, c, w, seed).score).reduce((a, b) => a + b, 0) / 3;

describe('keseimbangan 15 level', () => {
  for (const L of LEVELS) {
    it(`level ${L.id} (${L.country}): tim cepat 3★, tim santai-realistis ≥2★`, () => {
      expect(starsFor(avg(L.id, 3, 0.5), L)).toBe(3);
      expect(starsFor(avg(L.id, 6, 1.5), L)).toBeGreaterThanOrEqual(2);
    });
  }
});
