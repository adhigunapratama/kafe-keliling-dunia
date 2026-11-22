/** RNG deterministik kecil (mulberry32) supaya simulasi bisa diulang dan dites. */
export class Rng {
  constructor(public state: number) {}
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number { return a + (b - a) * this.next(); }
  int(a: number, b: number): number { return Math.floor(this.range(a, b + 1)); }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  weighted<T>(items: readonly T[], weight: (x: T) => number): T {
    const total = items.reduce((s, x) => s + weight(x), 0);
    let r = this.next() * total;
    for (const x of items) { r -= weight(x); if (r <= 0) return x; }
    return items[items.length - 1];
  }
}
