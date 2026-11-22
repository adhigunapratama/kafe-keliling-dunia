import { canBuy, getDecor } from '../data/decor';
import type { Progress } from './progress';

export type ShopRole = 'chef' | 'waiter';
export interface ShopPicks { chef: string | null; waiter: string | null }
export const NO_PICKS: ShopPicks = { chef: null, waiter: null };

/**
 * Satu anak mengetuk barang. Barang baru terbeli bila KEDUA anak memilih barang yang sama
 * (latihan berunding) dan koin tim cukup. Mengetuk lagi barang yang sama = batal memilih.
 */
export function shopPick(save: Progress, picks: ShopPicks, role: ShopRole, id: string): { picks: ShopPicks; save: Progress; bought: string | null } {
  const next: ShopPicks = { ...picks, [role]: picks[role] === id ? null : id };
  if (canBuy(id, next, save.coins, save.decor.owned)) {
    const d = getDecor(id)!;
    const placed = { ...save.decor.placed, [d.slot]: id };
    return { picks: { ...NO_PICKS }, bought: id, save: { ...save, coins: save.coins - d.price, decor: { owned: [...save.decor.owned, id], placed } } };
  }
  return { picks: next, save, bought: null };
}

/** Pasang / lepas dekorasi yang sudah dimiliki (tidak perlu persetujuan). */
export function togglePlace(save: Progress, id: string): Progress {
  const d = getDecor(id);
  if (!d || !save.decor.owned.includes(id)) return save;
  const placed = { ...save.decor.placed };
  if (placed[d.slot] === id) delete placed[d.slot]; else placed[d.slot] = id;
  return { ...save, decor: { ...save.decor, placed } };
}
