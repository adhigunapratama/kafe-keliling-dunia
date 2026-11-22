import type { CafeState, Target } from './types';

/**
 * Tujuan berikutnya yang disarankan untuk Pelayan (dipakai untuk panduan titik-titik
 * dan cincin kuning, serta tutorial). Mengembalikan null bila tidak ada yang perlu dilakukan.
 */
export function suggestWaiterTarget(s: CafeState): Target | null {
  const c = s.waiter.carry;
  const freeTable = () => s.tables.find((t) => t.party === null && t.dirty === 0);
  if (c?.k === 'party') { const t = freeTable(); return t ? { k: 'table', id: t.id } : null; }
  if (c?.k === 'order' || c?.k === 'dirty') return { k: 'pass' };
  if (c?.k === 'dish') return { k: 'table', id: c.dish.table };
  const waitingParty = (id: number) => s.parties.some((p) => p.id === id && p.state === 'waitFood');
  if (s.pass.some((d) => d.announced && waitingParty(d.party))) return { k: 'pass' };
  const ordering = s.parties.filter((p) => p.state === 'wantOrder').sort((a, b) => a.patience - b.patience)[0];
  if (ordering) return { k: 'table', id: ordering.table };
  const queued = s.parties.filter((p) => p.state === 'waitSeat').sort((a, b) => a.queueIdx - b.queueIdx)[0];
  if (queued && freeTable()) return { k: 'party', id: queued.id };
  const dirty = s.tables.find((t) => t.dirty > 0 && t.party === null);
  if (dirty) return { k: 'table', id: dirty.id };
  return null;
}

export function sameTarget(a: Target | null, b: Target | null): boolean {
  if (!a || !b) return a === b;
  if (a.k !== b.k) return false;
  if (a.k === 'pass') return true;
  return (a as { id: number }).id === (b as { id: number }).id;
}
