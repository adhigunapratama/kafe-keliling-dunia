import type { DecorItem, FloorPattern } from './countries';

/**
 * Dekorasi "Hias Kafe": dibeli dengan koin TIM, hanya bila kedua anak mengetuk barang
 * yang sama. Satu barang per slot dipasang sekaligus; tampil di SEMUA level.
 * Menambah dekorasi = menambah entri di DECOR (+ teks `decor.<id>` di i18n + ikon di DECOR_ICONS).
 */
export type DecorSlot = 'lantai' | 'meja' | 'lampu' | 'tanaman' | 'celemek' | 'syal';
export const DECOR_SLOTS: DecorSlot[] = ['lantai', 'meja', 'lampu', 'tanaman', 'celemek', 'syal'];

export interface DecorDef {
  id: string;
  slot: DecorSlot;
  price: number;
  /** Warna utama (untuk ikon & efek). */
  color: number;
  /** Efek pada ruang makan / dapur / tokoh. */
  floor?: FloorPattern;
  dining?: DecorItem[];
  kitchen?: DecorItem[];
  /** Hiasan kecil di atas setiap meja makan. */
  tableTop?: 'vase' | 'candle' | 'flag';
  apron?: number;
  scarf?: number;
}

export const DECOR: DecorDef[] = [
  { id: 'lantai-kayu', slot: 'lantai', price: 60, color: 0xc99a6b, floor: { kind: 'planks', colors: ['#c99a6b', '#bf8f60', '#d1a575', '#b98a5b'] } },
  { id: 'lantai-pelangi', slot: 'lantai', price: 90, color: 0xff7aa8, floor: { kind: 'checker', a: '#ffe0ec', b: '#fff3b0', n: 10 } },
  { id: 'lantai-laut', slot: 'lantai', price: 80, color: 0x5ebbe3, floor: { kind: 'tiles', base: '#bfe6f7', line: '#8fd3f4', n: 8 } },
  { id: 'meja-bunga', slot: 'meja', price: 50, color: 0xff7aa8, tableTop: 'vase' },
  { id: 'meja-lilin', slot: 'meja', price: 50, color: 0xffc233, tableTop: 'candle' },
  { id: 'meja-bendera', slot: 'meja', price: 40, color: 0xe9573f, tableTop: 'flag' },
  { id: 'lampu-untai', slot: 'lampu', price: 70, color: 0xffc233, dining: [{ kind: 'stringLights', wall: 'back', colors: [0xffc233, 0xff7aa8, 0x5bd06f, 0x5b9bf0] }], kitchen: [{ kind: 'stringLights', wall: 'left', colors: [0xffc233, 0xff7aa8, 0x5bd06f] }] },
  { id: 'lampu-lampion', slot: 'lampu', price: 70, color: 0xe9573f, dining: [{ kind: 'lantern', wall: 'left', at: 0.2, color: 0xe9573f }, { kind: 'lantern', wall: 'left', at: 3.0, color: 0xffc233 }] },
  { id: 'tanaman-palem', slot: 'tanaman', price: 60, color: 0x3f8f3a, dining: [{ kind: 'palm', x: 2.3, z: 4.4 }] },
  { id: 'tanaman-bunga', slot: 'tanaman', price: 50, color: 0xff7aa8, dining: [{ kind: 'flowerbox', wall: 'left', at: 3.4, colors: [0xff7aa8, 0xffc233, 0xffffff] }], kitchen: [{ kind: 'plant', x: 4.3, z: 4.3, pot: 0xff7aa8, leaf: 0x5baf4e }] },
  { id: 'celemek-pelangi', slot: 'celemek', price: 40, color: 0xa98be8, apron: 0xa98be8 },
  { id: 'celemek-hijau', slot: 'celemek', price: 40, color: 0x2e9e5b, apron: 0x2e9e5b },
  { id: 'syal-biru', slot: 'syal', price: 40, color: 0x1f6fd1, scarf: 0x1f6fd1 },
  { id: 'syal-emas', slot: 'syal', price: 60, color: 0xffc233, scarf: 0xffc233 },
];

export function getDecor(id: string): DecorDef | undefined { return DECOR.find((d) => d.id === id); }

/** Gabungan efek semua dekorasi yang dipasang. */
export interface DecorEffects { floor?: FloorPattern; dining: DecorItem[]; kitchen: DecorItem[]; tableTop?: DecorDef['tableTop']; apron?: number; scarf?: number }

export function decorEffects(placed: Record<string, string> | undefined): DecorEffects {
  const fx: DecorEffects = { dining: [], kitchen: [] };
  for (const id of Object.values(placed ?? {})) {
    const d = getDecor(id);
    if (!d) continue;
    if (d.floor) fx.floor = d.floor;
    if (d.dining) fx.dining.push(...d.dining);
    if (d.kitchen) fx.kitchen.push(...d.kitchen);
    if (d.tableTop) fx.tableTop = d.tableTop;
    if (d.apron !== undefined) fx.apron = d.apron;
    if (d.scarf !== undefined) fx.scarf = d.scarf;
  }
  return fx;
}

/** Aturan beli: kedua anak memilih barang yang sama, koin cukup, belum punya. */
export function canBuy(id: string, picks: { chef?: string | null; waiter?: string | null }, coins: number, owned: string[]): boolean {
  const d = getDecor(id);
  return !!d && picks.chef === id && picks.waiter === id && coins >= d.price && !owned.includes(id);
}
