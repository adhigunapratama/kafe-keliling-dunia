import { CafeSim, decorObstacles } from './sim';
import type { SimEvent, Target } from './types';
import type { EmojiKind, HostMsg, Role, WaiterLink, WaiterMsg } from '../net/protocol';
import { getLevel } from '../data/levels';
import { getCountry } from '../data/countries';
import { decorEffects } from '../data/decor';

export interface EmojiMsg { from: Role; kind: EmojiKind; at: number }

/**
 * Sesi host: menjalankan simulasi (di HP Koki) dan meneruskan event ke layar-layar.
 * Di Tahap 1, Pelayan terhubung lewat LocalWaiterLink (satu perangkat).
 */
export class HostSession {
  readonly sim: CafeSim;
  paused = false;
  private evL = new Set<(e: SimEvent) => void>();
  private emojiL = new Set<(m: EmojiMsg) => void>();
  private waiterL = new Set<(m: HostMsg) => void>();

  constructor(level: number, relaxed: boolean, seed?: number, tutorial = false, readonly decorPlaced: Record<string, string> = {}) {
    const L = getLevel(level);
    const country = getCountry(L.country);
    this.sim = new CafeSim({ level, relaxed, seed, tutorial, obstacles: decorObstacles([...country.decorDining, ...decorEffects(decorPlaced).dining]) });
    this.sim.on((e) => {
      this.evL.forEach((f) => f(e));
      this.waiterL.forEach((f) => f({ t: 'event', e }));
    });
  }

  tick(dt: number) { if (!this.paused) this.sim.tick(dt); }

  onEvent(f: (e: SimEvent) => void) { this.evL.add(f); return () => { this.evL.delete(f); }; }
  onEmoji(f: (m: EmojiMsg) => void) { this.emojiL.add(f); return () => { this.emojiL.delete(f); }; }

  /** Koki mengirim emoji ke Pelayan. */
  chefEmoji(kind: EmojiKind) {
    this.emojiL.forEach((f) => f({ from: 'chef', kind, at: performance.now() }));
    this.waiterL.forEach((f) => f({ t: 'emoji', kind }));
  }

  /** Pesan dari perangkat Pelayan. */
  handleWaiter(msg: WaiterMsg) {
    if (msg.t === 'tap') { if (!this.paused) this.sim.waiterTap(msg.target as Target); }
    else if (msg.t === 'emoji') this.emojiL.forEach((f) => f({ from: 'waiter', kind: msg.kind, at: performance.now() }));
  }

  /** Penghubung Pelayan di perangkat yang sama (Mode Uji 1 Perangkat). */
  localWaiterLink(): WaiterLink {
    return {
      getState: () => this.sim.state,
      send: (m) => this.handleWaiter(m),
      onMessage: (f) => { this.waiterL.add(f); return () => { this.waiterL.delete(f); }; },
    };
  }
}
