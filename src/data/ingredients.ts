/**
 * Bahan masakan. `icon` merujuk gambar 2D di src/ui/foodIcons.ts.
 * Nama tampil lewat i18n: `ing.<id>`.
 */
export interface IngredientDef {
  id: string;
  icon: string;
}

export const INGREDIENTS: Record<string, IngredientDef> = {
  'roti-bawah': { id: 'roti-bawah', icon: 'bunBottom' },
  'roti-atas': { id: 'roti-atas', icon: 'bunTop' },
  daging: { id: 'daging', icon: 'patty' },
  keju: { id: 'keju', icon: 'cheese' },
  selada: { id: 'selada', icon: 'lettuce' },
  tomat: { id: 'tomat', icon: 'tomato' },
  kentang: { id: 'kentang', icon: 'potato' },
  'kentang-potong': { id: 'kentang-potong', icon: 'potatoSticks' },
  saus: { id: 'saus', icon: 'ketchup' },
};
