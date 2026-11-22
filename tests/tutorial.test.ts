import { describe, expect, it } from 'vitest';
import { CafeSim } from '../src/game/sim';
import { suggestWaiterTarget } from '../src/game/guide';
import { tutorialHint, type TutStep } from '../src/game/tutorial';

describe('tutorial Level 1', () => {
  it('memandu satu putaran penuh dengan urutan yang benar, lalu selesai', () => {
    const sim = new CafeSim({ level: 1, seed: 4, tutorial: true });
    const steps: TutStep[] = [];
    let chefBusy = 0, maxParties = 0;
    const startDuration = sim.state.duration;
    for (let i = 0; i < 20000 && sim.state.stats.washed === 0; i++) {
      const s = sim.state;
      const h = tutorialHint(s)!;
      if (steps[steps.length - 1] !== h.step) steps.push(h.step);
      maxParties = Math.max(maxParties, s.parties.length);
      // ikuti petunjuk tutorial persis
      if (!s.waiter.goal && h.waiter?.target) sim.waiterTap(h.waiter.target);
      if (s.t > chefBusy) {
        if (h.chef?.station === 'bell') sim.ringBell();
        else if (h.chef?.station === 'wastafel') sim.washPlate();
        else if (h.chef?.station) { const tk = s.tickets.find((t) => t.state === 'cooking')!; sim.completeStep(tk.id, 1); }
        chefBusy = s.t + 1.5;
      }
      // tamu tidak boleh kehilangan kesabaran selama tutorial
      for (const p of s.parties) expect(p.patience).toBe(1);
      sim.tick(0.05);
    }
    expect(sim.state.stats.washed).toBe(1);
    expect(tutorialHint(sim.state)!.step).toBe('done');
    expect(maxParties).toBe(1);
    expect(sim.state.duration).toBeGreaterThan(startDuration); // timer berhenti selama tutorial
    const want: TutStep[] = ['greet', 'seat', 'order', 'toKitchen', 'cook', 'bell', 'pickup', 'deliver', 'eat', 'clear', 'plates', 'wash'];
    let k = 0;
    for (const st of steps) if (st === want[k]) k++;
    expect(k, `urutan: ${steps.join(' > ')}`).toBe(want.length);
  });

  it('tanpa tutorial: tidak ada petunjuk; setelah tutorial tamu datang normal', () => {
    expect(tutorialHint(new CafeSim({ level: 1, seed: 1 }).state)).toBeNull();
    expect(new CafeSim({ level: 2, seed: 1, tutorial: true }).state.tutorial).toBe(false);
    const sim = new CafeSim({ level: 1, seed: 8, tutorial: true });
    sim.state.stats.washed = 1;
    let guard = 0;
    while (sim.state.parties.length < 2 && guard++ < 4000) { if (!sim.state.waiter.goal) { const t = suggestWaiterTarget(sim.state); if (t) sim.waiterTap(t); } sim.tick(0.1); }
    expect(sim.state.parties.length).toBeGreaterThanOrEqual(2);
  });
});
