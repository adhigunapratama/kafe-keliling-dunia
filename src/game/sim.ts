import { DINING, tableLayout } from '../data/layouts';
import { getLevel, RELAXED, SCORING, type LevelDef } from '../data/levels';
import { MENUS } from '../data/menus';
import { RECIPES } from '../data/recipes';
import { HAIR_COLORS, PANTS_COLORS, SHIRT_COLORS, SKIN_TONES } from '../data/palette';
import { NavGrid, moveAt, moveEnd, stillMove, type P2, type Move } from './path';
import { Rng } from './rng';
import type { CafeState, Carry, Dish, Guest, Party, SimEvent, TableS, Target, Ticket } from './types';

export const WAITER_SPEED = 2.5;
export const GUEST_SPEED = 1.5;

export interface SimOptions {
  level: number;
  relaxed?: boolean;
  seed?: number;
  /** Jalankan tutorial (hanya untuk level bertanda tutorial). */
  tutorial?: boolean;
  /** Penghalang tambahan di ruang makan (mis. tanaman hiasan): [x, z, radius]. */
  obstacles?: [number, number, number][];
}

/** Hitung bintang (selalu minimal 1: tidak ada "gagal"). */
export function starsFor(score: number, level: LevelDef): 1 | 2 | 3 {
  if (score >= level.stars[2]) return 3;
  if (score >= level.stars[1]) return 2;
  return 1;
}
/** Bintang yang sudah "terisi" selama bermain (0..3) untuk HUD. */
export function starsProgress(score: number, level: LevelDef): number {
  return level.stars.filter((s) => score >= s).length;
}
export function coinsFor(score: number, happy: number, level: LevelDef): number {
  return starsFor(score, level) * SCORING.coinsPerStar + happy * SCORING.coinsPerHappy;
}

export function chairPos(t: { x: number; z: number }, seat: number): P2 {
  return [t.x + (seat === 0 ? -DINING.chairOffset : DINING.chairOffset), t.z];
}
export function tableStand(t: { x: number; z: number }): P2 {
  return [t.x, t.z + 1.35];
}

/** Grid navigasi ruang makan (dipakai host untuk simulasi dan Pelayan untuk panduan arah). */
export function buildDiningNav(tables: { x: number; z: number }[], obstacles: [number, number, number][]): NavGrid {
  const nav = new NavGrid(-4.75, -4.75, 4.75, 4.75, 0.25);
  for (const tb of tables) {
    nav.blockCircle(tb.x, tb.z, DINING.tableRadius + 0.2);
    for (const s of [0, 1]) { const [cx, cz] = chairPos(tb, s); nav.blockCircle(cx, cz, 0.42); }
  }
  nav.blockRect(-5, DINING.pass.z - 1.1, -4.15, DINING.pass.z + 1.1);
  for (const [x, z, r] of obstacles) nav.blockCircle(x, z, r + 0.15);
  return nav;
}

/** Penghalang dari hiasan (tanaman) negara. */
export function decorObstacles(items: { kind: string; x?: number; z?: number; size?: number }[]): [number, number, number][] {
  return items.filter((d) => d.kind === 'plant' || d.kind === 'cactus' || d.kind === 'bamboo').map((d) => [d.x!, d.z!, 0.45 * (d.size ?? 1)]);
}

/**
 * Simulasi kafe yang otoritatif (berjalan di perangkat host / HP Koki).
 * Tidak bergantung pada Three.js atau DOM, supaya bisa dites di Node.
 */
export class CafeSim {
  readonly level: LevelDef;
  state: CafeState;
  readonly nav: NavGrid;
  private rng: Rng;
  private listeners = new Set<(e: SimEvent) => void>();

  constructor(opts: SimOptions) {
    this.level = getLevel(opts.level);
    const L = this.level;
    const seed = opts.seed ?? (Math.random() * 2 ** 31) | 0;
    this.rng = new Rng(seed);
    const tables: TableS[] = tableLayout(L.tables).map((p, i) => ({ id: i, color: p.color, x: p.x, z: p.z, party: null, dirty: 0 }));
    this.state = {
      level: L.id,
      relaxed: !!opts.relaxed,
      t: 0,
      duration: L.duration,
      ended: false,
      tables,
      parties: [],
      tickets: [],
      pass: [],
      clean: L.plates,
      sink: 0,
      totalPlates: L.plates,
      waiter: { move: stillMove(DINING.waiterStart, 0), carry: null, goal: null, arriveAt: 0 },
      stats: { score: 0, happy: 0, angry: 0, washed: 0, right: 0, wrong: 0, bells: 0, bellsOnTime: 0 },
      nextArrival: 2,
      tutorial: !!opts.tutorial && !!L.tutorial,
      seq: 1,
      rng: seed,
    };
    this.nav = buildDiningNav(tables, opts.obstacles ?? []);
  }

