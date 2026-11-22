/** Navigasi grid sederhana (A* 8 arah + perataan garis pandang) dan gerak berbasis lintasan. */
export type P2 = [number, number];

/** Gerak = lintasan titik + waktu mulai + kecepatan. Posisi bisa dihitung di perangkat mana pun. */
export interface Move { pts: P2[]; t0: number; speed: number }

export function stillMove(p: P2, t: number): Move { return { pts: [p], t0: t, speed: 1 }; }

export function pathLength(pts: P2[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
export function moveEnd(m: Move): number { return m.t0 + pathLength(m.pts) / m.speed; }

export interface MoveSample { x: number; z: number; /** arah hadap (radian, rotasi Y; 0 = menghadap +z) */ dir: number; moving: boolean }

export function moveAt(m: Move, t: number): MoveSample {
  const pts = m.pts;
  if (pts.length === 1) return { x: pts[0][0], z: pts[0][1], dir: NaN, moving: false };
  let s = Math.max(0, (t - m.t0) * m.speed);
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const L = Math.hypot(bx - ax, bz - az);
    const dir = Math.atan2(bx - ax, bz - az);
    if (s <= L || i === pts.length - 1) {
      const k = L > 0 ? Math.min(1, s / L) : 1;
      const moving = !(i === pts.length - 1 && s >= L);
      return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, dir, moving };
    }
    s -= L;
  }
  const last = pts[pts.length - 1];
  return { x: last[0], z: last[1], dir: NaN, moving: false };
}

export class NavGrid {
  readonly nx: number;
  readonly nz: number;
  readonly blocked: Uint8Array;
  /** Apakah pencarian terakhir menemukan jalur (false = jalan lurus darurat). */
  lastOk = true;
  constructor(readonly minX: number, readonly minZ: number, readonly maxX: number, readonly maxZ: number, readonly cell: number) {
    this.nx = Math.round((maxX - minX) / cell);
    this.nz = Math.round((maxZ - minZ) / cell);
    this.blocked = new Uint8Array(this.nx * this.nz);
  }
  cx(i: number) { return this.minX + (i + 0.5) * this.cell; }
  cz(j: number) { return this.minZ + (j + 0.5) * this.cell; }
  toCell(x: number, z: number): [number, number] {
    return [
      Math.min(this.nx - 1, Math.max(0, Math.floor((x - this.minX) / this.cell))),
      Math.min(this.nz - 1, Math.max(0, Math.floor((z - this.minZ) / this.cell))),
    ];
  }
  isBlocked(i: number, j: number) { return i < 0 || j < 0 || i >= this.nx || j >= this.nz || this.blocked[j * this.nx + i] === 1; }
  blockCircle(x: number, z: number, r: number) {
    for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++)
      if (Math.hypot(this.cx(i) - x, this.cz(j) - z) < r) this.blocked[j * this.nx + i] = 1;
  }
  blockRect(x0: number, z0: number, x1: number, z1: number) {
    for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++) {
      const x = this.cx(i), z = this.cz(j);
      if (x >= x0 && x <= x1 && z >= z0 && z <= z1) this.blocked[j * this.nx + i] = 1;
    }
  }
  private nearestFree(i: number, j: number): [number, number] {
    if (!this.isBlocked(i, j)) return [i, j];
    for (let r = 1; r < Math.max(this.nx, this.nz); r++) {
      let best: [number, number] | null = null, bd = Infinity;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (!this.isBlocked(i + di, j + dj)) { const d = di * di + dj * dj; if (d < bd) { bd = d; best = [i + di, j + dj]; } }
      }
      if (best) return best;
    }
    return [i, j];
  }
  /** Garis lurus antar dua titik tidak menabrak sel terhalang? */
  lineFree(a: P2, b: P2): boolean {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d / (this.cell * 0.4)));
    for (let k = 0; k <= n; k++) {
      const x = a[0] + ((b[0] - a[0]) * k) / n, z = a[1] + ((b[1] - a[1]) * k) / n;
      const [i, j] = this.toCell(x, z);
      if (this.isBlocked(i, j)) return false;
    }
    return true;
  }
  /** Cari lintasan dari a ke b. Titik awal/akhir di dalam penghalang tetap diizinkan (mis. kursi). */
  findPath(a: P2, b: P2): P2[] {
    const [si, sj] = this.nearestFree(...this.toCell(a[0], a[1]));
    const [ti, tj] = this.nearestFree(...this.toCell(b[0], b[1]));
    const N = this.nx * this.nz;
    const g = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const open: number[] = [];
    const f = new Float32Array(N).fill(Infinity);
    const start = sj * this.nx + si, goal = tj * this.nx + ti;
    g[start] = 0; f[start] = Math.hypot(ti - si, tj - sj); open.push(start);
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
      const cur = open[bi]; open.splice(bi, 1);
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const ci = cur % this.nx, cj = (cur / this.nx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj;
        if (this.isBlocked(ni, nj)) continue;
        if (di && dj && (this.isBlocked(ci + di, cj) || this.isBlocked(ci, cj + dj))) continue;
        const n = nj * this.nx + ni;
        if (closed[n]) continue;
        const ng = g[cur] + (di && dj ? Math.SQRT2 : 1);
        if (ng < g[n]) { g[n] = ng; came[n] = cur; f[n] = ng + Math.hypot(ti - ni, tj - nj); open.push(n); }
      }
    }
    const cells: P2[] = [];
    if (came[goal] === -1 && goal !== start) {
      // tidak terjangkau: jalan lurus saja (jarang terjadi; tata letak dites otomatis)
      this.lastOk = false;
      return [a, b];
    }
    this.lastOk = true;
    for (let c = goal; c !== -1; c = came[c]) { cells.push([this.cx(c % this.nx), this.cz((c / this.nx) | 0)]); if (c === start) break; }
    cells.reverse();
    const raw: P2[] = [a, ...cells.slice(1, -1), b];
    if (cells.length >= 2) { raw.splice(1, 0, cells[0]); raw.splice(raw.length - 1, 0, cells[cells.length - 1]); }
    return this.smooth(raw);
  }
  private smooth(pts: P2[]): P2[] {
    if (pts.length <= 2) return pts;
    const out: P2[] = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.lineFree(pts[i], pts[j])) j--;
      out.push(pts[j]);
      i = j;
    }
    // buang titik yang terlalu rapat
    return out.filter((p, k) => k === 0 || k === out.length - 1 || Math.hypot(p[0] - out[k - 1][0], p[1] - out[k - 1][1]) > 0.05);
  }
}
