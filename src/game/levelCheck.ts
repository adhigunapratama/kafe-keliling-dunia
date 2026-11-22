import { getLevel } from '../data/levels';
import { MENUS } from '../data/menus';
import { RECIPES } from '../data/recipes';

/** Level bisa dimainkan bila semua menunya punya data menu + resep. */
export function isLevelPlayable(id: number): boolean {
  try {
    const L = getLevel(id);
    return L.menus.every((m) => MENUS[m] && RECIPES[m]);
  } catch {
    return false;
  }
}
