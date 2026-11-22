/**
 * Server ruangan Kafe Keliling Dunia.
 *
 *   POST /rooms                      -> { code, token }   (dipanggil HP Koki / host)
 *   GET  /rooms/:code/ws?role=chef|waiter&v=<protokol>[&token=..]  -> WebSocket
 *   GET  /health                     -> "ok"
 *
 * Satu Durable Object (KafeRoom) per kode ruangan. Server hanya meneruskan pesan;
 * simulasi berjalan di HP Koki.
 */
import { KafeRoom, type Env } from './room';
import { originAllowed } from './origin';
import { KafeBackup, FAMILY_CODE_RE } from './backup';
export { KafeRoom, KafeBackup };

const CODE_RE = /^\d{4}$/;

function cors(origin: string | null): Record<string, string> {
  return origin
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
    : {};
}

function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
}

function randomCode(): string {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 10000).padStart(4, '0');
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin');
    if (!originAllowed(origin, env.ALLOWED_ORIGINS ?? '')) return new Response('origin tidak diizinkan', { status: 403 });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });

    if (url.pathname === '/' || url.pathname === '/health') return new Response('ok', { headers: cors(origin) });

    if (url.pathname === '/rooms' && req.method === 'POST') {
      let v = 0;
      try { v = Number(((await req.json()) as { v?: number }).v) || 0; } catch { /* tanpa body */ }
      for (let i = 0; i < 40; i++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        const res = await stub.claim(v);
        if (res.ok) return json({ code, token: res.token }, 200, origin);
      }
      return json({ error: 'penuh' }, 503, origin);
    }

    const b = url.pathname.match(/^\/backup\/([A-Z0-9-]+)$/);
    if (b) {
      if (!FAMILY_CODE_RE.test(b[1])) return json({ error: 'kode' }, 400, origin);
      if (req.method !== 'GET' && req.method !== 'PUT') return json({ error: 'method' }, 405, origin);
      const res = await env.BACKUPS.get(env.BACKUPS.idFromName(b[1])).fetch(req);
      return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
    }

    const m = url.pathname.match(/^\/rooms\/(\d+)\/ws$/);
    if (m) {
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('butuh WebSocket', { status: 426 });
      if (!CODE_RE.test(m[1])) return new Response('kode tidak valid', { status: 400 });
      const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1]));
      return stub.fetch(req);
    }
    return new Response('tidak ditemukan', { status: 404, headers: cors(origin) });
  },
} satisfies ExportedHandler<Env>;
