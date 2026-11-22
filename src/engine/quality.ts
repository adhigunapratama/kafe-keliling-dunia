/** Preset grafis. Dipilih otomatis di awal (GPU + uji fps), bisa diganti di Pengaturan. */
export type Preset = 'rendah' | 'sedang' | 'tinggi';

export interface PresetConfig {
  pixelRatio: number;
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  /** Pakai MeshLambertMaterial (lebih murah) alih-alih MeshStandardMaterial. */
  lambert: boolean;
  /** Segmen geometri bulat (dikurangi di preset rendah). */
  segScale: number;
}

export const PRESETS: Record<Preset, PresetConfig> = {
  tinggi: { pixelRatio: 2, shadows: true, shadowMapSize: 2048, antialias: true, lambert: false, segScale: 1 },
  sedang: { pixelRatio: 1.5, shadows: true, shadowMapSize: 1024, antialias: true, lambert: false, segScale: 0.8 },
  rendah: { pixelRatio: 1, shadows: false, shadowMapSize: 512, antialias: false, lambert: true, segScale: 0.6 },
};

export function presetConfig(p: Preset): PresetConfig {
  const c = PRESETS[p];
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return { ...c, pixelRatio: Math.min(c.pixelRatio, dpr) };
}

/** Tebakan awal dari nama GPU (sebelum uji fps). */
export function guessPresetFromGpu(): Preset {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'rendah';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).toLowerCase();
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (/swiftshader|llvmpipe|software|mali-4|mali-t[67]|adreno \(tm\) [34]\d\d|powervr sgx|powervr ge8/.test(name)) return 'rendah';
    if (/apple gpu|apple m\d|adreno \(tm\) (6[4-9]|7)\d\d|mali-g7[1-9]|mali-g[6-9]10|immortalis|nvidia|geforce|radeon|intel\(r\) (iris|arc)/.test(name)) return 'tinggi';
    return 'sedang';
  } catch {
    return 'sedang';
  }
}

/** Turunkan / naikkan preset berdasar fps rata-rata uji 2 detik. */
export function adjustPresetByFps(p: Preset, fps: number): Preset {
  if (fps < 34) return p === 'tinggi' ? 'sedang' : 'rendah';
  if (fps < 48 && p === 'tinggi') return 'sedang';
  return p;
}
