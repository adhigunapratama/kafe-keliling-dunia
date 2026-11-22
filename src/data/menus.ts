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
};
