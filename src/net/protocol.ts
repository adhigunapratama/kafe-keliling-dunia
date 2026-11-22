import type { CafeState, SimEvent, Target } from '../game/types';
import type { ShopPicks } from '../game/shop';

/**
 * Protokol pesan antara host (HP Koki) dan Pelayan.
 * Naikkan PROTOCOL_VERSION bila format pesan berubah: perangkat dengan versi
 * berbeda akan diminta "Perbarui game dulu ya" (dicek oleh server ruangan).
 */
export const PROTOCOL_VERSION = 2;

export type EmojiKind = 'thumb' | 'heart' | 'bolt' | 'help';
export type Role = 'chef' | 'waiter';
export type Phase = 'lobby' | 'play' | 'result';

/** Pelayan -> host */
export type WaiterMsg =
  | { t: 'tap'; target: Target }
  | { t: 'emoji'; kind: EmojiKind }
  | { t: 'pause'; on: boolean }
  /** dikirim tiap kali tersambung; host menjawab dengan fase & status sekarang */
  | { t: 'hello' }
  /** Hias Kafe: Adik memilih / memasang barang */
  | { t: 'shopPick'; id: string }
  | { t: 'shopPlace'; id: string };

/** Host -> Pelayan */
export type HostMsg =
  | { t: 'state'; s: CafeState; paused?: boolean }
  | { t: 'event'; e: SimEvent }
  | { t: 'emoji'; kind: EmojiKind }
  | { t: 'lobby'; level: number; relaxed: boolean }
  | { t: 'start'; level: number; relaxed: boolean; round: number; decor?: Record<string, string> }
  | { t: 'pause'; on: boolean; waiting?: boolean }
  | { t: 'end'; s: CafeState }
  | { t: 'bye' }
  /** Hias Kafe: status toko (dibuka host, pilihan kedua anak, isi simpanan) */
  | { t: 'shop'; open: boolean; picks: ShopPicks; view: { coins: number; owned: string[]; placed: Record<string, string> }; bought: string | null };

/** Dari server ruangan sendiri. */
export type ServerMsg =
  | { t: 'welcome'; role: Role; peer: boolean }
  | { t: 'peer'; role: Role; connected: boolean }
  | { t: 'error'; error: 'notfound' | 'version' | 'forbidden' | 'role'; host?: number };

/** Antarmuka yang dipakai layar Pelayan, entah lokal (Mode Uji) atau lewat jaringan. */
export interface WaiterLink {
  /** Status terakhir yang diketahui (waktu sudah dimajukan secara lokal). */
  getState(): CafeState | null;
  send(msg: WaiterMsg): void;
  onMessage(f: (m: HostMsg) => void): () => void;
  /** Game sedang dijeda (layar boleh berhenti merender). */
  isPaused?(): boolean;
}
