/**
 * Bahan masakan. `icon` merujuk gambar 2D di src/ui/foodIcons.ts.
 * Nama tampil lewat i18n: `ing.<id>`.
 */
export interface IngredientDef {
  id: string;
  icon: string;
  /** Ikon saat ditabur di atas makanan (mis. saus jadi cipratan), bila beda. */
  topIcon?: string;
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
  adonan: { id: 'adonan', icon: 'dough' },
  'saus-tomat': { id: 'saus-tomat', icon: 'tomatoSauce', topIcon: 'sauceSplat' },
  basil: { id: 'basil', icon: 'basil' },
  pasta: { id: 'pasta', icon: 'pasta' },
  tortilla: { id: 'tortilla', icon: 'tortilla' },
  keripik: { id: 'keripik', icon: 'chips' },
  alpukat: { id: 'alpukat', icon: 'avocado' },
  ikan: { id: 'ikan', icon: 'fish' },
  nasi: { id: 'nasi', icon: 'rice' },
  nori: { id: 'nori', icon: 'nori' },
  timun: { id: 'timun', icon: 'cucumber' },
  mi: { id: 'mi', icon: 'noodles' },
  telur: { id: 'telur', icon: 'egg' },
  'daun-bawang': { id: 'daun-bawang', icon: 'scallion' },
  stroberi: { id: 'stroberi', icon: 'strawberry' },
  cokelat: { id: 'cokelat', icon: 'chocolate' },
  mangkuk: { id: 'mangkuk', icon: 'bowl' },
  'kulit-crepe': { id: 'kulit-crepe', icon: 'tortilla' },
  pizza: { id: 'pizza', icon: 'pizza' },
  croissant: { id: 'croissant', icon: 'croissant' },
};
