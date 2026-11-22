import { Store } from './store';
import type { Preset } from '../engine/quality';
import type { Lang } from '../data/i18n';
import type { PersonLook } from '../models/person';

/** Pengaturan disimpan di perangkat (localStorage), dengan versi skema. */
export interface Settings {
  v: 1;
  lang: Lang;
  graphics: 'auto' | Preset;
  /** Hasil deteksi otomatis (GPU + uji fps). */
  detected: Preset | null;
  showFps: boolean;
  volume: number;
  muted: boolean;
  music: boolean;
  guide: boolean;
  relaxed: boolean;
  chefLook: PersonLook;
  waiterLook: PersonLook;
}

const KEY = 'kkd.settings';

export const DEFAULT_SETTINGS: Settings = {
  v: 1,
  lang: 'id',
  graphics: 'auto',
  detected: null,
  showFps: false,
  volume: 0.8,
  muted: false,
  music: true,
  guide: true,
  relaxed: false,
  chefLook: { shirt: 0xffffff, pants: 0x3b3355, skin: 0xf2c29b, hair: 0x6b4226, chefHat: true, scarf: 0xe9573f },
  waiterLook: { shirt: 0xffd45c, pants: 0x3b3355, skin: 0x8d5a3b, hair: 0x2b2340, apron: 0x1f6fd1, hairStyle: 2 },
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...s, v: 1 };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const settings = new Store<Settings>(load());
settings.sub(() => { try { localStorage.setItem(KEY, JSON.stringify(settings.get())); } catch { /* penyimpanan penuh / mode privat */ } });

export function effectivePreset(s: Settings = settings.get()): Preset {
  return s.graphics === 'auto' ? s.detected ?? 'sedang' : s.graphics;
}
