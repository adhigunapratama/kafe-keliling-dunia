import type { CookStationId } from './stations';

/**
 * Langkah resep = satu mini-game di satu stasiun.
 * Jenis mini-game: lihat src/minigames/index.ts.
 */
export type RecipeStep =
  | { type: 'potong'; station: CookStationId; ingredient: string; cuts: number }
  | { type: 'seret-bahan'; station: CookStationId; base: string; items: string[]; distractors?: string[] }
  | { type: 'timing'; station: CookStationId; ingredient: string; action: 'goreng' | 'panggang' | 'rebus'; seconds: number; zone: [number, number] }
  | { type: 'balik'; station: CookStationId; ingredient: string; flips: number; seconds: number };

export type MinigameType = RecipeStep['type'];

export interface RecipeDef {
  menu: string;
  steps: RecipeStep[];
}

export const RECIPES: Record<string, RecipeDef> = {
  burger: {
    menu: 'burger',
    steps: [
      { type: 'potong', station: 'talenan', ingredient: 'tomat', cuts: 3 },
      { type: 'balik', station: 'panggangan', ingredient: 'daging', flips: 1, seconds: 3.2 },
      { type: 'seret-bahan', station: 'talenan', base: 'roti-bawah', items: ['daging', 'keju', 'selada', 'tomat', 'roti-atas'], distractors: ['kentang'] },
    ],
  },
  'kentang-goreng': {
    menu: 'kentang-goreng',
    steps: [
      { type: 'potong', station: 'talenan', ingredient: 'kentang', cuts: 4 },
      { type: 'timing', station: 'kompor', ingredient: 'kentang-potong', action: 'goreng', seconds: 3.4, zone: [0.6, 0.82] },
    ],
  },
};

export function stationsForMenus(menuIds: string[]): CookStationId[] {
  const set = new Set<CookStationId>();
  for (const m of menuIds) for (const s of RECIPES[m]?.steps ?? []) set.add(s.station);
  return [...set];
}
