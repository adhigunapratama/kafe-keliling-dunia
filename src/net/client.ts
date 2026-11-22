import { PROTOCOL_VERSION, type Role, type ServerMsg } from './protocol';
import { Store } from '../ui/store';

/** Alamat server ruangan: ?server=... (untuk uji) atau variabel build VITE_ROOM_SERVER_URL. */
export function roomServerUrl(): string {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('server') : null;
  const raw = q || (import.meta.env.VITE_ROOM_SERVER_URL as string | undefined) || '';
  return raw.replace(/\/+$/, '');
}

export type NetStatus = 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';
export type NetError = 'notfound' | 'version' | 'forbidden' | 'role' | 'replaced' | 'expired' | 'network' | null;

export interface NetState { status: NetStatus; peer: boolean; error: NetError; hostVersion?: number }

/** Minta kode ruangan baru (host / HP Koki). */
export async function createRoom(base: string): Promise<{ code: string; token: string }> {
  const r = await fetch(base + '/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ v: PROTOCOL_VERSION }) });
  if (!r.ok) throw new Error('server ' + r.status);
  return r.json();
}

const FATAL = new Set<NetError>(['notfound', 'version', 'forbidden', 'role', 'replaced', 'expired']);

/**
 * Sambungan WebSocket ke satu ruangan, dengan SAMBUNG ULANG otomatis
 * (sinyal putus, pindah WiFi <-> data seluler, layar mati sebentar).
 */
export class RoomClient<In = unknown, Out = unknown> {
  readonly state = new Store<NetState>({ status: 'connecting', peer: false, error: null });
  private ws: WebSocket | null = null;
  private listeners = new Set<(m: In) => void>();
  private tries = 0;
  private stopped = false;
  private lastRx = 0;
  private pingTimer = 0;
  private retryTimer = 0;
  private onVis = () => { if (!document.hidden && !this.stopped && this.ws?.readyState !== WebSocket.OPEN) this.reconnectNow(); };
  private onOnline = () => this.reconnectNow();

  constructor(readonly base: string, readonly code: string, readonly role: Role, readonly token?: string) {
    this.connect();
    document.addEventListener('visibilitychange', this.onVis);
    window.addEventListener('online', this.onOnline);
  }

  private url() {
    const u = new URL(this.base.replace(/^http/, 'ws') + `/rooms/${this.code}/ws`);
    u.searchParams.set('role', this.role);
    u.searchParams.set('v', String(PROTOCOL_VERSION));
    if (this.token) u.searchParams.set('token', this.token);
    return u.toString();
  }

  private connect() {
    if (this.stopped) return;
    const ws = (this.ws = new WebSocket(this.url()));
    ws.onopen = () => {
      this.lastRx = Date.now();
      clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        // tidak ada kabar 35 detik -> anggap putus
        if (Date.now() - this.lastRx > 35_000) { try { ws.close(); } catch { /* abaikan */ } return; }
        ws.send('ping');
      }, 15_000);
    };
    ws.onmessage = (e) => {
      this.lastRx = Date.now();
      if (e.data === 'pong') return;
      let m: ServerMsg | In;
      try { m = JSON.parse(e.data); } catch { return; }
      const sm = m as ServerMsg;
      if (sm.t === 'welcome') { this.tries = 0; this.state.update({ status: 'open', peer: sm.peer, error: null }); return; }
      if (sm.t === 'error') { this.state.update({ status: 'error', error: sm.error, hostVersion: sm.host }); return; }
      if (sm.t === 'peer') this.state.update({ peer: sm.connected });
      this.listeners.forEach((f) => f(m as In));
    };
    ws.onclose = (e) => {
      clearInterval(this.pingTimer);
      if (this.ws !== ws) return;
      const code = e.code;
      const err: NetError = code === 4000 ? 'replaced' : code === 4410 ? 'expired' : this.state.get().error;
      if (this.stopped || FATAL.has(err)) {
        this.state.update({ status: err && !this.stopped ? 'error' : 'closed', error: err, peer: false });
        return;
      }
      this.state.update({ status: 'reconnecting', peer: false, error: 'network' });
      const delay = Math.min(5000, 400 * 2 ** this.tries++);
      clearTimeout(this.retryTimer);
      this.retryTimer = window.setTimeout(() => this.connect(), delay);
    };
  }

  private reconnectNow() {
    if (this.stopped || FATAL.has(this.state.get().error)) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    clearTimeout(this.retryTimer);
    this.tries = 0;
    this.connect();
  }

  send(m: Out) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  onMessage(f: (m: In) => void) { this.listeners.add(f); return () => { this.listeners.delete(f); }; }

  close() {
    if (this.stopped) return;
    this.stopped = true;
    clearInterval(this.pingTimer);
    clearTimeout(this.retryTimer);
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('online', this.onOnline);
    try { this.ws?.close(1000, 'bye'); } catch { /* abaikan */ }
    this.state.update({ status: 'closed', peer: false });
  }
}

/** Ingat ruangan terakhir (2 jam) supaya muat ulang / aplikasi tertutup bisa langsung masuk lagi. */
const MEM_TTL = 2 * 60 * 60 * 1000;
export interface RoomMemory { code: string; token?: string; at: number }
export function rememberRoom(key: 'host' | 'guest', m: Omit<RoomMemory, 'at'> | null) {
  try {
    if (!m) localStorage.removeItem('kkd.room.' + key);
    else localStorage.setItem('kkd.room.' + key, JSON.stringify({ ...m, at: Date.now() }));
  } catch { /* abaikan */ }
}
export function recallRoom(key: 'host' | 'guest'): RoomMemory | null {
  try {
    const m = JSON.parse(localStorage.getItem('kkd.room.' + key) || 'null') as RoomMemory | null;
    return m && Date.now() - m.at < MEM_TTL ? m : null;
  } catch { return null; }
}
