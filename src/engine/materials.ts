import * as THREE from 'three';
import type { PresetConfig } from './quality';

export interface MatOpts {
  /** roughness (default 0.78) */
  r?: number;
  /** metalness (default 0) */
  m?: number;
  /** emissive */
  e?: number;
  ei?: number;
  /** transparan */
  o?: number;
  map?: THREE.Texture | null;
  vertexColors?: boolean;
  /** jangan terkena tone mapping (untuk cahaya/penanda) */
  flat?: boolean;
}

/**
 * Pustaka material bersama: SATU material per kombinasi warna+opsi.
 * Preset rendah memakai MeshLambertMaterial yang jauh lebih murah.
 */
export class MaterialLib {
  private cache = new Map<string, THREE.Material>();
  constructor(readonly cfg: PresetConfig) {}

  get(color: number, o: MatOpts = {}): THREE.Material {
    const key = [color, o.r ?? 0.78, o.m ?? 0, o.e ?? 0, o.ei ?? 1, o.o ?? 1, o.map?.uuid ?? '', o.vertexColors ? 1 : 0, o.flat ? 1 : 0].join('|');
    let m = this.cache.get(key);
    if (m) return m;
    const transparent = (o.o ?? 1) < 1;
    if (o.flat) {
      m = new THREE.MeshBasicMaterial({ color, transparent, opacity: o.o ?? 1, map: o.map ?? null, vertexColors: !!o.vertexColors, toneMapped: false });
    } else if (this.cfg.lambert) {
      m = new THREE.MeshLambertMaterial({ color, transparent, opacity: o.o ?? 1, map: o.map ?? null, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, vertexColors: !!o.vertexColors });
    } else {
      m = new THREE.MeshStandardMaterial({
        color, roughness: o.r ?? 0.78, metalness: o.m ?? 0, transparent, opacity: o.o ?? 1,
        map: o.map ?? null, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, vertexColors: !!o.vertexColors,
      });
    }
    if (transparent) (m as THREE.Material).depthWrite = false;
    this.cache.set(key, m);
    return m;
  }

  /** Kunci "jenis" material tanpa warna (untuk penggabungan geometri dengan vertex color). */
  static bakeKey(o: MatOpts): string {
    return [o.r ?? 0.78, o.m ?? 0, o.e ?? 0, o.ei ?? 1, o.o ?? 1, o.flat ? 1 : 0].join('|');
  }

  dispose() { this.cache.forEach((m) => m.dispose()); this.cache.clear(); }
}
