import { LEVELS } from '../data/levels';

/**
 * Kemajuan permainan (sementara di localStorage; Tahap 4 memindahkannya ke IndexedDB
 * + cadangan cloud). Berversi supaya bisa dimigrasi.
 */
export interface Progress {
  v: 1;
  /** Level tertinggi yang terbuka. */
  unlocked: number;
  /** Bintang terbaik per level (id -> 1..3). Mengulang level tidak pernah menurunkan bintang. */
  best: Record<number, number>;
  coins: number;
  last: number;
}

const KEY = 'kkd.progress';
export const EMPTY_PROGRESS: Progress = { v: 1, unlocked: 1, best: {}, coins: 0, last: 1 };

export function loadProgress(): Progress {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...EMPTY_PROGRESS, best: {} };
    return migrate(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PROGRESS, best: {} };
  }
}

export function migrate(raw: unknown): Progress {
  const r = (raw ?? {}) as Partial<Progress>;
  return { v: 1, unlocked: Math.max(1, r.unlocked ?? 1), best: { ...(r.best ?? {}) }, coins: Math.max(0, r.coins ?? 0), last: r.last ?? 1 };
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* abaikan */ }
}

/** Gabungkan hasil level ke kemajuan (bintang terbaik dipertahankan). */
export function applyResult(p: Progress, level: number, stars: number, coins: number, nextPlayable: boolean): Progress {
  const best = { ...p.best, [level]: Math.max(p.best[level] ?? 0, stars) };
  const unlocked = nextPlayable ? Math.max(p.unlocked, Math.min(LEVELS.length, level + 1)) : p.unlocked;
  return { ...p, best, unlocked, coins: p.coins + coins, last: nextPlayable ? Math.min(LEVELS.length, level + 1) : level };
}

export function totalStars(p: Progress) { return Object.values(p.best).reduce((a, b) => a + b, 0); }