  on(f: (e: SimEvent) => void) { this.listeners.add(f); return () => this.listeners.delete(f); }
  private emit(e: SimEvent) { this.listeners.forEach((f) => f(e)); }
  private id() { return this.state.seq++; }

  // ---------------------------------------------------------------- helpers
  party(id: number) { return this.state.parties.find((p) => p.id === id); }
  table(id: number) { return this.state.tables[id]; }
  waiterPos(): P2 { const s = moveAt(this.state.waiter.move, this.state.t); return [s.x, s.z]; }
  /** Tutorial masih berjalan (selesai setelah piring pertama dicuci). */
  tutorialActive(): boolean { return this.state.tutorial && this.state.stats.washed === 0; }
  private patienceMul() { return this.state.relaxed ? RELAXED.patience : 1; }

  private setState(p: Party, st: Party['state'], patienceSec = 0) {
    p.state = st;
    p.stateSince = this.state.t;
    if (patienceSec > 0) { p.patience = 1; p.patienceFull = patienceSec * this.patienceMul(); }
  }

  private walk(from: P2, to: P2, speed: number, delay = 0): Move {
    return { pts: this.nav.findPath(from, to), t0: this.state.t + delay, speed };
  }

  private queueSpot(idx: number, guestIdx: number): P2 {
    const q = DINING.queue[Math.min(idx, DINING.queue.length - 1)];
    return [q[0] + (guestIdx === 0 ? 0 : -0.5), q[1] + (guestIdx === 0 ? 0 : 0.15)];
  }

  private queueParties() {
    return this.state.parties.filter((p) => p.state === 'arriving' || p.state === 'waitSeat' || p.state === 'withWaiter').sort((a, b) => a.queueIdx - b.queueIdx);
  }

  private reflowQueue() {
    this.queueParties().forEach((p, i) => {
      if (p.queueIdx === i) return;
      p.queueIdx = i;
      p.guests.forEach((g, gi) => {
        const s = moveAt(g.move, this.state.t);
        g.move = this.walk([s.x, s.z], this.queueSpot(i, gi), GUEST_SPEED);
      });
    });
  }

  private randomLook() {
    const r = this.rng;
    return { skin: r.pick(SKIN_TONES), hair: r.pick(HAIR_COLORS), shirt: r.pick(SHIRT_COLORS), pants: r.pick(PANTS_COLORS), hairStyle: r.int(0, 2) };
  }

  // ---------------------------------------------------------------- arrivals
  private trySpawn() {
    const s = this.state, L = this.level;
    const queued = this.queueParties().length;
    const active = s.parties.filter((p) => p.state !== 'leaving').length;
    const relaxMul = s.relaxed ? RELAXED.arrival : 1;
    // tutorial: satu tamu saja sampai satu putaran selesai
    if (this.tutorialActive() && (s.parties.length > 0 || s.stats.happy > 0)) { s.nextArrival = s.t + 1; return; }
    if (queued >= DINING.queue.length || active >= L.tables + 1) { s.nextArrival = s.t + 2; return; }
    const size = this.rng.int(1, L.maxParty);
    const p: Party = { id: this.id(), state: 'arriving', guests: [], table: -1, queueIdx: queued, patience: 1, patienceFull: 1, stateSince: s.t, mood: 'ok' };
    for (let gi = 0; gi < size; gi++) {
      const g: Guest = {
        id: this.id(), look: this.randomLook(), seat: -1, dish: null, dishState: 'none', eatStart: 0, eatEnd: 0, quality: 0, react: null, reactUntil: 0,
        move: this.walk(DINING.door.spawn, this.queueSpot(queued, gi), GUEST_SPEED, gi * 0.35),
      };
      p.guests.push(g);
    }
    s.parties.push(p);
    s.nextArrival = s.t + this.rng.range(L.arrival[0], L.arrival[1]) * relaxMul;
    this.emit({ e: 'arrive', party: p.id });
  }

