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
};
