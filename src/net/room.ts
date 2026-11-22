import { HostSession } from '../game/session';
import type { CafeState } from '../game/types';
import { Store } from '../ui/store';
import { RoomClient, type NetState } from './client';
import type { HostMsg, Phase, ServerMsg, WaiterLink, WaiterMsg } from './protocol';

/** Status ruangan yang dibaca layar host. */
export interface HostRoomState { phase: Phase; level: number; relaxed: boolean; round: number; paused: boolean; waitingPeer: boolean }

/**
 * Pengendali ruangan di HP Koki (host otoritatif).
 * Menjalankan simulasi lewat HostSession dan meneruskan status ringkas ke Pelayan:
 * event langsung, snapshot status (berisi lintasan, bukan posisi per frame) maks ±8x/detik
 * saat ada kejadian + detak 1x/detik.
 */
export class RoomHost {
  readonly client: RoomClient<WaiterMsg | ServerMsg, HostMsg>;
  readonly room: Store<HostRoomState>;
  session: HostSession | null = null;
  private offSession: (() => void) | null = null;
  private snapTimer = 0;
  private heartbeat = 0;
  private autoPaused = false;

  constructor(base: string, readonly code: string, token: string, level: number, relaxed: boolean) {
    this.client = new RoomClient(base, code, 'chef', token);
    this.room = new Store<HostRoomState>({ phase: 'lobby', level, relaxed, round: 0, paused: false, waitingPeer: false });
    this.client.onMessage((m) => this.onMessage(m));
    this.heartbeat = window.setInterval(() => { if (this.room.get().phase === 'play') this.sendState(); }, 1000);
  }

  get net(): Store<NetState> { return this.client.state; }

  private onMessage(m: WaiterMsg | ServerMsg) {
    if (m.t === 'peer') {
      if (m.role !== 'waiter') return;
      if (m.connected) this.onPeerBack(); else this.onPeerLost();
      return;
    }
    if (m.t === 'welcome' || m.t === 'error') return;
    if (m.t === 'pause') { this.setPaused(m.on); return; }
    if (m.t === 'hello') { this.resendPhase(); return; }
    this.session?.handleWaiter(m);
  }

  private onPeerLost() {
    const r = this.room.get();
    if (r.phase === 'play' && !r.paused) { this.autoPaused = true; this.setPaused(true, false); }
    this.room.update({ waitingPeer: true });
  }

  private onPeerBack() {
    this.room.update({ waitingPeer: false });
    this.resendPhase();
    if (this.autoPaused) { this.autoPaused = false; this.setPaused(false); }
  }

  /** Kirim ulang fase sekarang (dipakai saat Pelayan baru masuk / sambung ulang). */
  resendPhase() {
    const r = this.room.get();
    if (r.phase === 'lobby') this.client.send({ t: 'lobby', level: r.level, relaxed: r.relaxed });
    else if (r.phase === 'play' && this.session) {
      this.client.send({ t: 'start', level: r.level, relaxed: r.relaxed, round: r.round });
      this.sendState();
      this.client.send({ t: 'pause', on: r.paused });
    } else if (r.phase === 'result' && this.session) this.client.send({ t: 'end', s: this.session.sim.state });
  }

  setLobby(p: Partial<Pick<HostRoomState, 'level' | 'relaxed'>>) {
    this.room.update(p);
    if (this.room.get().phase === 'lobby') this.resendPhase();
  }

  /** Mulai (atau ulang) level. */
  start(level: number, relaxed: boolean): HostSession {
    this.offSession?.();
    const session = new HostSession(level, relaxed);
    this.session = session;
    const local = session.localWaiterLink();
    const off = local.onMessage((m) => {
      this.client.send(m);
      if (m.t === 'event') {
        if (m.e.e === 'end') this.end();
        else this.scheduleState();
      }
    });
    this.offSession = off;
    this.autoPaused = false;
    this.room.update({ phase: 'play', level, relaxed, round: this.room.get().round + 1, paused: false });
    this.resendPhase();
    return session;
  }