  // ---------------------------------------------------------------- waiter
  /** Pelayan mengetuk tujuan. Mengembalikan true bila Pelayan mulai berjalan. */
  waiterTap(target: Target): boolean {
    const s = this.state, w = s.waiter;
    if (s.ended) return false;
    let dest: P2 | null = null;
    if (target.k === 'pass') dest = DINING.pass.stand;
    else if (target.k === 'party') {
      const p = this.party(target.id);
      if (!p) return false;
      if (p.table >= 0) return this.waiterTap({ k: 'table', id: p.table });
      if (p.state !== 'waitSeat' && p.state !== 'arriving' && p.state !== 'withWaiter') return false;
      if (w.carry && !(w.carry.k === 'party' && w.carry.party === p.id)) { this.emit({ e: 'noop', target }); return false; }
      const g = moveAt(p.guests[0].move, s.t);
      dest = [g.x - 0.75, g.z + 0.35];
    } else {
      const tb = this.table(target.id);
      if (!tb) return false;
      if (w.carry?.k === 'party') {
        if (tb.party !== null || tb.dirty > 0) { this.emit({ e: 'noop', target }); return false; }
        this.seatParty(w.carry.party, tb);
        w.carry = null;
      }
      dest = tableStand(tb);
    }
    const from = this.waiterPos();
    w.move = this.walk(from, dest, WAITER_SPEED);
    w.goal = target;
    w.arriveAt = moveEnd(w.move);
    this.emit({ e: 'walk', target });
    return true;
  }

  private seatParty(partyId: number, tb: TableS) {
    const p = this.party(partyId);
    if (!p) return;
    tb.party = p.id;
    p.table = tb.id;
    this.setState(p, 'toTable');
    p.guests.forEach((g, gi) => {
      const s = moveAt(g.move, this.state.t);
      g.seat = gi;
      g.move = this.walk([s.x, s.z], chairPos(tb, gi), GUEST_SPEED, 0.3 + gi * 0.3);
    });
    this.reflowQueue();
    this.emit({ e: 'seated', party: p.id, table: tb.id });
  }

  private arrive(target: Target) {
    const s = this.state, w = s.waiter;
    if (target.k === 'pass') {
      const c = w.carry;
      if (c?.k === 'order') {
        for (const menu of c.items) {
          const tk: Ticket = { id: this.id(), party: c.party, table: c.table, menu, step: 0, quality: 1, created: s.t, state: 'cooking' };
          s.tickets.push(tk);
          this.emit({ e: 'ticket', ticket: tk.id, menu, table: c.table });
        }
        this.emit({ e: 'dropOrder', n: c.items.length });
        w.carry = null;
      } else if (c?.k === 'dirty') {
        s.sink += c.n;
        this.emit({ e: 'dropDirty', n: c.n });
        w.carry = null;
      } else if (!c) {
        const ready = s.pass.filter((d) => d.announced).sort((a, b) => a.readyAt - b.readyAt)[0];
        if (ready) {
          s.pass = s.pass.filter((d) => d !== ready);
          w.carry = { k: 'dish', dish: ready };
          this.emit({ e: 'pickup', dish: ready.id });
        } else this.emit({ e: 'noop', target });
      } else this.emit({ e: 'noop', target });
      return;
    }
    if (target.k === 'party') {
      const p = this.party(target.id);
      if (p && (p.state === 'waitSeat' || p.state === 'arriving') && !w.carry) {
        w.carry = { k: 'party', party: p.id };
        this.setState(p, 'withWaiter');
        this.emit({ e: 'greet', party: p.id });
      }
      return;
    }
    const tb = this.table(target.id);
    const p = tb.party !== null ? this.party(tb.party) : undefined;
    const c = w.carry;
    if (c?.k === 'dish') {
      const g = p?.guests.find((g) => g.dishState === 'waiting' && g.dish === c.dish.menu);
      if (p && g && c.dish.table === tb.id) {
        g.dishState = 'served';
        g.quality = c.dish.quality;
        g.eatStart = s.t;
        g.eatEnd = s.t + this.level.eatTime;
        g.react = 'yum'; g.reactUntil = s.t + 1.2;
        s.stats.right++;
        w.carry = null;
        this.emit({ e: 'served', table: tb.id, menu: c.dish.menu });
      } else {
        s.stats.wrong++;
        p?.guests.forEach((gg) => { gg.react = 'shake'; gg.reactUntil = s.t + 1.3; });
        this.emit({ e: 'wrong', table: tb.id });
      }
      return;
    }
    if (!c) {
      if (p && p.state === 'wantOrder') {
        const items = p.guests.map((g) => {
          const menu = this.rng.weighted(this.level.menus, (m) => MENUS[m]?.weight ?? 1);
          g.dish = menu; g.dishState = 'waiting';
          return menu;
        });
        w.carry = { k: 'order', party: p.id, table: tb.id, items };
        this.setState(p, 'waitFood', this.level.patience.food);
        this.emit({ e: 'order', party: p.id, table: tb.id });
        return;
      }
      if (!p && tb.dirty > 0) {
        w.carry = { k: 'dirty', n: tb.dirty };
        this.emit({ e: 'collect', table: tb.id, n: tb.dirty });
        tb.dirty = 0;
        return;
      }
    }
    this.emit({ e: 'noop', target });
  }

