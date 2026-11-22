import type { TableColor } from '../data/palette';
import type { Move } from './path';

/**
 * Status kafe. SELURUHNYA berupa data biasa (bisa di-JSON-kan), karena status ini
 * yang dikirim host (HP Koki) ke perangkat Pelayan.
 */
export interface GuestLook { skin: number; hair: number; shirt: number; pants: number; hairStyle: number }

export type DishState = 'none' | 'waiting' | 'served' | 'eaten';
export type Reaction = 'shake' | 'happy' | 'sad' | 'yum';

export interface Guest {
  id: number;
  look: GuestLook;
  move: Move;
  /** Kursi di meja (0 = kiri, 1 = kanan), -1 bila belum duduk. */
  seat: number;
  /** Menu pesanan tamu ini. */
  dish: string | null;
  dishState: DishState;
  eatStart: number;
  eatEnd: number;
  quality: number;
  react: Reaction | null;
  reactUntil: number;
}

export type PartyState =
  | 'arriving'     // berjalan dari pintu ke antrean
  | 'waitSeat'     // menunggu diantar ke meja (gelembung kursi)
  | 'withWaiter'   // sudah disambut Pelayan, menunggu meja dipilih
  | 'toTable'      // berjalan ke meja
  | 'reading'      // membaca menu
  | 'wantOrder'    // ingin memesan (gelembung buku menu)
  | 'waitFood'     // menunggu makanan (gelembung gambar makanan)
  | 'leaving';     // pulang (senang / cemberut)

export interface Party {
  id: number;
  state: PartyState;
  guests: Guest[];
  table: number;
  queueIdx: number;
  /** 0..1, berkurang saat menunggu. */
  patience: number;
  /** Detik penuh kesabaran untuk fase sekarang. */
  patienceFull: number;
  stateSince: number;
  mood: 'ok' | 'happy' | 'angry';
}

export interface TableS { id: number; color: TableColor; x: number; z: number; party: number | null; dirty: number }

export interface Ticket {
  id: number;
  party: number;
  table: number;
  menu: string;
  /** Indeks langkah resep yang sedang dikerjakan. */
  step: number;
  /** Rata-rata kualitas langkah (0..1). */
  quality: number;
  created: number;
  state: 'cooking' | 'needPlate';
}

export interface Dish { id: number; menu: string; table: number; party: number; quality: number; readyAt: number; announced: boolean }

export type Carry =
  | null
  | { k: 'party'; party: number }
  | { k: 'order'; party: number; table: number; items: string[] }
  | { k: 'dish'; dish: Dish }
  | { k: 'dirty'; n: number };

export type Target = { k: 'table'; id: number } | { k: 'party'; id: number } | { k: 'pass' };

export interface WaiterS { move: Move; carry: Carry; goal: Target | null; arriveAt: number }

export interface Stats {
  score: number;
  happy: number;
  angry: number;
  washed: number;
  right: number;
  wrong: number;
  bells: number;
  bellsOnTime: number;
}

export interface CafeState {
  level: number;
  relaxed: boolean;
  t: number;
  duration: number;
  ended: boolean;
  tables: TableS[];
  parties: Party[];
  tickets: Ticket[];
  pass: Dish[];
  clean: number;
  sink: number;
  totalPlates: number;
  waiter: WaiterS;
  stats: Stats;
  nextArrival: number;
  seq: number;
  rng: number;
}

export type SimEvent =
  | { e: 'arrive'; party: number }
  | { e: 'greet'; party: number }
  | { e: 'seated'; party: number; table: number }
  | { e: 'wantOrder'; party: number; table: number }
  | { e: 'order'; party: number; table: number }
  | { e: 'ticket'; ticket: number; menu: string; table: number }
  | { e: 'step'; ticket: number }
  | { e: 'dishReady'; dish: number; menu: string }
  | { e: 'needPlate' }
  | { e: 'bell'; dishes: { menu: string; table: number }[]; onTime: number }
  | { e: 'pickup'; dish: number }
  | { e: 'served'; table: number; menu: string }
  | { e: 'wrong'; table: number }
  | { e: 'happy'; party: number; table: number; points: number }
  | { e: 'angry'; party: number }
  | { e: 'collect'; table: number; n: number }
  | { e: 'dropOrder'; n: number }
  | { e: 'dropDirty'; n: number }
  | { e: 'washed' }
  | { e: 'noop'; target: Target }
  | { e: 'walk'; target: Target }
  | { e: 'end' };
