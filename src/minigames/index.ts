import type { MinigameType } from '../data/recipes';
import type { MinigameFactory } from './types';
import { potong } from './potong';
import { seretBahan } from './seret';
import { timing } from './timing';
import { balik } from './balik';

/**
 * Daftar mini-game. Menambah jenis baru: buat file di folder ini, daftarkan di sini,
 * lalu tambahkan bentuk langkahnya di RecipeStep (src/data/recipes.ts).
 */
export const MINIGAMES: Record<MinigameType, MinigameFactory> = {
  potong,
  'seret-bahan': seretBahan,
  timing,
  balik,
};
