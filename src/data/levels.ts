/**
 * SEMUA angka kesulitan ada di sini supaya mudah disetel.
 * Satuan waktu: detik.
 */
export interface LevelDef {
  id: number;
  /** ID negara di src/data/countries.ts */
  country: string;
  menus: string[];
  /** Jumlah meja (2–5). */
  tables: number;
  /** Jeda kedatangan rombongan tamu (acak di antara min–max). */
  arrival: [number, number];
  /** Kesabaran tamu per fase. */
  patience: { seat: number; order: number; food: number };
  /** Jumlah tamu maksimum per rombongan (1–2). */
  maxParty: 1 | 2;
  /** Jumlah piring bersih di awal. */
  plates: number;
  /** Lama satu hari kafe. */
  duration: number;
  /** Batas skor tim untuk 1, 2, 3 bintang. */
  stars: [number, number, number];
  /** Lama tamu makan. */
  eatTime: number;
  /** Level tutorial (memandu kedua layar). */
  tutorial?: boolean;
  /** Final (perayaan khusus). */
  final?: boolean;
}

/** Pengali saat Mode Santai menyala. */
export const RELAXED = { patience: 1.6, arrival: 1.4 };

/** Aturan skor tim. */
export const SCORING = {
  happyBase: 10,
  qualityBonus: 5,
  patienceBonus: 3,
  angryPenalty: 3,
  wrongTablePenalty: 0,
  coinsPerStar: 20,
  coinsPerHappy: 2,
  /** Bel dianggap "tepat waktu" bila ditekan ≤ sekian detik setelah makanan siap. */
  bellOnTime: 8,
  /** Waktu baca menu sebelum tamu ingin memesan. */
  readMenu: 2.5,
};

const L = (id: number, country: string, menus: string[], o: Omit<LevelDef, 'id' | 'country' | 'menus'>): LevelDef => ({ id, country, menus, ...o });

export const LEVELS: LevelDef[] = [
  L(1, 'amerika', ['burger', 'kentang-goreng'], { tables: 2, arrival: [16, 24], patience: { seat: 50, order: 50, food: 110 }, maxParty: 1, plates: 4, duration: 200, stars: [25, 50, 80], eatTime: 6, tutorial: true }),
  L(2, 'italia', ['pizza', 'spaghetti'], { tables: 2, arrival: [15, 22], patience: { seat: 45, order: 45, food: 100 }, maxParty: 1, plates: 5, duration: 200, stars: [35, 70, 100], eatTime: 6 }),
  L(3, 'meksiko', ['taco', 'nachos'], { tables: 3, arrival: [14, 20], patience: { seat: 45, order: 45, food: 100 }, maxParty: 2, plates: 6, duration: 210, stars: [45, 85, 120], eatTime: 6 }),
  L(4, 'prancis', ['croissant', 'crepes'], { tables: 3, arrival: [13, 19], patience: { seat: 42, order: 42, food: 95 }, maxParty: 2, plates: 6, duration: 210, stars: [50, 90, 130], eatTime: 6 }),
  L(5, 'jepang', ['sushi', 'ramen'], { tables: 3, arrival: [13, 18], patience: { seat: 40, order: 40, food: 95 }, maxParty: 2, plates: 6, duration: 210, stars: [50, 95, 135], eatTime: 6 }),
  L(6, 'argentina', ['empanada', 'asado'], { tables: 3, arrival: [12, 18], patience: { seat: 40, order: 40, food: 90 }, maxParty: 2, plates: 6, duration: 220, stars: [55, 100, 145], eatTime: 6 }),
  L(7, 'australia', ['meat-pie', 'pavlova'], { tables: 3, arrival: [12, 17], patience: { seat: 38, order: 38, food: 90 }, maxParty: 2, plates: 6, duration: 220, stars: [55, 105, 150], eatTime: 6 }),
  L(8, 'turki', ['kebab', 'baklava'], { tables: 4, arrival: [12, 17], patience: { seat: 38, order: 38, food: 88 }, maxParty: 2, plates: 6, duration: 220, stars: [60, 110, 160], eatTime: 5.5 }),
  L(9, 'korea', ['bibimbap', 'tteokbokki'], { tables: 4, arrival: [11, 16], patience: { seat: 36, order: 36, food: 85 }, maxParty: 2, plates: 6, duration: 230, stars: [65, 120, 170], eatTime: 5.5 }),
  L(10, 'arab-saudi', ['kabsa', 'mutabbaq'], { tables: 4, arrival: [11, 16], patience: { seat: 36, order: 36, food: 85 }, maxParty: 2, plates: 6, duration: 230, stars: [65, 120, 175], eatTime: 5.5 }),
  L(11, 'tiongkok', ['dimsum', 'mi-tarik'], { tables: 4, arrival: [10, 15], patience: { seat: 34, order: 34, food: 82 }, maxParty: 2, plates: 7, duration: 230, stars: [70, 130, 185], eatTime: 5.5 }),
  L(12, 'nigeria', ['jollof', 'suya'], { tables: 4, arrival: [10, 15], patience: { seat: 34, order: 34, food: 80 }, maxParty: 2, plates: 7, duration: 230, stars: [70, 130, 190], eatTime: 5 }),
  L(13, 'thailand', ['pad-thai', 'mango-sticky-rice'], { tables: 4, arrival: [9, 14], patience: { seat: 32, order: 32, food: 78 }, maxParty: 2, plates: 7, duration: 240, stars: [75, 140, 200], eatTime: 5 }),
  L(14, 'india', ['kari', 'naan'], { tables: 5, arrival: [9, 13], patience: { seat: 32, order: 32, food: 76 }, maxParty: 2, plates: 8, duration: 240, stars: [80, 150, 210], eatTime: 5 }),
  L(15, 'indonesia', ['nasi-goreng', 'sate-ayam', 'es-teh-manis'], { tables: 5, arrival: [9, 13], patience: { seat: 32, order: 32, food: 78 }, maxParty: 2, plates: 8, duration: 240, stars: [80, 155, 220], eatTime: 5, final: true }),
];

export function getLevel(id: number): LevelDef {
  const l = LEVELS.find((l) => l.id === id);
  if (!l) throw new Error(`Level tidak dikenal: ${id}`);
  return l;
}