  // ---------------------------------------------------------------- kitchen (dipanggil di perangkat Koki)
  /** Selesaikan satu langkah resep tiket. quality 0..1 (salah langkah hanya menurunkan sedikit). */
  completeStep(ticketId: number, quality: number) {
    const s = this.state;
    const tk = s.tickets.find((t) => t.id === ticketId);
    if (!tk || tk.state !== 'cooking') return;
    const steps = RECIPES[tk.menu].steps.length;
    tk.quality = (tk.quality * tk.step + Math.max(0, Math.min(1, quality))) / (tk.step + 1);
    tk.step++;
    this.emit({ e: 'step', ticket: tk.id });
    if (tk.step >= steps) {
      tk.state = 'needPlate';
      this.platePending();
      if (s.tickets.includes(tk)) this.emit({ e: 'needPlate' });
    }
  }

  private platePending() {
    const s = this.state;
    for (const tk of s.tickets.filter((t) => t.state === 'needPlate')) {
      if (s.clean <= 0) return;
      s.clean--;
      const d: Dish = { id: this.id(), menu: tk.menu, table: tk.table, party: tk.party, quality: tk.quality, readyAt: s.t, announced: false };
      s.pass.push(d);
      s.tickets = s.tickets.filter((t) => t !== tk);
      this.emit({ e: 'dishReady', dish: d.id, menu: d.menu });
    }
  }

  /** Koki menekan "Bel Siap!". */
  ringBell(): boolean {
    const s = this.state;
    const fresh = s.pass.filter((d) => !d.announced);
    if (!fresh.length) return false;
    let onTime = 0;
    for (const d of fresh) { d.announced = true; if (s.t - d.readyAt <= SCORING.bellOnTime) onTime++; }
    s.stats.bells++;
    s.stats.bellsOnTime += onTime;
    this.emit({ e: 'bell', dishes: fresh.map((d) => ({ menu: d.menu, table: d.table })), onTime });
    return true;
  }

  /** Satu piring selesai dicuci. */
  washPlate(): boolean {
    const s = this.state;
    if (s.sink <= 0) return false;
    const wasTut = this.tutorialActive();
    s.sink--; s.clean++; s.stats.washed++;
    if (wasTut) { s.nextArrival = s.t + 2; this.emit({ e: 'tutorialDone' }); }
    this.emit({ e: 'washed' });
    this.platePending();
    return true;
  }

  // ---------------------------------------------------------------- loop
  tick(dt: number) {
    const s = this.state;
    if (s.ended) return;
    s.t += dt;
    // timer berhenti selama tutorial
    if (this.tutorialActive()) s.duration += dt;
    if (s.t >= s.duration) { s.ended = true; this.emit({ e: 'end' }); return; }
    if (s.t >= s.nextArrival) this.trySpawn();

    const w = s.waiter;
    if (w.goal && s.t >= w.arriveAt) { const g = w.goal; w.goal = null; this.arrive(g); }

    for (const p of [...s.parties]) this.tickParty(p, dt);
  }

