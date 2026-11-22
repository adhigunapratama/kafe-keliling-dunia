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
  | { type: 'timing'; station: CookStationId; ingredient: string; action: 'goreng' | 'panggang' | 'rebus' | 'kukus'; seconds: number; zone: [number, number] }
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
  // ---------------- Argentina
  empanada: { menu: 'empanada', steps: [
    { type: 'seret-bahan', station: 'talenan', base: 'adonan', layout: 'scatter', items: ['daging', 'bawang', 'telur'], distractors: ['stroberi'] },
    { type: 'lipat', station: 'talenan', ingredient: 'adonan', folds: 2 },
    { type: 'timing', station: 'oven', ingredient: 'empanada-mentah', action: 'panggang', seconds: 3.8, zone: [0.6, 0.82] },
  ] },
  asado: { menu: 'asado', steps: [
    { type: 'balik', station: 'panggangan', ingredient: 'daging', flips: 2, seconds: 2.8 },
    { type: 'potong', station: 'talenan', ingredient: 'daging', cuts: 3 },
  ] },
  // ---------------- Australia (dua menu memakai oven bergantian)
  'meat-pie': { menu: 'meat-pie', steps: [
    { type: 'aduk', station: 'kompor', ingredient: 'daging', turns: 2 },
    { type: 'seret-bahan', station: 'talenan', base: 'adonan', layout: 'scatter', items: ['daging', 'bawang', 'adonan'], distractors: ['kiwi'] },
    { type: 'timing', station: 'oven', ingredient: 'meat-pie-mentah', action: 'panggang', seconds: 4, zone: [0.6, 0.8] },
  ] },
  pavlova: { menu: 'pavlova', steps: [
    { type: 'aduk', station: 'talenan', ingredient: 'krim', turns: 3 },
    { type: 'timing', station: 'oven', ingredient: 'meringue', action: 'panggang', seconds: 3.6, zone: [0.58, 0.8] },
    { type: 'seret-bahan', station: 'talenan', base: 'meringue', layout: 'scatter', items: ['krim', 'stroberi', 'kiwi', 'kiwi'], distractors: ['bawang'] },
  ] },
  // ---------------- Turki (lapisan berurutan)
  kebab: { menu: 'kebab', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'daging', cuts: 3 },
    { type: 'balik', station: 'panggangan', ingredient: 'daging', flips: 1, seconds: 3 },
    { type: 'seret-bahan', station: 'talenan', base: 'roti-pita', items: ['daging', 'selada', 'tomat', 'bawang', 'saus'], distractors: ['madu'] },
  ] },
  baklava: { menu: 'baklava', steps: [
    { type: 'seret-bahan', station: 'talenan', base: 'adonan', items: ['kacang', 'adonan', 'kacang', 'adonan', 'madu'], distractors: ['tomat'] },
    { type: 'potong', station: 'talenan', ingredient: 'baklava-mentah', cuts: 3 },
    { type: 'timing', station: 'oven', ingredient: 'baklava-mentah', action: 'panggang', seconds: 3.8, zone: [0.6, 0.82] },
  ] },
  // ---------------- Korea (banyak topping)
  bibimbap: { menu: 'bibimbap', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'wortel', cuts: 3 },
    { type: 'balik', station: 'wajan', ingredient: 'telur', flips: 1, seconds: 2.6 },
    { type: 'seret-bahan', station: 'talenan', base: 'nasi', layout: 'scatter', items: ['wortel', 'bayam', 'daging', 'telur', 'saus-pedas'], distractors: ['stroberi'] },
  ] },
  tteokbokki: { menu: 'tteokbokki', steps: [
    { type: 'timing', station: 'kompor', ingredient: 'kue-beras', action: 'rebus', seconds: 3.4, zone: [0.58, 0.82] },
    { type: 'aduk', station: 'wajan', ingredient: 'saus-pedas', turns: 3 },
    { type: 'seret-bahan', station: 'talenan', base: 'kue-beras', layout: 'scatter', items: ['saus-pedas', 'telur', 'daun-bawang'], distractors: ['krim'] },
  ] },
  // ---------------- Arab Saudi
  kabsa: { menu: 'kabsa', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'bawang', cuts: 3 },
    { type: 'aduk', station: 'kompor', ingredient: 'rempah', turns: 3 },
    { type: 'seret-bahan', station: 'talenan', base: 'nasi', layout: 'scatter', items: ['rempah', 'ayam', 'kacang', 'bawang'], distractors: ['nori'] },
  ] },
  mutabbaq: { menu: 'mutabbaq', steps: [
    { type: 'seret-bahan', station: 'talenan', base: 'adonan', layout: 'scatter', items: ['daging', 'telur', 'bawang'], distractors: ['stroberi'] },
    { type: 'lipat', station: 'talenan', ingredient: 'adonan', folds: 2 },
    { type: 'balik', station: 'wajan', ingredient: 'mutabbaq-mentah', flips: 1, seconds: 3 },
  ] },
  // ---------------- Tiongkok
  dimsum: { menu: 'dimsum', steps: [
    { type: 'seret-bahan', station: 'talenan', base: 'kulit-pangsit', layout: 'scatter', items: ['udang', 'daging', 'daun-bawang'], distractors: ['keju'] },
    { type: 'lipat', station: 'talenan', ingredient: 'kulit-pangsit', folds: 1 },
    { type: 'timing', station: 'kukusan', ingredient: 'dimsum-mentah', action: 'kukus', seconds: 3.8, zone: [0.58, 0.84] },
  ] },
  'mi-tarik': { menu: 'mi-tarik', steps: [
    { type: 'tarik', station: 'talenan', ingredient: 'adonan', pulls: 4 },
    { type: 'timing', station: 'kompor', ingredient: 'mi', action: 'rebus', seconds: 3.2, zone: [0.58, 0.82] },
    { type: 'seret-bahan', station: 'talenan', base: 'mangkuk', layout: 'scatter', items: ['mi', 'daging', 'daun-bawang', 'cabai'], distractors: ['kiwi'] },
  ] },
  // ---------------- Nigeria (masak nasi sambil memanggang)
  jollof: { menu: 'jollof', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'tomat', cuts: 3 },
    { type: 'aduk', station: 'kompor', ingredient: 'saus-tomat', turns: 2 },
    { type: 'timing', station: 'kompor', ingredient: 'nasi', action: 'rebus', seconds: 3.6, zone: [0.6, 0.82] },
  ] },
  suya: { menu: 'suya', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'daging', cuts: 3 },
    { type: 'seret-bahan', station: 'talenan', base: 'tusuk-sate', layout: 'scatter', items: ['rempah', 'cabai', 'kacang'], distractors: ['krim'] },
    { type: 'balik', station: 'panggangan', ingredient: 'tusuk-sate', flips: 1, seconds: 2.8 },
  ] },
  // ---------------- Thailand (wajan cepat)
  'pad-thai': { menu: 'pad-thai', steps: [
    { type: 'timing', station: 'kompor', ingredient: 'mi', action: 'rebus', seconds: 3, zone: [0.58, 0.82] },
    { type: 'aduk', station: 'wajan', ingredient: 'mi', turns: 2 },
    { type: 'seret-bahan', station: 'talenan', base: 'mi', layout: 'scatter', items: ['udang', 'telur', 'kacang', 'jeruk-nipis'], distractors: ['madu'] },
  ] },
  'mango-sticky-rice': { menu: 'mango-sticky-rice', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'mangga', cuts: 3 },
    { type: 'aduk', station: 'kompor', ingredient: 'santan', turns: 2 },
    { type: 'seret-bahan', station: 'talenan', base: 'ketan', layout: 'scatter', items: ['mangga', 'mangga', 'santan'], distractors: ['cabai'] },
  ] },
  // ---------------- India (banyak bumbu, tandoor)
  kari: { menu: 'kari', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'bawang', cuts: 3 },
    { type: 'aduk', station: 'kompor', ingredient: 'rempah', turns: 3 },
    { type: 'seret-bahan', station: 'talenan', base: 'mangkuk', layout: 'scatter', items: ['ayam', 'rempah', 'santan', 'cabai', 'bawang'], distractors: ['stroberi'] },
  ] },
  naan: { menu: 'naan', steps: [
    { type: 'gulung', station: 'talenan', ingredient: 'adonan', rolls: 2 },
    { type: 'timing', station: 'oven', ingredient: 'naan-mentah', action: 'panggang', seconds: 3, zone: [0.6, 0.82] },
  ] },
  // ---------------- Indonesia (final)
  'nasi-goreng': { menu: 'nasi-goreng', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'bawang', cuts: 3 },
    { type: 'aduk', station: 'wajan', ingredient: 'nasi', turns: 3 },
    { type: 'seret-bahan', station: 'talenan', base: 'nasi', layout: 'scatter', items: ['kecap', 'telur', 'cabai', 'bawang'], distractors: ['krim'] },
  ] },
  'sate-ayam': { menu: 'sate-ayam', steps: [
    { type: 'potong', station: 'talenan', ingredient: 'ayam', cuts: 3 },
    { type: 'balik', station: 'panggangan', ingredient: 'tusuk-sate', flips: 1, seconds: 2.8 },
    { type: 'seret-bahan', station: 'talenan', base: 'sate', layout: 'scatter', items: ['saus-kacang', 'bawang', 'cabai'], distractors: ['kiwi'] },
  ] },
  'es-teh-manis': { menu: 'es-teh-manis', steps: [
    { type: 'seret-bahan', station: 'talenan', base: 'gelas', items: ['es', 'teh', 'gula'], distractors: ['kecap'] },
    { type: 'aduk', station: 'talenan', ingredient: 'teh', turns: 2 },
  ] },
};

export function stationsForMenus(menuIds: string[]): CookStationId[] {
  const set = new Set<CookStationId>();
  for (const m of menuIds) for (const s of RECIPES[m]?.steps ?? []) set.add(s.station);
  return [...set];
}
