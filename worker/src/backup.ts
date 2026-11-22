import { DurableObject } from 'cloudflare:workers';

/** Kode Keluarga: KAFE-XXXX-XXXX dari 31 huruf/angka yang mudah dibaca (±8,5 x 10^11 kemungkinan). */
export const FAMILY_CODE_RE = /^KAFE-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;
const MAX_BYTES = 64 * 1024;

/**
 * Cadangan simpanan per Kode Keluarga (satu Durable Object per kode, backend SQLite).
 * GET = ambil, PUT = simpan. Kode yang panjang & acak berfungsi sebagai kata sandi.
 */
export class KafeBackup extends DurableObject {
  async fetch(req: Request): Promise<Response> {
    if (req.method === 'GET') {
      const data = await this.ctx.storage.get<string>('data');
      return data ? new Response(data, { headers: { 'Content-Type': 'application/json' } }) : new Response('{"error":"notfound"}', { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'PUT') {
      const body = await req.text();
      if (body.length > MAX_BYTES) return new Response('{"error":"toolarge"}', { status: 413 });
      try { JSON.parse(body); } catch { return new Response('{"error":"json"}', { status: 400 }); }
      await this.ctx.storage.put('data', body);
      await this.ctx.storage.put('updatedAt', Date.now());
      return new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('method', { status: 405 });
  }
}
