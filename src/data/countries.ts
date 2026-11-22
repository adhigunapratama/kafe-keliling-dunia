/**
 * Data negara: nama (lewat kunci i18n), bendera, tema dekorasi, dan musik.
 * Menambah negara baru = menambah entri di COUNTRIES (+ teks di i18n).
 */
export type FloorPattern =
  | { kind: 'checker'; a: string; b: string; n?: number }
  | { kind: 'planks'; colors: string[] }
  | { kind: 'tiles'; base: string; line: string; n?: number };

export type DecorItem =
  /** Untaian bendera segitiga di dinding. */
  | { kind: 'bunting'; colors: number[]; wall: 'left' | 'back' }
  /** Bingkai poster di dinding (warna latar + warna gambar). */
  | { kind: 'poster'; wall: 'left' | 'back'; at: number; bg: number; fg: number; shape: 'star' | 'circle' | 'stripes' | 'tower' | 'sun' | 'wave' | 'moon' | 'batik' }
  /** Kaktus pot (Meksiko). */
  | { kind: 'cactus'; x: number; z: number; size?: number }
  /** Lampion kertas di dinding (Jepang, Tiongkok). */
  | { kind: 'lantern'; wall: 'left' | 'back'; at: number; color: number }
  /** Rumpun bambu (Jepang). */
  | { kind: 'bamboo'; x: number; z: number }
  /** Kotak bunga di bawah jendela/dinding (Prancis, Italia). */
  | { kind: 'flowerbox'; wall: 'left' | 'back'; at: number; colors: number[] }
  /** Untaian lampu bohlam berwarna di sepanjang dinding (warung Indonesia). */
  | { kind: 'stringLights'; wall: 'left' | 'back'; colors: number[] }
  /** Karpet di lantai. */
  | { kind: 'rug'; x: number; z: number; w: number; d: number; color: number; border: number }
  /** Pohon palem pot. */
  | { kind: 'palm'; x: number; z: number }
  /** Gerobak angkringan. */
  | { kind: 'cart'; x: number; z: number }
  /** Tanaman pot. */
  | { kind: 'plant'; x: number; z: number; pot: number; leaf: number; size?: number }
  /** Lampu gantung bulat. */
  | { kind: 'lamp'; x: number; z: number; color: number };

export interface RoomTheme {
  wallL: number;
  wallR: number;
  trim: number;
  floor: FloorPattern;
}

export interface MusicStyle {
  /** Interval tangga nada dalam semiton dari nada dasar. */
  scale: number[];
  /** Nada dasar MIDI. */
  root: number;
  bpm: number;
  /** Pola ketukan bass (1 = bunyi) per 8 ketukan. */
  bass: number[];
  /** Warna bunyi melodi. */
  lead: 'square' | 'triangle' | 'sine' | 'sawtooth' | 'bell';
  swing?: number;
}

export interface CountryDef {
  id: string;
  /** Kode bendera (ISO alpha-2 huruf kecil). */
  flag: string;
  /** Warna-warna bendera untuk aksen UI (CSS). */
  colors: string[];
  kitchen: RoomTheme & { counterBody: number; counterTop: number };
  dining: RoomTheme & { chair: number };
  decorKitchen: DecorItem[];
  decorDining: DecorItem[];
  music: MusicStyle;
}

const DEFAULT_KITCHEN: CountryDef['kitchen'] = {
  wallL: 0xf6e7d2, wallR: 0xeed9bb, trim: 0x9fd3cf,
  floor: { kind: 'checker', a: '#efe8da', b: '#dcd2bf' },
  counterBody: 0x3fa7a0, counterTop: 0xf3efe8,
};
const DEFAULT_DINING: CountryDef['dining'] = {
  wallL: 0xcdebd9, wallR: 0xbfe3cd, trim: 0xf3d9a6,
  floor: { kind: 'planks', colors: ['#e8c391', '#e2b983', '#ecc99a', '#ddb27b'] },
  chair: 0xd9a066,
};
const MAJOR_PENTA = [0, 2, 4, 7, 9];

function country(id: string, flag: string, colors: string[], extra: Partial<CountryDef> = {}): CountryDef {
  return {
    id, flag, colors,
    kitchen: DEFAULT_KITCHEN,
    dining: DEFAULT_DINING,
    decorKitchen: [],
    decorDining: [],
    music: { scale: MAJOR_PENTA, root: 60, bpm: 112, bass: [1, 0, 0, 1, 1, 0, 0, 0], lead: 'triangle' },
    ...extra,
  };
}

