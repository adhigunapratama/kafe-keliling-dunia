import { describe, expect, it } from 'vitest';
import { CafeSim, starsFor } from '../src/game/sim';
import { suggestWaiterTarget } from '../src/game/guide';
import { getLevel } from '../src/data/levels';
import { RECIPES } from '../src/data/recipes';

/** Bot sederhana yang memainkan Koki dan Pelayan dengan sempurna. */
function playBot(sim: CafeSim, opts: { washes?: boolean; bell?: boolean } = {}) {
  const washes = opts.washes ?? true, bell = opts.bell ?? true;
  let chefBusyUntil = 0;
  const dt = 1 / 20;
  while (!sim.state.ended) {
    const s = sim.state;
    // Pelayan: ikuti panduan bila sedang diam
    if (!s.waiter.goal) {
      const tg = suggestWaiterTarget(s);
      if (tg) sim.waiterTap(tg);
    }
    // Koki: tiap aksi butuh waktu 2.5 detik
    if (s.t >= chefBusyUntil) {
      const tk = s.tickets.find((t) => t.state === 'cooking');
      if (tk) { sim.completeStep(tk.id, 1); chefBusyUntil = s.t + 2.5; }
      else if (washes && s.sink > 0) { sim.washPlate(); chefBusyUntil = s.t + 1.5; }
    }
    if (bell && s.pass.some((d) => !d.announced)) sim.ringBell();
    sim.tick(dt);
    expect(sim.plateCount()).toBe(s.totalPlates);
  }
}

describe('CafeSim', () => {
  it('bot sempurna menyelesaikan Level 1 dengan 3 bintang tanpa tamu cemberut', () => {
    const sim = new CafeSim({ level: 1, seed: 42 });
    const events: string[] = [];
    sim.on((e) => events.push(e.e));
    playBot(sim);
    const st = sim.state.stats;
    expect(st.happy).toBeGreaterThanOrEqual(6);
    expect(st.angry).toBe(0);
    expect(st.wrong).toBe(0);
    expect(st.right).toBe(st.happy);
    expect(st.washed).toBeGreaterThan(0);
    expect(starsFor(st.score, getLevel(1))).toBe(3);
    for (const e of ['arrive', 'seated', 'order', 'ticket', 'dishReady', 'bell', 'pickup', 'served', 'happy', 'collect', 'dropDirty', 'washed', 'end']) expect(events).toContain(e);
  });

  it('tanpa cuci piring, piring bersih habis dan tamu menunggu (mekanik kerja sama)', () => {
    const sim = new CafeSim({ level: 1, seed: 7 });
    playBot(sim, { washes: false });
    expect(sim.state.clean).toBe(0);
    expect(sim.state.stats.happy).toBeLessThanOrEqual(getLevel(1).plates);
  });

  it('tanpa bel, Pelayan tidak bisa mengambil makanan', () => {
    const sim = new CafeSim({ level: 1, seed: 3 });
    playBot(sim, { bell: false });
    expect(sim.state.stats.happy).toBe(0);
    expect(sim.state.stats.angry).toBeGreaterThan(0);
  });

  it('tidak ada game over: tamu cemberut hanya mengurangi skor sedikit, skor tidak negatif', () => {
    const sim = new CafeSim({ level: 1, seed: 1 });
    while (!sim.state.ended) sim.tick(0.1);
    expect(sim.state.stats.angry).toBeGreaterThan(0);
    expect(sim.state.stats.score).toBe(0);
    expect(starsFor(0, getLevel(1))).toBe(1);
  });

  it('antar ke meja salah: tamu menggeleng, makanan tetap dibawa', () => {
    const sim = new CafeSim({ level: 1, seed: 11 });
    // jalankan sampai ada makanan siap di tangan Pelayan
    let guard = 0;
    while (sim.state.waiter.carry?.k !== 'dish' && guard++ < 20000) {
      const s = sim.state;
      if (!s.waiter.goal) { const tg = suggestWaiterTarget(s); if (tg) sim.waiterTap(tg); }
      const tk = s.tickets.find((t) => t.state === 'cooking');
      if (tk) sim.completeStep(tk.id, 0.5);
      if (s.pass.length) sim.ringBell();
      sim.tick(0.05);
    }
    const c = sim.state.waiter.carry;
    expect(c?.k).toBe('dish');
    if (c?.k !== 'dish') return;
    const wrong = sim.state.tables.find((t) => t.id !== c.dish.table)!;
    sim.waiterTap({ k: 'table', id: wrong.id });
    for (let i = 0; i < 200 && sim.state.waiter.goal; i++) sim.tick(0.05);
    expect(sim.state.stats.wrong).toBe(1);
    expect(sim.state.waiter.carry?.k).toBe('dish');
  });

  it('Mode Santai membuat tamu lebih sabar', () => {
    const a = new CafeSim({ level: 1, seed: 5 });
    const b = new CafeSim({ level: 1, seed: 5, relaxed: true });
    const firstAngry = (sim: CafeSim) => { while (!sim.state.ended && sim.state.stats.angry === 0) sim.tick(0.1); return sim.state.t; };
    expect(firstAngry(b)).toBeGreaterThan(firstAngry(a));
  });

  it('status bisa di-JSON-kan (untuk dikirim lewat jaringan)', () => {
    const sim = new CafeSim({ level: 1, seed: 9 });
    for (let i = 0; i < 400; i++) sim.tick(0.1);
    const copy = JSON.parse(JSON.stringify(sim.state));
    expect(copy).toEqual(sim.state);
  });

  it('kualitas masakan rendah tetap menghasilkan makanan', () => {
    const sim = new CafeSim({ level: 1, seed: 2 });
    sim.state.tickets.push({ id: 999, party: -1, table: 0, menu: 'burger', step: 0, quality: 1, created: 0, state: 'cooking' });
    for (let i = 0; i < RECIPES.burger.steps.length; i++) sim.completeStep(999, 0.2);
    expect(sim.state.pass.length).toBe(1);
    expect(sim.state.pass[0].quality).toBeCloseTo(0.2);
  });
});
