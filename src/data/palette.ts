/** Palet warna UI & 3D. Semua warna game diambil dari sini. */
export const UI = {
  ink: '#2B2340',
  sky: '#BDE7F5',
  chefRed: '#C9432A',
  chefRedShadow: '#8F2E1D',
  waiterBlue: '#1F6FD1',
  waiterBlueShadow: '#134B91',
  yellow: '#FFC233',
  yellowShadow: '#C98F00',
  successGreen: '#146C43',
  successBg: '#DDF5E8',
  panel: '#FFFFFF',
  panelGrey: '#F3F0FA',
  textSecondary: '#5A5370',
} as const;

/** Warna meja (taplak & daun meja). Urutan dipakai saat meja ditambahkan. */
export const TABLE_COLORS = {
  merah: { top: 0xef6b57, cloth: 0xc9432a, css: '#C9432A', light: '#F7C9BF' },
  biru: { top: 0x5b9bf0, cloth: 0x1f6fd1, css: '#1F6FD1', light: '#C4DBF7' },
  kuning: { top: 0xffd45c, cloth: 0xe0a800, css: '#E0A800', light: '#FFEDB3' },
  hijau: { top: 0x6fd08c, cloth: 0x2e9e5b, css: '#2E9E5B', light: '#C8EED5' },
  ungu: { top: 0xa98be8, cloth: 0x7e5bd6, css: '#7E5BD6', light: '#DCD0F7' },
} as const;
export type TableColor = keyof typeof TABLE_COLORS;
export const TABLE_COLOR_ORDER: TableColor[] = ['merah', 'biru', 'kuning', 'hijau', 'ungu'];

/** Palet tokoh (tamu diacak dari sini). */
export const SKIN_TONES = [0xf2c29b, 0xe8b48a, 0xc68a5e, 0x8d5a3b, 0x6b4128, 0xf6d3b5];
export const HAIR_COLORS = [0x2b2340, 0x6b4226, 0xe0a800, 0xb0b6c3, 0x8b3a1e, 0x3b2a1e, 0xd96c3b];
export const SHIRT_COLORS = [0x7e5bd6, 0xe07b12, 0xe9573f, 0x22a06b, 0x5b9bf0, 0xff7aa8, 0x3fa7a0, 0xffd45c];
export const PANTS_COLORS = [0x3b3355, 0x2f4f7a, 0x5a4636, 0x4a4a5a];