  private tickParty(p: Party, dt: number) {
    const s = this.state, L = this.level;
    const allArrived = () => p.guests.every((g) => s.t >= moveEnd(g.move));
    switch (p.state) {
      case 'arriving':
        if (allArrived()) this.setState(p, 'waitSeat', L.patience.seat);
        break;
      case 'toTable':
        if (allArrived()) this.setState(p, 'reading');
        break;
      case 'reading':
        if (s.t - p.stateSince >= SCORING.readMenu) { this.setState(p, 'wantOrder', L.patience.order); this.emit({ e: 'wantOrder', party: p.id, table: p.table }); }
        break;
      case 'waitFood': {
        for (const g of p.guests) if (g.dishState === 'served' && s.t >= g.eatEnd) g.dishState = 'eaten';
        if (p.guests.every((g) => g.dishState === 'eaten')) { this.leaveHappy(p); return; }
        break;
      }
      case 'leaving':
        if (allArrived()) s.parties = s.parties.filter((x) => x !== p);
        return;
    }
    // kesabaran
    const draining = !this.tutorialActive() && (
      p.state === 'waitSeat' || p.state === 'wantOrder' ||
      (p.state === 'waitFood' && p.guests.some((g) => g.dishState === 'waiting')));
    if (draining) {
      p.patience -= dt / p.patienceFull;
      if (p.patience <= 0) this.leaveAngry(p);
    }
  }

  private sendHome(p: Party, delay = 0.6) {
    p.guests.forEach((g, gi) => {
      const st = moveAt(g.move, this.state.t);
      g.move = this.walk([st.x, st.z], DINING.door.spawn, GUEST_SPEED, delay + gi * 0.3);
    });
  }

  private leaveHappy(p: Party) {
    const s = this.state;
    const tb = this.table(p.table);
    let points = 0;
    for (const g of p.guests) points += SCORING.happyBase + Math.round(SCORING.qualityBonus * g.quality) + Math.round(SCORING.patienceBonus * Math.max(0, p.patience));
    s.stats.score += points;
    s.stats.happy += p.guests.length;
    p.mood = 'happy';
    p.guests.forEach((g) => { g.react = 'happy'; g.reactUntil = s.t + 1.6; });
    tb.party = null;
    tb.dirty += p.guests.length;
    this.setState(p, 'leaving');
    this.sendHome(p, 1.1);
    this.emit({ e: 'happy', party: p.id, table: tb.id, points });
  }

  private leaveAngry(p: Party) {
    const s = this.state, w = s.waiter;
    s.stats.score = Math.max(0, s.stats.score - SCORING.angryPenalty);
    s.stats.angry++;
    p.mood = 'angry';
    p.guests.forEach((g) => { g.react = 'sad'; g.reactUntil = s.t + 1.6; });
    if (p.table >= 0) {
      const tb = this.table(p.table);
      tb.party = null;
      tb.dirty += p.guests.filter((g) => g.dishState === 'served' || g.dishState === 'eaten').length;
    }
    // tiket & makanan untuk rombongan ini dibatalkan; piringnya kembali bersih
    s.tickets = s.tickets.filter((t) => t.party !== p.id);
    const gone = s.pass.filter((d) => d.party === p.id);
    s.pass = s.pass.filter((d) => d.party !== p.id);
    s.clean += gone.length;
    const c: Carry = w.carry;
    if (c && ((c.k === 'party' || c.k === 'order') && c.party === p.id)) w.carry = null;
    if (c?.k === 'dish' && c.dish.party === p.id) { w.carry = null; s.clean++; }
    const wasQueued = p.table < 0;
    this.setState(p, 'leaving');
    this.sendHome(p, 0.8);
    if (wasQueued) this.reflowQueue();
    this.emit({ e: 'angry', party: p.id });
  }

  // ---------------------------------------------------------------- pertanyaan untuk UI
  /** Semua piring di dunia (untuk cek konsistensi). */
  plateCount(): number {
    const s = this.state;
    let n = s.clean + s.sink + s.pass.length;
    for (const tb of s.tables) n += tb.dirty;
    for (const p of s.parties) for (const g of p.guests) if (g.dishState === 'served' || g.dishState === 'eaten') n += p.state === 'leaving' ? 0 : 1;
    const c = s.waiter.carry;
    if (c?.k === 'dish') n += 1;
    if (c?.k === 'dirty') n += c.n;
    return n;
  }
}