  private end() {
    this.room.update({ phase: 'result' });
    if (this.session) this.client.send({ t: 'end', s: this.session.sim.state });
  }

  backToLobby() {
    this.offSession?.(); this.offSession = null;
    this.session = null;
    this.room.update({ phase: 'lobby', paused: false });
    this.resendPhase();
  }

  setPaused(on: boolean, user = true) {
    if (user) this.autoPaused = false;
    if (this.session) this.session.paused = on;
    this.room.update({ paused: on });
    this.client.send({ t: 'pause', on, waiting: this.room.get().waitingPeer });
    this.sendState();
  }

  private scheduleState() {
    if (this.snapTimer) return;
    this.snapTimer = window.setTimeout(() => { this.snapTimer = 0; this.sendState(); }, 120);
  }

  private sendState() {
    if (this.session) this.client.send({ t: 'state', s: this.session.sim.state, paused: this.session.paused });
  }

  close() {
    this.client.send({ t: 'bye' });
    clearInterval(this.heartbeat);
    clearTimeout(this.snapTimer);
    this.offSession?.();
    this.client.close();
  }
}

/** Status ruangan yang dibaca layar Pelayan. */
export interface GuestRoomState { phase: Phase | 'waiting'; level: number; relaxed: boolean; round: number; paused: boolean; final: CafeState | null; hostLeft: boolean }

/**
 * Pengendali ruangan di tablet Pelayan. Menerima status ringkas dari host dan
 * memajukan waktunya sendiri supaya gerakan tokoh tetap halus di antara pesan.
 */
export class RoomGuest implements WaiterLink {
  readonly client: RoomClient<HostMsg | ServerMsg, WaiterMsg>;
  readonly room = new Store<GuestRoomState>({ phase: 'waiting', level: 1, relaxed: false, round: 0, paused: false, final: null, hostLeft: false });
  private snap: CafeState | null = null;
  private snapAt = 0;
  private snapPaused = false;
  private listeners = new Set<(m: HostMsg) => void>();

  constructor(base: string, readonly code: string) {
    this.client = new RoomClient(base, code, 'waiter');
    this.client.onMessage((m) => this.handle(m));
    let wasOpen = false;
    this.client.state.sub(() => {
      const open = this.client.state.get().status === 'open';
      if (open && !wasOpen) this.client.send({ t: 'hello' });
      wasOpen = open;
    });
  }

  get net(): Store<NetState> { return this.client.state; }

  private handle(m: HostMsg | ServerMsg) {
    switch (m.t) {
      case 'welcome': case 'error': return;
      case 'peer':
        if (m.role === 'chef') this.room.update({ hostLeft: !m.connected });
        return;
      case 'lobby': this.room.update({ phase: 'lobby', level: m.level, relaxed: m.relaxed, hostLeft: false }); break;
      case 'start':
        if (m.round !== this.room.get().round || this.room.get().phase !== 'play') { this.snap = null; this.room.update({ phase: 'play', level: m.level, relaxed: m.relaxed, round: m.round, final: null }); }
        break;
      case 'state': this.snap = m.s; this.snapAt = performance.now(); this.snapPaused = !!m.paused; break;
      case 'pause': this.room.update({ paused: m.on }); break;
      case 'end': this.snap = m.s; this.room.update({ phase: 'result', final: m.s }); break;
      case 'bye': this.room.update({ hostLeft: true }); break;
    }
    this.listeners.forEach((f) => f(m));
  }

  getState(): CafeState | null {
    const s = this.snap;
    if (!s) return null;
    if (this.snapPaused || this.room.get().paused || s.ended) return s;
    const dt = Math.min(3, (performance.now() - this.snapAt) / 1000);
    return { ...s, t: Math.min(s.duration, s.t + dt) };
  }

  send(msg: WaiterMsg) { this.client.send(msg); }
  onMessage(f: (m: HostMsg) => void) { this.listeners.add(f); return () => { this.listeners.delete(f); }; }
  close() { this.client.close(); }
}
