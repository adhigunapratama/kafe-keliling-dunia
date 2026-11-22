import type { CafeState, SimEvent, Target } from '../game/types';

/**
 * Protokol pesan antara host (HP Koki) dan Pelayan.
 * Naikkan PROTOCOL_VERSION bila format pesan berubah: perangkat dengan versi
 * berbeda akan diminta "Perbarui game dulu ya".
 */
export const PROTOCOL_VERSION = 1;

export type EmojiKind = 'thumb' | 'heart' | 'bolt' | 'help';
export type Role = 'chef' | 'waiter';

/** Pelayan -> host */
export type WaiterMsg =
  | { t: 'tap'; target: Target }
  | { t: 'emoji'; kind: EmojiKind };

/** Host -> Pelayan */
export type HostMsg =
  | { t: 'state'; s: CafeState }
  | { t: 'event'; e: SimEvent }
  | { t: 'emoji'; kind: EmojiKind };

/** Antarmuka yang dipakai layar Pelayan, entah lokal (Mode Uji) atau lewat jaringan. */
export interface WaiterLink {
  /** Status terakhir yang diketahui. */
  getState(): CafeState | null;
  send(msg: WaiterMsg): void;
  onMessage(f: (m: HostMsg) => void): () => void;
}
