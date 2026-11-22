import { describe, expect, it } from 'vitest';
import { applyResult, migrate, totalStars } from '../src/game/progress';
import { timingQuality } from '../src/minigames/timing';
import { adjustPresetByFps } from '../src/engine/quality';
import { NavGrid, moveAt, moveEnd } from '../src/game/path';

describe('kemajuan', () => {
  it('mengulang level tidak pernah menurunkan bintang', () => {
    let p = applyResult(migrate({}), 1, 3, 80, true);
    p = applyResult(p, 1, 1, 30, true);
    expect(p.best[1]).toBe(3);
    expect(p.coins).toBe(110);
    expect(p.unlocked).toBe(2);
    expect(totalStars(p)).toBe(3);
  });
  it('level berikutnya hanya terbuka bila bisa dimainkan', () => {
    const p = applyResult(migrate({}), 1, 2, 10, false);
    expect(p.unlocked).toBe(1);
    expect(p.last).toBe(1);
  });
  it('migrasi simpanan rusak/lama tetap aman', () => {
    expect(migrate(null)).toEqual({ v: 2, unlocked: 1, best: {}, coins: 0, last: 1, decor: { owned: [], placed: {} }, familyCode: null, updatedAt: 0 });
    expect(migrate({ unlocked: 4, coins: -5 }).coins).toBe(0);
    expect(migrate({ unlocked: 99 }).unlocked).toBe(15);
    expect(migrate({ best: { 1: 7, 2: 2, 3: 'x' } }).best).toEqual({ 2: 2 });
  });
  it('simpanan v1 (Tahap 1–3) dimigrasi ke v2 tanpa kehilangan kemajuan', () => {
    const v1 = { v: 1, unlocked: 5, best: { 1: 3, 2: 2, 3: 1, 4: 3 }, coins: 340, last: 5 };
    const p = migrate(v1);
    expect(p.v).toBe(2);
    expect([p.unlocked, p.coins, p.last]).toEqual([5, 340, 5]);
    expect(p.best).toEqual({ 1: 3, 2: 2, 3: 1, 4: 3 });
    expect(p.decor).toEqual({ owned: [], placed: {} });
  });
});

describe('kode keluarga', () => {
  it('acak, format KAFE-XXXX-XXXX, tanpa huruf membingungkan', async () => {
    const { makeFamilyCode, normalizeFamilyCode, FAMILY_CODE_RE } = await import('../src/net/backup');
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) { const c = makeFamilyCode(); expect(c).toMatch(FAMILY_CODE_RE); expect(c).not.toMatch(/[01ILO]/); seen.add(c); }
    expect(seen.size).toBe(200);
    expect(normalizeFamilyCode(' kafe 7q2m-ab3c ')).toBe('KAFE-7Q2M-AB3C');
    expect(normalizeFamilyCode('7q2mab3c')).toBe('KAFE-7Q2M-AB3C');
  });
});

describe('mini-game & mesin', () => {
  it('timing: zona hijau sempurna, di luar tetap dapat nilai (tidak gagal)', () => {
    expect(timingQuality(0.7, [0.6, 0.8])).toBe(1);
    expect(timingQuality(0.55, [0.6, 0.8])).toBe(0.8);
    expect(timingQuality(0.1, [0.6, 0.8])).toBe(0.6);
  });
  it('preset grafis turun bila fps rendah', () => {
    expect(adjustPresetByFps('tinggi', 25)).toBe('sedang');
    expect(adjustPresetByFps('sedang', 25)).toBe('rendah');
    expect(adjustPresetByFps('tinggi', 40)).toBe('sedang');
    expect(adjustPresetByFps('tinggi', 60)).toBe('tinggi');
  });
  it('gerak lintasan: posisi & waktu tiba', () => {
    const m = { pts: [[0, 0], [3, 0], [3, 4]] as [number, number][], t0: 1, speed: 2 };
    expect(moveEnd(m)).toBeCloseTo(4.5);
    expect(moveAt(m, 2).x).toBeCloseTo(2);
    const end = moveAt(m, 10);
    expect([end.x, end.z, end.moving]).toEqual([3, 4, false]);
  });
  it('A* memutari penghalang', () => {
    const g = new NavGrid(-5, -5, 5, 5, 0.5);
    g.blockRect(-0.5, -4, 0.5, 4);
    const p = g.findPath([-3, 0], [3, 0]);
    expect(g.lastOk).toBe(true);
    for (let i = 1; i < p.length; i++) expect(g.lineFree(p[i - 1], p[i])).toBe(true);
  });
});
