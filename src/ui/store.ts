import { useEffect, useState } from 'preact/hooks';

/** Store kecil dengan langganan (tanpa library state). */
export class Store<T> {
  private l = new Set<() => void>();
  constructor(private v: T) {}
  get() { return this.v; }
  set(v: T) { this.v = v; this.l.forEach((f) => f()); }
  update(p: Partial<T>) { this.set({ ...this.v, ...p }); }
  sub(f: () => void) { this.l.add(f); return () => { this.l.delete(f); }; }
}

export function useStore<T>(s: Store<T>): T {
  const [, force] = useState(0);
  useEffect(() => s.sub(() => force((x) => x + 1)), [s]);
  return s.get();
}

/** Re-render berkala (untuk bar kesabaran, timer). */
export function useTicker(hz: number) {
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force((x) => x + 1), 1000 / hz); return () => clearInterval(id); }, [hz]);
}
