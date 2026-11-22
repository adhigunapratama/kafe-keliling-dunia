import type { TableColor } from './palette';
import { TABLE_COLOR_ORDER } from './palette';

/** Tata letak ruang makan (koordinat dunia ruang makan 10x10, pusat 0,0). */
export const DINING = {
  /** Jendela saji di dinding kiri (x=-5). */
  pass: { x: -4.55, z: -2.6, stand: [-3.85, -2.6] as [number, number] },
  /** Pintu di dinding belakang (z=-5). */
  door: { x: 3.7, z: -4.97, spawn: [3.7, -4.7] as [number, number], stand: [2.9, -2.9] as [number, number] },
  /** Tempat antre tamu, dari depan pintu. */
  queue: [[3.7, -3.6], [3.85, -2.5], [4.0, -1.4]] as [number, number][],
  waiterStart: [-3.0, -1.4] as [number, number],
  /** Jarak kursi dari pusat meja (kursi di kiri & kanan meja, sumbu x). */
  chairOffset: 1.25,
  tableRadius: 0.92,
};

export interface TablePlacement { color: TableColor; x: number; z: number }

const P: Record<number, [number, number][]> = {
  2: [[-1.0, 0.9], [1.7, -1.0]],
  3: [[-1.6, -1.2], [1.4, -1.0], [-0.6, 2.4]],
  4: [[-1.6, -1.2], [1.6, -1.4], [-2.0, 2.4], [1.6, 2.2]],
  5: [[-2.0, -1.4], [1.3, -1.6], [-2.6, 2.3], [0.6, 2.6], [3.0, 1.0]],
};

export function tableLayout(count: number): TablePlacement[] {
  const pts = P[count];
  if (!pts) throw new Error(`Tidak ada tata letak untuk ${count} meja`);
  return pts.map(([x, z], i) => ({ color: TABLE_COLOR_ORDER[i], x, z }));
}
