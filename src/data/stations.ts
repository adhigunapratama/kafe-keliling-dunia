/** Stasiun dapur. Stasiun yang muncul di level ditentukan oleh resep menu level itu. */
export const STATION_IDS = ['talenan', 'kompor', 'oven', 'panggangan', 'kukusan', 'wajan', 'wastafel', 'saji'] as const;
export type StationId = (typeof STATION_IDS)[number];
export type CookStationId = Exclude<StationId, 'wastafel' | 'saji'>;

/**
 * Slot dapur tempat stasiun masak diletakkan (koordinat dunia dapur 10x10).
 * A* = meja dapur kiri (dinding x=-5), I* = pulau tengah.
 */
export const KITCHEN_SLOTS = {
  A1: { x: -4.2, z: -3.2, stand: [-3.05, -3.0] as [number, number] },
  A2: { x: -4.2, z: -0.9, stand: [-3.05, -0.9] as [number, number] },
  A3: { x: -4.25, z: 1.9, stand: [-2.9, 1.9] as [number, number] },
  I1: { x: 0.35, z: 0.9, stand: [0.35, 2.1] as [number, number] },
  I2: { x: 1.45, z: 0.9, stand: [1.45, 2.1] as [number, number] },
  A4: { x: -4.2, z: 3.9, stand: [-3.05, 3.9] as [number, number] },
} as const;
export type KitchenSlot = keyof typeof KITCHEN_SLOTS;

/** Urutan slot yang disukai tiap stasiun (slot pertama yang kosong dipakai). */
export const STATION_SLOT_PREF: Record<CookStationId, KitchenSlot[]> = {
  talenan: ['A1', 'I1', 'I2', 'A4'],
  kompor: ['A2', 'I2', 'I1', 'A4'],
  oven: ['A3', 'A4', 'I2', 'I1'],
  panggangan: ['I2', 'A2', 'I1', 'A4'],
  kukusan: ['I1', 'A2', 'I2', 'A4'],
  wajan: ['A2', 'I2', 'I1', 'A4'],
};

/** Posisi tetap wastafel dan jendela saji. */
export const FIXED_STATIONS = {
  wastafel: { x: -1.0, z: -4.25, stand: [-1.0, -3.1] as [number, number] },
  saji: { x: 3.0, z: -4.3, stand: [3.0, -3.1] as [number, number] },
  /** Tumpukan piring bersih. */
  piring: { x: 0.9, z: -4.2 },
} as const;
