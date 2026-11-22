import { DurableObject } from 'cloudflare:workers';

export interface Env {
  ROOMS: DurableObjectNamespace<KafeRoom>;
  BACKUPS: DurableObjectNamespace;
  ALLOWED_ORIGINS: string;
}

type Role = 'chef' | 'waiter';
interface Meta { token: string; v: number; claimedAt: number; lastActive: number }

/** Ruangan kedaluwarsa setelah tidak aktif selama ini. */
const ROOM_TTL = 2 * 60 * 60 * 1000;
/** Batas ukuran satu pesan. */
const MAX_MSG = 64 * 1024;

/**
 * Satu ruangan = satu Durable Object (backend SQLite, paket gratis).
 * Memakai WebSocket Hibernation API: objek boleh "tidur" di antara pesan sehingga hemat.
 * "ping" dibalas "pong" otomatis tanpa membangunkan objek.
 */
export class KafeRoom extends DurableObject<Env> {
  private lastTouch = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  private open(role?: Role, except?: WebSocket): WebSocket[] {
    return this.ctx.getWebSockets(role).filter((w) => w !== except && w.readyState === WebSocket.OPEN);
  }

  /** Klaim ruangan untuk host baru. Gagal bila ruangan masih dipakai. */
  async claim(v: number): Promise<{ ok: boolean; token?: string }> {
    const meta = await this.ctx.storage.get<Meta>('meta');
    const now = Date.now();
    if (meta && now - meta.lastActive < ROOM_TTL && this.ctx.getWebSockets().length > 0) return { ok: false };
    if (meta && now - meta.lastActive < 10 * 60 * 1000) return { ok: false };
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    await this.ctx.storage.put<Meta>('meta', { token, v, claimedAt: now, lastActive: now });
    await this.ctx.storage.setAlarm(now + ROOM_TTL);
    return { ok: true, token };
  }

  private reject(code: number, error: string, extra: Record<string, unknown> = {}): Response {
    const pair = new WebSocketPair();
    const server = pair[1];
    server.accept();
    server.send(JSON.stringify({ t: 'error', error, ...extra }));
    server.close(code, error);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const role = url.searchParams.get('role') as Role | null;
    const v = Number(url.searchParams.get('v'));
    const meta = await this.ctx.storage.get<Meta>('meta');
    if (role !== 'chef' && role !== 'waiter') return this.reject(4400, 'role');
    if (!meta) return this.reject(4404, 'notfound');
    if (role === 'chef' && url.searchParams.get('token') !== meta.token) return this.reject(4403, 'forbidden');
    if (v !== meta.v) return this.reject(4426, 'version', { host: meta.v });

    // sambungan baru menggantikan sambungan lama dengan peran yang sama (sambung ulang)
    for (const old of this.ctx.getWebSockets(role)) { try { old.close(4000, 'replaced'); } catch { /* sudah tertutup */ } }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role });
    const other: Role = role === 'chef' ? 'waiter' : 'chef';
    server.send(JSON.stringify({ t: 'welcome', role, peer: this.open(other).length > 0 }));
    this.broadcast(other, JSON.stringify({ t: 'peer', role, connected: true }));
    await this.touch(true);
    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(role: Role, msg: string) {
    for (const w of this.open(role)) { try { w.send(msg); } catch { /* abaikan */ } }
  }

  private async touch(force = false) {
    const now = Date.now();
    if (!force && now - this.lastTouch < 60_000) return;
    this.lastTouch = now;
    const meta = await this.ctx.storage.get<Meta>('meta');
    if (meta) { meta.lastActive = now; await this.ctx.storage.put('meta', meta); }
    await this.ctx.storage.setAlarm(now + ROOM_TTL);
  }

  async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
    if (typeof msg !== 'string' || msg.length > MAX_MSG) return;
    const { role } = ws.deserializeAttachment() as { role: Role };
    this.broadcast(role === 'chef' ? 'waiter' : 'chef', msg);
    await this.touch();
  }

  async webSocketClose(ws: WebSocket, code: number) {
    const { role } = ws.deserializeAttachment() as { role: Role };
    try { ws.close(code === 1005 ? 1000 : code, 'bye'); } catch { /* sudah tertutup */ }
    // hanya umumkan "terputus" bila tidak ada sambungan pengganti
    if (this.open(role, ws).length === 0) this.broadcast(role === 'chef' ? 'waiter' : 'chef', JSON.stringify({ t: 'peer', role, connected: false }));
  }

  async webSocketError(ws: WebSocket) { await this.webSocketClose(ws, 1011); }

  async alarm() {
    const meta = await this.ctx.storage.get<Meta>('meta');
    const now = Date.now();
    if (meta && now - meta.lastActive < ROOM_TTL) { await this.ctx.storage.setAlarm(meta.lastActive + ROOM_TTL); return; }
    for (const w of this.ctx.getWebSockets()) { try { w.close(4410, 'expired'); } catch { /* abaikan */ } }
    await this.ctx.storage.deleteAll();
  }
}
