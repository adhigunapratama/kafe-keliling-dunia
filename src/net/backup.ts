import { onSaved, saveStore, saveProgress, replaceProgress, type Progress } from '../game/progress';
import { settings } from '../ui/settings';
import { roomServerUrl } from './client';
import { Store } from '../ui/store';

/** 31 huruf/angka yang tidak membingungkan (tanpa 0/O, 1/I/L). */
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const FAMILY_CODE_RE = /^KAFE-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;

export function makeFamilyCode(): string {
  const a = new Uint32Array(8);
  crypto.getRandomValues(a);
  const s = [...a].map((x) => ALPHA[x % ALPHA.length]).join('');
  return `KAFE-${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Rapikan ketikan pengguna: huruf besar, buang spasi/tanda baca, tambahkan tanda hubung. */
export function normalizeFamilyCode(input: string): string {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^KAFE/, '');
  return s.length === 8 ? `KAFE-${s.slice(0, 4)}-${s.slice(4)}` : input.toUpperCase().trim();
}

export type BackupStatus = 'idle' | 'saving' | 'saved' | 'offline';
export const backupState = new Store<{ status: BackupStatus; at: number }>({ status: 'idle', at: 0 });

let timer = 0;

/** Isi cadangan: simpanan + pengaturan + tampilan tokoh. */
function payload(p: Progress) {
  const s = settings.get();
  return { kind: 'kafe-keliling-dunia', save: p, settings: { lang: s.lang, relaxed: s.relaxed, guide: s.guide, narration: s.narration, chefLook: s.chefLook, waiterLook: s.waiterLook } };
}

async function upload(p: Progress) {
  const base = roomServerUrl();
  if (!base || !p.familyCode) return;
  backupState.set({ status: 'saving', at: Date.now() });
  try {
    const r = await fetch(`${base}/backup/${p.familyCode}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(p)) });
    backupState.set({ status: r.ok ? 'saved' : 'offline', at: Date.now() });
  } catch {
    backupState.set({ status: 'offline', at: Date.now() });
  }
}

/** Aktifkan cadangan otomatis (dipanggil sekali saat aplikasi mulai). */
export function initBackup() {
  onSaved((p) => {
    if (!roomServerUrl()) return;
    if (!p.familyCode) { saveProgress({ ...p, familyCode: makeFamilyCode() }); return; }
    clearTimeout(timer);
    timer = window.setTimeout(() => void upload(p), 1500);
  });
  // simpanan lama (sebelum Tahap 4) yang sudah ada kemajuannya -> buat kode & cadangkan
  const p = saveStore.get();
  if (roomServerUrl() && !p.familyCode && (p.updatedAt > 0 || Object.keys(p.best).length)) saveProgress({ ...p, familyCode: makeFamilyCode() });
}

/** Pulihkan dari Kode Keluarga. Melempar error 'notfound' / 'network' / 'invalid'. */
export async function restoreFromCode(input: string): Promise<void> {
  const code = normalizeFamilyCode(input);
  if (!FAMILY_CODE_RE.test(code)) throw new Error('invalid');
  const base = roomServerUrl();
  if (!base) throw new Error('network');
  let r: Response;
  try { r = await fetch(`${base}/backup/${code}`); } catch { throw new Error('network'); }
  if (r.status === 404) throw new Error('notfound');
  if (!r.ok) throw new Error('network');
  const data = await r.json() as { save?: unknown; settings?: Record<string, unknown> };
  replaceProgress({ ...(data.save as object), familyCode: code });
  if (data.settings) settings.update(data.settings as never);
}
