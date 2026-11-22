import { FpsMeter } from '../engine/fps';
import { Store } from './store';
import type { View3D } from '../engine/view';

/** Data penghitung fps (dibaca komponen FpsCounter). */
export const fpsStore = new Store<{ fps: number; calls: number; tris: number; who: string; dpr: number }>({ fps: 0, calls: 0, tris: 0, who: '', dpr: 1 });
const meters = new Map<string, FpsMeter>();

export function reportFrame(who: string, dt: number, view?: View3D) {
  let m = meters.get(who);
  if (!m) { m = new FpsMeter(); meters.set(who, m); }
  if (m.sample(dt)) {
    const info = view?.info() ?? { calls: 0, triangles: 0 };
    fpsStore.set({ fps: Math.round(m.fps), calls: info.calls, tris: info.triangles, who, dpr: view?.dpr ?? 1 });
  }
}