export const COUNTRIES: CountryDef[] = [
  country('amerika', 'us', ['#C9302C', '#FFFFFF', '#2C3E8C'], {
    kitchen: {
      ...DEFAULT_KITCHEN,
      wallL: 0xf8e9d6, wallR: 0xf1dcc0, trim: 0xd9534f,
      floor: { kind: 'checker', a: '#f4efe6', b: '#e05a4f', n: 8 },
      counterBody: 0x3b6fb6, counterTop: 0xf6f2ea,
    },
    dining: {
      ...DEFAULT_DINING,
      wallL: 0xd8ecf7, wallR: 0xc9e3f3, trim: 0xe9573f,
      floor: { kind: 'checker', a: '#f6f1e7', b: '#2f5ea8', n: 10 },
      chair: 0xe9573f,
    },
    decorKitchen: [
      { kind: 'bunting', colors: [0xc9302c, 0xffffff, 0x2c3e8c], wall: 'left' },
      { kind: 'plant', x: 4.3, z: 2.5, pot: 0xc9432a, leaf: 0x5baf4e },
    ],
    decorDining: [
      { kind: 'bunting', colors: [0xc9302c, 0xffffff, 0x2c3e8c], wall: 'back' },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0x2c3e8c, fg: 0xffffff, shape: 'star' },
      { kind: 'plant', x: -4.3, z: 4.2, pot: 0xc9432a, leaf: 0x5baf4e },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xffffff, leaf: 0x3f8f3a },
      { kind: 'lamp', x: -1.5, z: 0.4, color: 0xffd45c },
      { kind: 'lamp', x: 1.8, z: 0.3, color: 0xffd45c },
    ],
    music: { scale: MAJOR_PENTA, root: 60, bpm: 126, bass: [1, 0, 1, 0, 1, 0, 1, 1], lead: 'square', swing: 0.12 },
  }),
  country('italia', 'it', ['#1E9E4A', '#FFFFFF', '#D3333A'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf7ead8, wallR: 0xf0dcc2, trim: 0x2e9e5b, floor: { kind: 'checker', a: '#f6efe2', b: '#c9432a', n: 8 }, counterBody: 0x2e9e5b, counterTop: 0xf6f2ea },
    dining: { ...DEFAULT_DINING, wallL: 0xf7e1c6, wallR: 0xf2d6b5, trim: 0xc9432a, floor: { kind: 'tiles', base: '#d98c5f', line: '#c27449', n: 6 }, chair: 0x8b5a3c },
    decorKitchen: [
      { kind: 'bunting', colors: [0x1e9e4a, 0xffffff, 0xd3333a], wall: 'left' },
      { kind: 'plant', x: 4.3, z: 2.5, pot: 0xd98c5f, leaf: 0x5baf4e },
    ],
    decorDining: [
      { kind: 'bunting', colors: [0x1e9e4a, 0xffffff, 0xd3333a], wall: 'back' },
      { kind: 'flowerbox', wall: 'back', at: -1.5, colors: [0xe9573f, 0xffc233, 0xff7aa8] },
      { kind: 'flowerbox', wall: 'back', at: 1.2, colors: [0xff7aa8, 0xe9573f, 0xffffff] },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xfff2c2, fg: 0xd9452d, shape: 'circle' },
      { kind: 'plant', x: -4.3, z: 4.2, pot: 0xd98c5f, leaf: 0x4f9a43, size: 1.1 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xd98c5f, leaf: 0x5baf4e },
      { kind: 'lamp', x: -1.5, z: 0.4, color: 0xffd45c },
    ],
    music: { scale: [0, 2, 4, 5, 7, 9, 11], root: 62, bpm: 108, bass: [1, 0, 0, 1, 0, 0, 1, 0], lead: 'triangle' } }),
  country('meksiko', 'mx', ['#127A45', '#FFFFFF', '#C8313E'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xfbe3c4, wallR: 0xf6d2a6, trim: 0x2ea8a0, floor: { kind: 'tiles', base: '#e9b07a', line: '#cf8f55', n: 7 }, counterBody: 0xe9573f, counterTop: 0xf9efdc },
    dining: { ...DEFAULT_DINING, wallL: 0xffd9a0, wallR: 0xffc98a, trim: 0x2ea8a0, floor: { kind: 'tiles', base: '#e6a774', line: '#c9824c', n: 6 }, chair: 0x2ea8a0 },
    decorKitchen: [
      { kind: 'bunting', colors: [0xff7aa8, 0xffc233, 0x2ea8a0, 0x7e5bd6, 0xe9573f], wall: 'left' },
      { kind: 'cactus', x: 4.3, z: 2.5 },
    ],
    decorDining: [
      { kind: 'bunting', colors: [0xff7aa8, 0xffc233, 0x2ea8a0, 0x7e5bd6, 0xe9573f], wall: 'back' },
      { kind: 'bunting', colors: [0xe9573f, 0x7e5bd6, 0xffc233, 0x2ea8a0, 0xff7aa8], wall: 'left' },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0x2ea8a0, fg: 0xffc233, shape: 'sun' },
      { kind: 'cactus', x: -4.3, z: 4.2, size: 1.1 },
      { kind: 'cactus', x: 4.3, z: 4.3 },
      { kind: 'lamp', x: 1.8, z: 0.3, color: 0xffc233 },
    ],
    music: { scale: [0, 2, 4, 5, 7, 9, 11], root: 64, bpm: 132, bass: [1, 0, 1, 1, 0, 1, 1, 0], lead: 'square' } }),
  country('prancis', 'fr', ['#2350A0', '#FFFFFF', '#E0393E'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf3f0fa, wallR: 0xe9e4f4, trim: 0x2350a0, floor: { kind: 'checker', a: '#ffffff', b: '#2b2340', n: 8 }, counterBody: 0x7aa2d6, counterTop: 0xffffff },
    dining: { ...DEFAULT_DINING, wallL: 0xdfe8f7, wallR: 0xd2def3, trim: 0xe0393e, floor: { kind: 'planks', colors: ['#c99a6b', '#bf8f60', '#d1a575', '#b98a5b'] }, chair: 0x2350a0 },
    decorKitchen: [
      { kind: 'bunting', colors: [0x2350a0, 0xffffff, 0xe0393e], wall: 'left' },
      { kind: 'plant', x: 4.3, z: 2.5, pot: 0xffffff, leaf: 0x5baf4e },
    ],
    decorDining: [
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xbfe3f5, fg: 0x5a5370, shape: 'tower' },
      { kind: 'poster', wall: 'left', at: -0.2, bg: 0xffe0e6, fg: 0xe0393e, shape: 'stripes' },
      { kind: 'flowerbox', wall: 'back', at: -1.5, colors: [0xff7aa8, 0xffffff, 0xa98be8] },
      { kind: 'flowerbox', wall: 'back', at: 1.2, colors: [0xa98be8, 0xff7aa8, 0xffffff] },
      { kind: 'plant', x: -4.3, z: 4.2, pot: 0xffffff, leaf: 0x3f8f3a },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0x2350a0, leaf: 0x5baf4e },
      { kind: 'lamp', x: -1.5, z: 0.4, color: 0xffe6a8 },
    ],
    music: { scale: [0, 2, 3, 5, 7, 8, 10], root: 62, bpm: 100, bass: [1, 0, 0, 1, 0, 0, 0, 0], lead: 'triangle', swing: 0.2 } }),
  country('jepang', 'jp', ['#C8102E', '#FFFFFF'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf4ecdc, wallR: 0xeee2cc, trim: 0x8b5a3c, floor: { kind: 'planks', colors: ['#d9c08f', '#d1b683', '#e0c897', '#ccb07d'] }, counterBody: 0x8b5a3c, counterTop: 0xf6f0e2 },
    dining: { ...DEFAULT_DINING, wallL: 0xf6efe0, wallR: 0xf0e6d2, trim: 0x8b5a3c, floor: { kind: 'tiles', base: '#cfd9a6', line: '#a9b97c', n: 5 }, chair: 0x8b5a3c },
    decorKitchen: [
      { kind: 'lantern', wall: 'left', at: -2.6, color: 0xc8102e },
      { kind: 'lantern', wall: 'left', at: 0.6, color: 0xc8102e },
      { kind: 'bamboo', x: 4.3, z: 2.5 },
    ],
    decorDining: [
      { kind: 'lantern', wall: 'back', at: -3.2, color: 0xc8102e },
      { kind: 'lantern', wall: 'back', at: -0.2, color: 0xffffff },
      { kind: 'lantern', wall: 'back', at: 2.4, color: 0xc8102e },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xffffff, fg: 0xc8102e, shape: 'sun' },
      { kind: 'poster', wall: 'left', at: -0.2, bg: 0xdff3fb, fg: 0x2f7dc1, shape: 'wave' },
      { kind: 'bamboo', x: -4.3, z: 4.2 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0x5a5370, leaf: 0xff9ec0 },
    ],
    music: { scale: [0, 1, 5, 7, 8], root: 62, bpm: 96, bass: [1, 0, 0, 0, 1, 0, 0, 0], lead: 'sine' } }),
  country('argentina', 'ar', ['#74ACDF', '#FFFFFF', '#F6B40E'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xeef6fc, wallR: 0xe2eef8, trim: 0x74acdf, floor: { kind: 'checker', a: '#ffffff', b: '#74acdf', n: 8 }, counterBody: 0x74acdf, counterTop: 0xffffff },
    dining: { ...DEFAULT_DINING, wallL: 0xe7f2fb, wallR: 0xd9eaf7, trim: 0xf6b40e, floor: { kind: 'planks', colors: ['#b98a5b', '#a97c50', '#c49465', '#ae8155'] }, chair: 0x8b5a3c },
    decorKitchen: [{ kind: 'bunting', colors: [0x74acdf, 0xffffff, 0x74acdf, 0xf6b40e], wall: 'left' }, { kind: 'plant', x: 4.3, z: 2.5, pot: 0x8b5a3c, leaf: 0x5baf4e }],
    decorDining: [
      { kind: 'bunting', colors: [0x74acdf, 0xffffff, 0x74acdf, 0xf6b40e], wall: 'back' },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0x74acdf, fg: 0xf6b40e, shape: 'sun' },
      { kind: 'rug', x: 0.3, z: 0.6, w: 3.2, d: 2.2, color: 0xd9a066, border: 0x74acdf },
      { kind: 'plant', x: -4.3, z: 4.2, pot: 0x8b5a3c, leaf: 0x4f9a43 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xffffff, leaf: 0x5baf4e },
      { kind: 'lamp', x: -1.5, z: 0.4, color: 0xffd45c },
    ],
    music: { scale: [0, 2, 3, 5, 7, 8, 11], root: 57, bpm: 116, bass: [1, 0, 0, 1, 0, 0, 1, 0], lead: 'triangle' } }),
  country('australia', 'au', ['#1F3A8A', '#FFFFFF', '#C8102E'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xfbefdc, wallR: 0xf5e2c4, trim: 0x2f7dc1, floor: { kind: 'planks', colors: ['#e2c08f', '#d9b583', '#e8c897', '#d1ac78'] }, counterBody: 0x2ea8a0, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xfde6c8, wallR: 0xf9d9b0, trim: 0x2f7dc1, floor: { kind: 'planks', colors: ['#e6c592', '#dcb985', '#ecce9c', '#d4b07c'] }, chair: 0x2ea8a0 },
    decorKitchen: [{ kind: 'bunting', colors: [0x1f3a8a, 0xffffff, 0xc8102e], wall: 'left' }, { kind: 'palm', x: 4.3, z: 2.5 }],
    decorDining: [
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xbfe6f7, fg: 0x2f7dc1, shape: 'wave' },
      { kind: 'poster', wall: 'left', at: -0.2, bg: 0xffe07a, fg: 0xe07b12, shape: 'sun' },
      { kind: 'flowerbox', wall: 'back', at: -1.5, colors: [0xe9573f, 0xffc233, 0xffffff] },
      { kind: 'palm', x: -4.3, z: 4.2 },
      { kind: 'palm', x: 4.3, z: 4.3 },
      { kind: 'lamp', x: 1.8, z: 0.3, color: 0xffd45c },
    ],
    music: { scale: MAJOR_PENTA, root: 60, bpm: 120, bass: [1, 0, 1, 0, 1, 0, 1, 0], lead: 'square' } }),
  country('turki', 'tr', ['#E30A17', '#FFFFFF'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xfbe9dc, wallR: 0xf5dccb, trim: 0x1f9e9a, floor: { kind: 'tiles', base: '#7fcfcf', line: '#4fb3b3', n: 8 }, counterBody: 0xc9432a, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xf9dccb, wallR: 0xf3cdb8, trim: 0x1f9e9a, floor: { kind: 'tiles', base: '#e9c49a', line: '#cfa575', n: 6 }, chair: 0x8b3a1e },
    decorKitchen: [{ kind: 'lantern', wall: 'left', at: -2.6, color: 0x1f9e9a }, { kind: 'lantern', wall: 'left', at: 0.6, color: 0xe30a17 }, { kind: 'plant', x: 4.3, z: 2.5, pot: 0x1f9e9a, leaf: 0x5baf4e }],
    decorDining: [
      { kind: 'rug', x: 0.2, z: 0.6, w: 3.6, d: 2.6, color: 0xc9432a, border: 0x1f9e9a },
      { kind: 'lantern', wall: 'back', at: -3.2, color: 0x1f9e9a },
      { kind: 'lantern', wall: 'back', at: -0.2, color: 0xffc233 },
      { kind: 'lantern', wall: 'back', at: 2.4, color: 0xe30a17 },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xe30a17, fg: 0xffffff, shape: 'moon' },
      { kind: 'plant', x: -4.3, z: 4.2, pot: 0x1f9e9a, leaf: 0x4f9a43 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xc9432a, leaf: 0x5baf4e },
    ],
    music: { scale: [0, 1, 4, 5, 7, 8, 10], root: 62, bpm: 110, bass: [1, 0, 0, 1, 0, 1, 0, 0], lead: 'triangle' } }),
  country('korea', 'kr', ['#CD2E3A', '#0047A0', '#FFFFFF'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf7f3ea, wallR: 0xefe9dc, trim: 0x0047a0, floor: { kind: 'planks', colors: ['#d9c08f', '#cfb582', '#e2c99a', '#c9ad7a'] }, counterBody: 0xcd2e3a, counterTop: 0xffffff },
    dining: { ...DEFAULT_DINING, wallL: 0xf8f4ec, wallR: 0xf0eadc, trim: 0x0047a0, floor: { kind: 'planks', colors: ['#c99a6b', '#bf9060', '#d1a575', '#b98a5b'] }, chair: 0x8b5a3c },
    decorKitchen: [{ kind: 'lantern', wall: 'left', at: -2.6, color: 0xcd2e3a }, { kind: 'lantern', wall: 'left', at: 0.6, color: 0x0047a0 }, { kind: 'bamboo', x: 4.3, z: 2.5 }],
    decorDining: [
      { kind: 'lantern', wall: 'back', at: -3.2, color: 0xcd2e3a },
      { kind: 'lantern', wall: 'back', at: -0.2, color: 0x0047a0 },
      { kind: 'lantern', wall: 'back', at: 2.4, color: 0xcd2e3a },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xffffff, fg: 0xcd2e3a, shape: 'circle' },
      { kind: 'bamboo', x: -4.3, z: 4.2 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0x0047a0, leaf: 0xff9ec0 },
    ],
    music: { scale: [0, 2, 5, 7, 9], root: 62, bpm: 118, bass: [1, 0, 0, 1, 1, 0, 0, 0], lead: 'sine' } }),
  country('arab-saudi', 'sa', ['#006C35', '#FFFFFF'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf8ead0, wallR: 0xf2ddb9, trim: 0x006c35, floor: { kind: 'tiles', base: '#efdcb5', line: '#d8bf8e', n: 7 }, counterBody: 0x006c35, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xf6e3c2, wallR: 0xefd5aa, trim: 0x006c35, floor: { kind: 'tiles', base: '#e9d2a6', line: '#cdb07c', n: 6 }, chair: 0x8b5a3c },
    decorKitchen: [{ kind: 'lantern', wall: 'left', at: -2.6, color: 0xffc233 }, { kind: 'palm', x: 4.3, z: 2.5 }],
    decorDining: [
      { kind: 'rug', x: 0.2, z: 0.6, w: 3.6, d: 2.6, color: 0x8b3a1e, border: 0xffc233 },
      { kind: 'lantern', wall: 'back', at: -3.2, color: 0xffc233 },
      { kind: 'lantern', wall: 'back', at: 2.4, color: 0xffc233 },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0x006c35, fg: 0xffffff, shape: 'moon' },
      { kind: 'palm', x: -4.3, z: 4.2 },
      { kind: 'palm', x: 4.3, z: 4.3 },
    ],
    music: { scale: [0, 1, 4, 5, 7, 8, 11], root: 60, bpm: 104, bass: [1, 0, 1, 0, 0, 1, 0, 0], lead: 'triangle' } }),
  country('tiongkok', 'cn', ['#DE2910', '#FFDE00'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xfbefe0, wallR: 0xf5e2cc, trim: 0xde2910, floor: { kind: 'tiles', base: '#e9d7b5', line: '#c9a875', n: 6 }, counterBody: 0xde2910, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xfbe8d2, wallR: 0xf5dcc0, trim: 0xde2910, floor: { kind: 'planks', colors: ['#a96b45', '#9c613d', '#b3754d', '#955a38'] }, chair: 0x8b1e1e },
    decorKitchen: [{ kind: 'lantern', wall: 'left', at: -2.6, color: 0xde2910 }, { kind: 'lantern', wall: 'left', at: 0.6, color: 0xde2910 }, { kind: 'bamboo', x: 4.3, z: 2.5 }],
    decorDining: [
      { kind: 'lantern', wall: 'back', at: -3.2, color: 0xde2910 },
      { kind: 'lantern', wall: 'back', at: -1.6, color: 0xffde00 },
      { kind: 'lantern', wall: 'back', at: -0.2, color: 0xde2910 },
      { kind: 'lantern', wall: 'back', at: 2.4, color: 0xde2910 },
      { kind: 'lantern', wall: 'left', at: 0.4, color: 0xde2910 },
      { kind: 'poster', wall: 'left', at: 1.6, bg: 0xde2910, fg: 0xffde00, shape: 'circle' },
      { kind: 'bamboo', x: -4.3, z: 4.2 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xde2910, leaf: 0x5baf4e },
    ],
    music: { scale: [0, 2, 4, 7, 9], root: 65, bpm: 112, bass: [1, 0, 0, 1, 0, 0, 1, 0], lead: 'sine' } }),
  country('nigeria', 'ng', ['#008751', '#FFFFFF'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf3f8ee, wallR: 0xe6f1dc, trim: 0x008751, floor: { kind: 'checker', a: '#ffffff', b: '#7fc79d', n: 8 }, counterBody: 0x008751, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xfde2c0, wallR: 0xf9d3a2, trim: 0x008751, floor: { kind: 'planks', colors: ['#c98b5b', '#bd8051', '#d29665', '#b6784c'] }, chair: 0x008751 },
    decorKitchen: [{ kind: 'bunting', colors: [0x008751, 0xffffff], wall: 'left' }, { kind: 'palm', x: 4.3, z: 2.5 }],
    decorDining: [
      { kind: 'bunting', colors: [0x008751, 0xffffff, 0xffc233], wall: 'back' },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xffc233, fg: 0xe07b12, shape: 'sun' },
      { kind: 'poster', wall: 'left', at: -0.2, bg: 0x008751, fg: 0xffffff, shape: 'stripes' },
      { kind: 'palm', x: -4.3, z: 4.2 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xe07b12, leaf: 0x5baf4e },
      { kind: 'lamp', x: 1.8, z: 0.3, color: 0xffc233 },
    ],
    music: { scale: [0, 2, 4, 7, 9], root: 60, bpm: 124, bass: [1, 0, 1, 1, 0, 1, 0, 1], lead: 'square' } }),
  country('thailand', 'th', ['#A51931', '#F4F5F8', '#2D2A4A'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf7ecd9, wallR: 0xf0dfc2, trim: 0x2d2a4a, floor: { kind: 'planks', colors: ['#b98a5b', '#ad7f52', '#c39466', '#a87a4e'] }, counterBody: 0xa51931, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xf5e6cc, wallR: 0xefdab8, trim: 0xa51931, floor: { kind: 'tiles', base: '#e7d0a8', line: '#c9ac7b', n: 6 }, chair: 0x8b5a3c },
    decorKitchen: [{ kind: 'lantern', wall: 'left', at: -2.6, color: 0xffc233 }, { kind: 'palm', x: 4.3, z: 2.5 }],
    decorDining: [
      { kind: 'flowerbox', wall: 'back', at: -1.5, colors: [0xa98be8, 0xff7aa8, 0xffffff] },
      { kind: 'flowerbox', wall: 'back', at: 1.2, colors: [0xff7aa8, 0xa98be8, 0xffc233] },
      { kind: 'lantern', wall: 'back', at: -3.2, color: 0xffc233 },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0x2d2a4a, fg: 0xffc233, shape: 'circle' },
      { kind: 'palm', x: -4.3, z: 4.2 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0xa51931, leaf: 0xff9ec0 },
    ],
    music: { scale: [0, 2, 4, 7, 9], root: 64, bpm: 122, bass: [1, 0, 0, 1, 0, 1, 0, 0], lead: 'sine' } }),
  country('india', 'in', ['#FF9933', '#FFFFFF', '#138808'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xfde8d0, wallR: 0xf9d9b5, trim: 0x138808, floor: { kind: 'tiles', base: '#f7c9a0', line: '#e0a677', n: 7 }, counterBody: 0xff9933, counterTop: 0xfff8ee },
    dining: { ...DEFAULT_DINING, wallL: 0xfdd5e0, wallR: 0xf9c4d4, trim: 0xff9933, floor: { kind: 'tiles', base: '#f3c79a', line: '#d9a36d', n: 6 }, chair: 0x138808 },
    decorKitchen: [{ kind: 'bunting', colors: [0xff9933, 0xffffff, 0x138808], wall: 'left' }, { kind: 'plant', x: 4.3, z: 2.5, pot: 0xff9933, leaf: 0x5baf4e }],
    decorDining: [
      { kind: 'bunting', colors: [0xff9933, 0xffffff, 0x138808, 0xff7aa8], wall: 'back' },
      { kind: 'rug', x: 0.2, z: 0.6, w: 3.6, d: 2.6, color: 0xc2185b, border: 0xffc233 },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xffffff, fg: 0x000080, shape: 'sun' },
      { kind: 'plant', x: -4.3, z: 4.2, pot: 0xff9933, leaf: 0x4f9a43 },
      { kind: 'plant', x: 4.3, z: 4.3, pot: 0x138808, leaf: 0xff7aa8 },
      { kind: 'lamp', x: -1.5, z: 0.4, color: 0xffc233 },
      { kind: 'lamp', x: 1.8, z: 0.3, color: 0xff9933 },
    ],
    music: { scale: [0, 1, 4, 5, 7, 8, 11], root: 62, bpm: 128, bass: [1, 0, 1, 0, 1, 1, 0, 1], lead: 'sawtooth' } }),
  country('indonesia', 'id', ['#E2231A', '#FFFFFF'], {
    kitchen: { ...DEFAULT_KITCHEN, wallL: 0xf4e3c4, wallR: 0xeed6ad, trim: 0x8b5a3c, floor: { kind: 'planks', colors: ['#b98a5b', '#a97c50', '#c49465', '#9e7349'] }, counterBody: 0x8b5a3c, counterTop: 0xfff3dc },
    dining: { ...DEFAULT_DINING, wallL: 0xf6e0b8, wallR: 0xf0d4a2, trim: 0xe2231a, floor: { kind: 'planks', colors: ['#a8784d', '#9b6c44', '#b38255', '#93663f'] }, chair: 0x8b5a3c },
    decorKitchen: [
      { kind: 'stringLights', wall: 'left', colors: [0xffc233, 0xe2231a, 0xffffff, 0x5bd06f] },
      { kind: 'bunting', colors: [0xe2231a, 0xffffff], wall: 'left' },
      { kind: 'bamboo', x: 4.3, z: 2.5 },
    ],
    decorDining: [
      { kind: 'stringLights', wall: 'back', colors: [0xffc233, 0xe2231a, 0xffffff, 0x5bd06f, 0x5b9bf0] },
      { kind: 'stringLights', wall: 'left', colors: [0xffc233, 0xe2231a, 0xffffff, 0x5bd06f] },
      { kind: 'bunting', colors: [0xe2231a, 0xffffff], wall: 'back' },
      { kind: 'poster', wall: 'left', at: 1.4, bg: 0xe8b04a, fg: 0x5a3a22, shape: 'batik' },
      { kind: 'cart', x: -4.0, z: 4.0 },
      { kind: 'palm', x: 4.3, z: 4.3 },
      { kind: 'rug', x: 0.2, z: 0.6, w: 3.6, d: 2.6, color: 0xd9a066, border: 0xe2231a },
    ],
    music: { scale: [0, 2, 5, 7, 9], root: 62, bpm: 124, bass: [1, 0, 1, 0, 1, 0, 1, 1], lead: 'bell', swing: 0.08 } }),
];

export function getCountry(id: string): CountryDef {
  const c = COUNTRIES.find((c) => c.id === id);
  if (!c) throw new Error(`Negara tidak dikenal: ${id}`);
  return c;
}
