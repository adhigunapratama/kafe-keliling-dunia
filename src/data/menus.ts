/**
 * Menu makanan. Tiap menu punya resep (src/data/recipes.ts), ikon 2D,
 * dan model 3D (ID model; lihat ASSETS.md tentang file GLB pengganti).
 */
export interface MenuDef {
  id: string;
  /** Ikon 2D di src/ui/foodIcons.ts */
  icon: string;
  /** ID model 3D, mis. 'food/burger' -> src/assets/models/food/burger.glb (opsional) */
  model: string;
  /** Peluang dipesan relatif terhadap menu lain di level yang sama. */
  weight: number;
}

export const MENUS: Record<string, MenuDef> = {
  burger: { id: 'burger', icon: 'burger', model: 'food/burger', weight: 1.2 },
  'kentang-goreng': { id: 'kentang-goreng', icon: 'fries', model: 'food/fries', weight: 1 },
  pizza: { id: 'pizza', icon: 'pizza', model: 'food/pizza', weight: 1.2 },
  spaghetti: { id: 'spaghetti', icon: 'spaghetti', model: 'food/spaghetti', weight: 1 },
  taco: { id: 'taco', icon: 'taco', model: 'food/taco', weight: 1.1 },
  nachos: { id: 'nachos', icon: 'nachos', model: 'food/nachos', weight: 1 },
  croissant: { id: 'croissant', icon: 'croissant', model: 'food/croissant', weight: 1 },
  crepes: { id: 'crepes', icon: 'crepes', model: 'food/crepes', weight: 1.1 },
  sushi: { id: 'sushi', icon: 'sushi', model: 'food/sushi', weight: 1.1 },
  ramen: { id: 'ramen', icon: 'ramen', model: 'food/ramen', weight: 1 },
  'empanada': { id: 'empanada', icon: 'empanada', model: 'food/empanada', weight: 1.1 },
  'asado': { id: 'asado', icon: 'asado', model: 'food/asado', weight: 1 },
  'meat-pie': { id: 'meat-pie', icon: 'meatPie', model: 'food/meat-pie', weight: 1.1 },
  'pavlova': { id: 'pavlova', icon: 'pavlova', model: 'food/pavlova', weight: 1 },
  'kebab': { id: 'kebab', icon: 'kebab', model: 'food/kebab', weight: 1.1 },
  'baklava': { id: 'baklava', icon: 'baklava', model: 'food/baklava', weight: 1 },
  'bibimbap': { id: 'bibimbap', icon: 'bibimbap', model: 'food/bibimbap', weight: 1.1 },
  'tteokbokki': { id: 'tteokbokki', icon: 'tteokbokki', model: 'food/tteokbokki', weight: 1 },
  'kabsa': { id: 'kabsa', icon: 'kabsa', model: 'food/kabsa', weight: 1.1 },
  'mutabbaq': { id: 'mutabbaq', icon: 'mutabbaq', model: 'food/mutabbaq', weight: 1 },
  'dimsum': { id: 'dimsum', icon: 'dimsum', model: 'food/dimsum', weight: 1.1 },
  'mi-tarik': { id: 'mi-tarik', icon: 'miTarik', model: 'food/mi-tarik', weight: 1 },
  'jollof': { id: 'jollof', icon: 'jollof', model: 'food/jollof', weight: 1.1 },
  'suya': { id: 'suya', icon: 'suya', model: 'food/suya', weight: 1 },
  'pad-thai': { id: 'pad-thai', icon: 'padThai', model: 'food/pad-thai', weight: 1.1 },
  'mango-sticky-rice': { id: 'mango-sticky-rice', icon: 'mangoStickyRice', model: 'food/mango-sticky-rice', weight: 1 },
  'kari': { id: 'kari', icon: 'kari', model: 'food/kari', weight: 1.1 },
  'naan': { id: 'naan', icon: 'naan', model: 'food/naan', weight: 1 },
  'nasi-goreng': { id: 'nasi-goreng', icon: 'nasiGoreng', model: 'food/nasi-goreng', weight: 1.2 },
  'sate-ayam': { id: 'sate-ayam', icon: 'sateAyam', model: 'food/sate-ayam', weight: 1.1 },
  'es-teh-manis': { id: 'es-teh-manis', icon: 'esTeh', model: 'food/es-teh-manis', weight: 0.9 },
};
