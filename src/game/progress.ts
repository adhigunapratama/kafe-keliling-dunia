import { LEVELS } from '../data/levels';
import { Store } from '../ui/store';
import { idbGet, idbSet } from './idb';

/**
 * SIMPANAN GAME (di perangkat host / HP Koki).
 * - Utama: IndexedDB. Cermin: localStorage (supaya layar judul langsung tahu kemajuan).
 * - Berversi (`v`) dengan migrasi, supaya simpanan aman saat game di-update.
 * - Disimpan otomatis setelah setiap level dan setiap pembelian dekorasi,
 *   lalu dicadangkan ke cloud dengan Kode Keluarga (lihat src/net/backup.ts).
 */
export const SAVE_VERSION = 2;

export interface DecorSave {
  /** ID dekorasi yang sudah dibeli. */
  owned: string[];
  /** Dekorasi yang dipasang per slot (mis. { lantai: 'lantai-kayu' }). */
  placed: Record<string, string>;
}

export interface Progress {
  v: 2;
  /** Level tertinggi yang terbuka. */
  unlocked: number;
  /** Bintang terbaik per level (id -> 1..3). Mengulang level tidak pernah menurunkan bintang. */
  best: Record<number, number>;
  coins: number;
  /** Level yang dibuka tombol "Lanjutkan". */
  last: number;
  decor: DecorSave;
  /** Kode Keluarga untuk cadangan cloud (dibuat otomatis). */
  familyCode: string | null;
  updatedAt: number;
}

const KEY = 'kkd.progress';
export const EMPTY_PROGRESS: Progress = { v: 2, unlocked: 1, best: {}, coins: 0, last: 1, decor: { owned: [], placed: {} }, familyCode: null, updatedAt: 0 };
const fresh = (): Progress => ({ ...EMPTY_PROGRESS, best: {}, decor: { owned: [], placed: {} } });

/** Ubah simpanan versi apa pun (atau rusak) menjadi versi terbaru. */
export function migrate(raw: unknown): Progress {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Progress> & { v?: number };
  const best: Record<number, number> = {};
  for (const [k, v] of Object.entries(r.best ?? {})) { const n = Number(v); if (n >= 1 && n <= 3) best[Number(k)] = Math.floor(n); }
  const clampLevel = (n: unknown) => Math.min(LEVELS.length, Math.max(1, Math.floor(Number(n) || 1)));
  // v1 (Tahap 1–3) belum punya decor/familyCode/updatedAt
  return {
    v: 2,
    unlocked: clampLevel(r.unlocked),
    best,
    coins: Math.max(0, Math.floor(Number(r.coins) || 0)),
    last: clampLevel(r.last),
    decor: { owned: Array.isArray(r.decor?.owned) ? r.decor!.owned.filter((x) => typeof x === 'string') : [], placed: { ...(r.decor?.placed ?? {}) } },
    familyCode: typeof r.familyCode === 'string' ? r.familyCode : null,
    updatedAt: Number(r.updatedAt) || 0,
  };
}

function loadMirror(): Progress {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw ? migrate(JSON.parse(raw)) : fresh();
  } catch { return fresh(); }
}

/** Simpanan aktif (reaktif untuk UI). */
export const saveStore = new Store<Progress>(loadMirror());
const listeners = new Set<(p: Progress) => void>();
/** Dipanggil setiap kali simpanan berubah (dipakai cadangan cloud). */
export function onSaved(f: (p: Progress) => void) { listeners.add(f); return () => { listeners.delete(f); }; }

function persist(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* penyimpanan penuh / mode privat */ }
  void idbSet('save', p);
}

/** Muat dari IndexedDB (lebih awet daripada localStorage). Dipanggil sekali saat aplikasi mulai. */
export async function initSave() {
  const fromIdb = await idbGet<unknown>('save');
  if (!fromIdb) { persist(saveStore.get()); return; }
  const p = migrate(fromIdb);
  if (p.updatedAt > saveStore.get().updatedAt) { saveStore.set(p); try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* abaikan */ } }
}

export function loadProgress(): Progress { return saveStore.get(); }

export function saveProgress(p: Progress) {
  const next = { ...p, v: 2 as const, updatedAt: Date.now() };
  saveStore.set(next);
  persist(next);
  listeners.forEach((f) => f(next));
}

/** Ganti seluruh simpanan (pulihkan dari Kode Keluarga / Main baru). */
export function replaceProgress(raw: unknown) { saveProgress(migrate(raw)); }
export function resetProgress() { const code = saveStore.get().familyCode; saveProgress({ ...fresh(), familyCode: code }); }

/** Gabungkan hasil level ke kemajuan (bintang terbaik dipertahankan). */
export function applyResult(p: Progress, level: number, stars: number, coins: number, nextPlayable: boolean): Progress {
  const best = { ...p.best, [level]: Math.max(p.best[level] ?? 0, stars) };
  const unlocked = nextPlayable ? Math.max(p.unlocked, Math.min(LEVELS.length, level + 1)) : p.unlocked;
  return { ...p, best, unlocked, coins: p.coins + coins, last: nextPlayable ? Math.min(LEVELS.length, level + 1) : level };
}

export function totalStars(p: Progress) { return Object.values(p.best).reduce((a, b) => a + b, 0); }
