import type { CookStationId } from './stations';

/**
 * Langkah resep = satu mini-game di satu stasiun.
 * Jenis mini-game: lihat src/minigames/index.ts.
 */
export type RecipeStep =
  | { type: 'potong'; station: CookStationId; ingredient: string; cuts: number }
  /** layout 'stack' = ditumpuk (burger), 'scatter' = ditabur di atas (pizza, mangkuk) */
  | { type: 'seret-bahan'; station: CookStationId; base: string; items: string[]; distractors?: string[]; layout?: 'stack' | 'scatter' }
  /** putar jari memutar beberapa kali */
  | { type: 'aduk'; station: CookStationId; ingredient: string; turns: number }
  /** swipe panjang ke atas beberapa kali */
  | { type: 'gulung'; station: CookStationId; ingredient: string; rolls: number }
  /** seret separuh atas menutupi separuh bawah */
  | { type: 'lipat'; station: CookStationId; ingredient: string; folds: number }
  /** swipe ke samping berulang (mi tarik) */
  | { type: 'tarik'; station: CookStationId; ingredient: string; pulls: number }
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
  // ---------------- Italia
  pizza: {
    menu: 'pizza',
    steps: [
      { type: 'potong', station: 'talenan', ingredient: 'tomat', cuts: 3 },
      { type: 'seret-bahan', station: 'talenan', base: 'adonan', layout: 'scatter', items: ['saus-tomat', 'keju', 'keju', 'tomat', 'basil', 'basil'], distractors: ['ikan'] },
      { type: 'timing', station: 'oven', ingredient: 'pizza', action: 'panggang', seconds: 4, zone: [0.6, 0.82] },
    ],
  },
  spaghetti: {
    menu: 'spaghetti',
    steps: [
      { type: 'timing', station: 'kompor', ingredient: 'pasta', action: 'rebus', seconds: 3.6, zone: [0.58, 0.82] },
      { type: 'aduk', station: 'kompor', ingredient: 'saus-tomat', turns: 3 },
      { type: 'seret-bahan', station: 'talenan', base: 'pasta', layout: 'scatter', items: ['saus-tomat', 'keju', 'basil'], distractors: ['stroberi'] },
    ],
  },
  // ---------------- Meksiko
  taco: {
    menu: 'taco',
    steps: [
      { type: 'balik', station: 'panggangan', ingredient: 'daging', flips: 1, seconds: 3.2 },
      { type: 'potong', station: 'talenan', ingredient: 'tomat', cuts: 3 },
      { type: 'seret-bahan', station: 'talenan', base: 'tortilla', layout: 'scatter', items: ['daging', 'selada', 'tomat', 'keju', 'alpukat'], distractors: ['cokelat'] },
    ],
  },
  nachos: {
    menu: 'nachos',
    steps: [
      { type: 'potong', station: 'talenan', ingredient: 'alpukat', cuts: 2 },
      { type: 'seret-bahan', station: 'talenan', base: 'keripik', layout: 'scatter', items: ['keju', 'keju', 'tomat', 'alpukat', 'daging'], distractors: ['nori'] },
      { type: 'timing', station: 'oven', ingredient: 'keripik', action: 'panggang', seconds: 3.6, zone: [0.6, 0.82] },
    ],
  },
  // ---------------- Prancis
  croissant: {
    menu: 'croissant',
    steps: [
      { type: 'gulung', station: 'talenan', ingredient: 'adonan', rolls: 3 },
      { type: 'timing', station: 'oven', ingredient: 'croissant', action: 'panggang', seconds: 4, zone: [0.62, 0.8] },
    ],
  },
  crepes: {
    menu: 'crepes',
    steps: [
      { type: 'aduk', station: 'talenan', ingredient: 'adonan', turns: 3 },
      { type: 'balik', station: 'wajan', ingredient: 'adonan', flips: 1, seconds: 2.8 },
      { type: 'seret-bahan', station: 'talenan', base: 'kulit-crepe', layout: 'scatter', items: ['cokelat', 'stroberi', 'stroberi'], distractors: ['tomat'] },
    ],
  },
  // ---------------- Jepang
  sushi: {
    menu: 'sushi',
    steps: [
      { type: 'potong', station: 'talenan', ingredient: 'ikan', cuts: 3 },
      { type: 'seret-bahan', station: 'talenan', base: 'nori', layout: 'scatter', items: ['nasi', 'ikan', 'timun'], distractors: ['keju'] },
      { type: 'gulung', station: 'talenan', ingredient: 'nori', rolls: 3 },
    ],
  },
  ramen: {
    menu: 'ramen',
    steps: [
      { type: 'timing', station: 'kompor', ingredient: 'mi', action: 'rebus', seconds: 3.6, zone: [0.58, 0.82] },
      { type: 'aduk', station: 'kompor', ingredient: 'mi', turns: 2 },
      { type: 'seret-bahan', station: 'talenan', base: 'mangkuk', layout: 'scatter', items: ['mi', 'telur', 'nori', 'daun-bawang'], distractors: ['keripik'] },
    ],
  },
};

export function stationsForMenus(menuIds: string[]): CookStationId[] {
  const set = new Set<CookStationId>();
  for (const m of menuIds) for (const s of RECIPES[m]?.steps ?? []) set.add(s.station);
  return [...set];
}
