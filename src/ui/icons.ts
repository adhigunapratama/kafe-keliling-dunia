/**
 * Ikon SVG buatan sendiri, garis tebal (tanpa emoji sistem).
 * Semua mengembalikan string markup supaya bisa dipakai di Preact maupun DOM langsung.
 */
const INK = '#2B2340';

const wrap = (body: string, vb = '0 0 48 48') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  pause: wrap('<rect x="12" y="10" width="8" height="28" rx="3" fill="#fff"/><rect x="28" y="10" width="8" height="28" rx="3" fill="#fff"/>'),
  play: wrap('<path d="M15 10l24 14-24 14z" fill="#fff"/>'),
  gear: wrap('<circle cx="24" cy="24" r="7" fill="#fff"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M9.9 38.1l5-5M33.1 14.9l5-5"/>'),
  sound: wrap('<path d="M8 19h8l10-8v26l-10-8H8z" fill="#fff"/><path d="M32 17c3 4 3 10 0 14M37 12c6 7 6 17 0 24"/>'),
  soundOff: wrap('<path d="M8 19h8l10-8v26l-10-8H8z" fill="#fff"/><path d="M33 18l10 12M43 18L33 30"/>'),
  star: wrap('<path d="M24 5l5.6 12 13 1.5-9.7 8.8 2.7 12.9L24 33.6 12.4 40.2l2.7-12.9-9.7-8.8 13-1.5z" fill="#FFC233"/>'),
  starEmpty: wrap('<path d="M24 5l5.6 12 13 1.5-9.7 8.8 2.7 12.9L24 33.6 12.4 40.2l2.7-12.9-9.7-8.8 13-1.5z" fill="#E6E1F2" stroke="#B9B2CC"/>'),
  bell: wrap('<path d="M10 34c0-12 4-20 14-20s14 8 14 20z" fill="#FFC233"/><path d="M6 34h36" /><circle cx="24" cy="10" r="3" fill="#FFC233"/><path d="M20 40h8"/>'),
  thumb: wrap('<path d="M8 22h7v18H8z" fill="#fff"/><path d="M15 22l7-12c2-3 6-2 6 2v7h10c3 0 5 3 4 5l-4 13c-1 2-2 3-4 3H15z" fill="#FFD9B0"/>'),
  heart: wrap('<path d="M24 41S7 30.5 7 18.5C7 12.6 11.4 9 16 9c3.6 0 6.4 2 8 5 1.6-3 4.4-5 8-5 4.6 0 9 3.6 9 9.5C41 30.5 24 41 24 41z" fill="#F0506E"/>'),
  bolt: wrap('<path d="M27 4L10 27h12l-3 17 19-25H26z" fill="#FFC233"/>'),
  help: wrap('<path d="M16 26V12c0-2 3-2 3 0v10M19 22V9c0-2 3-2 3 0v13M22 22V10c0-2 3-2 3 0v12M25 22v-9c0-2 3-2 3 0v15c0 0 2-4 5-5 2-1 4 1 3 3l-6 11c-2 3-4 5-8 5h-2c-5 0-8-4-8-9v-6c0-2 3-2 3 0" fill="#FFD9B0"/><path d="M38 6l3-3M42 12h4M34 4V0" stroke-width="3"/>'),
  check: wrap('<path d="M10 25l9 9 19-20" stroke-width="6"/>'),
  close: wrap('<path d="M13 13l22 22M35 13L13 35" stroke-width="6"/>'),
  back: wrap('<path d="M29 10L15 24l14 14" stroke-width="6"/>'),
  arrowRight: wrap('<path d="M8 24h30M26 12l12 12-12 12" stroke-width="6"/>'),
  backspace: wrap('<path d="M16 10h24v28H16L4 24z" fill="#fff"/><path d="M22 18l12 12M34 18L22 30"/>'),
  chair: wrap('<path d="M14 6h20v18H14z" fill="#D9A066"/><path d="M10 24h28v6H10z" fill="#D9A066"/><path d="M13 30v12M35 30v12"/>'),
  book: wrap('<path d="M6 10c6-2 12-2 18 2 6-4 12-4 18-2v28c-6-2-12-2-18 2-6-4-12-4-18-2z" fill="#fff"/><path d="M24 12v28"/><path d="M11 18h7M11 24h7M30 18h7M30 24h7" stroke-width="3"/>'),
  sparkle: wrap('<path d="M24 4l4 14 14 6-14 4-4 16-4-16-14-4 14-6z" fill="#FFF3B0"/><path d="M39 5l1.5 4 4 1.5-4 1.5L39 16l-1.5-4-4-1.5 4-1.5z" fill="#FFF3B0" stroke-width="2.5"/>'),
  sad: wrap('<circle cx="24" cy="24" r="18" fill="#C9D3E6"/><circle cx="18" cy="21" r="2" fill="#2B2340"/><circle cx="30" cy="21" r="2" fill="#2B2340"/><path d="M17 33c4-4 10-4 14 0"/>'),
  happy: wrap('<circle cx="24" cy="24" r="18" fill="#FFE07A"/><circle cx="18" cy="21" r="2" fill="#2B2340"/><circle cx="30" cy="21" r="2" fill="#2B2340"/><path d="M16 28c4 6 12 6 16 0"/>'),
  lock: wrap('<rect x="10" y="22" width="28" height="20" rx="4" fill="#fff"/><path d="M16 22v-6a8 8 0 0 1 16 0v6"/>'),
  coin: wrap('<circle cx="24" cy="24" r="17" fill="#FFC233"/><circle cx="24" cy="24" r="10" stroke="#C98F00"/>'),
  replay: wrap('<path d="M38 24a14 14 0 1 1-4-10"/><path d="M36 6v9h-9" stroke-width="5"/>'),
  home: wrap('<path d="M7 22L24 8l17 14" /><path d="M12 19v20h24V19" fill="#fff"/>'),
  palette: wrap('<path d="M24 6C13 6 6 14 6 23c0 9 7 16 14 16 3 0 3-3 2-5s0-4 3-4h5c6 0 12-4 12-11 0-8-8-13-18-13z" fill="#fff"/><circle cx="15" cy="21" r="3" fill="#C9432A" stroke="none"/><circle cx="22" cy="14" r="3" fill="#FFC233" stroke="none"/><circle cx="31" cy="15" r="3" fill="#1F6FD1" stroke="none"/><circle cx="35" cy="23" r="3" fill="#2E9E5B" stroke="none"/>'),
  plate: wrap('<ellipse cx="24" cy="26" rx="19" ry="11" fill="#fff"/><ellipse cx="24" cy="25" rx="11" ry="6" stroke-width="2.5" stroke="#B9B2CC"/>'),
  plateDirty: wrap('<ellipse cx="24" cy="26" rx="19" ry="11" fill="#F4F1EA"/><circle cx="18" cy="25" r="3" fill="#B08A5A" stroke="none"/><circle cx="28" cy="23" r="2.5" fill="#C9432A" stroke="none"/><circle cx="25" cy="29" r="2" fill="#7CCB6B" stroke="none"/>'),
  note: wrap('<rect x="11" y="6" width="26" height="36" rx="4" fill="#fff"/><path d="M17 16h14M17 23h14M17 30h9" stroke-width="3"/>'),
  guest: wrap('<circle cx="24" cy="17" r="10" fill="#F2C29B"/><path d="M14 15c0-6 4-10 10-10s10 4 10 10c-3-2-6-3-10-3s-7 1-10 3z" fill="#6B4226"/><path d="M9 43c0-9 7-14 15-14s15 5 15 14z" fill="#5B9BF0"/>'),
  chefHat: wrap('<path d="M14 26c-5 0-8-4-8-8s4-8 8-7c1-4 5-7 10-7s9 3 10 7c4-1 8 3 8 7s-3 8-8 8z" fill="#fff"/><path d="M14 26h20v12H14z" fill="#fff"/><path d="M14 32h20" stroke-width="3"/>'),
  tray: wrap('<path d="M10 30c0-9 6-16 14-16s14 7 14 16z" fill="#E6E9F0"/><path d="M5 32h38" stroke-width="5"/><circle cx="24" cy="11" r="3" fill="#E6E9F0"/>'),
  fps: wrap('<path d="M8 36l10-12 8 6 14-18" stroke-width="5"/>'),
} as const;
export type IconName = keyof typeof ICONS;

/** Ikon makanan & bahan (berwarna, garis tinta). */
const food = (body: string) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

export const FOOD_ICONS: Record<string, string> = {
  burger: food('<path d="M10 30c0-11 10-18 22-18s22 7 22 18z" fill="#E8A85A"/><circle cx="24" cy="21" r="1.5" fill="#FFF4D6" stroke="none"/><circle cx="34" cy="18" r="1.5" fill="#FFF4D6" stroke="none"/><circle cx="41" cy="24" r="1.5" fill="#FFF4D6" stroke="none"/><path d="M8 33c4 3 8-1 12 2s8-1 12 2 8-1 12 2 8-2 12-1v-5H8z" fill="#6FC25E"/><path d="M10 37h44l-4 6H14z" fill="#FFC233"/><rect x="9" y="41" width="46" height="7" rx="3.5" fill="#7A4326"/><path d="M11 50h42c0 4-3 6-6 6H17c-3 0-6-2-6-6z" fill="#E0A052"/>'),
  fries: food('<path d="M20 30l-3-20 5-1 3 21M28 30l-1-24 5 0v24M35 30l2-22 5 1-3 21M24 30l-4-17 4-1 4 18M38 30l4-16 4 1-4 15" fill="#FFD45C"/><path d="M14 28h36l-4 28H18z" fill="#E9573F"/><path d="M24 36c3 4 13 4 16 0" stroke="#fff" stroke-width="4"/>'),
  bunBottom: food('<path d="M8 34h48c0 9-6 14-14 14H22c-8 0-14-5-14-14z" fill="#E0A052"/>'),
  bunTop: food('<path d="M8 40c0-14 11-24 24-24s24 10 24 24z" fill="#E8A85A"/><circle cx="24" cy="28" r="2" fill="#FFF4D6" stroke="none"/><circle cx="34" cy="24" r="2" fill="#FFF4D6" stroke="none"/><circle cx="42" cy="31" r="2" fill="#FFF4D6" stroke="none"/>'),
  patty: food('<rect x="8" y="24" width="48" height="16" rx="8" fill="#7A4326"/><path d="M16 30h6M28 33h8M40 29h6" stroke="#A8673F"/>'),
  cheese: food('<path d="M8 24h48l-4 14-8-4-6 8-6-6-8 6-6-8-6 4z" fill="#FFC233"/>'),
  lettuce: food('<path d="M6 34c4-6 8 2 12-4s8 2 12-4 8 2 12-4 8 2 14-2c0 8-4 16-26 16S6 42 6 34z" fill="#6FC25E"/>'),
  tomato: food('<circle cx="32" cy="34" r="20" fill="#E9573F"/><circle cx="32" cy="34" r="12" fill="#F28B6E" stroke-width="2"/><path d="M32 22v24M20 34h24" stroke="#F7B7A3" stroke-width="2"/><path d="M26 12c3 3 9 3 12 0" fill="#3F8F3A"/>'),
  potato: food('<ellipse cx="32" cy="34" rx="22" ry="16" fill="#D9A866"/><circle cx="22" cy="30" r="1.8" fill="#8B5A2B" stroke="none"/><circle cx="36" cy="38" r="1.8" fill="#8B5A2B" stroke="none"/><circle cx="42" cy="28" r="1.8" fill="#8B5A2B" stroke="none"/>'),
  potatoSticks: food('<rect x="12" y="22" width="8" height="28" rx="3" fill="#FFE9A8" transform="rotate(-12 16 36)"/><rect x="24" y="18" width="8" height="30" rx="3" fill="#FFE9A8"/><rect x="36" y="20" width="8" height="28" rx="3" fill="#FFE9A8" transform="rotate(10 40 34)"/>'),
  ketchup: food('<path d="M24 10h16v8l4 6v30c0 3-2 4-4 4H24c-2 0-4-1-4-4V24l4-6z" fill="#E9573F"/><rect x="26" y="4" width="12" height="7" rx="2" fill="#fff"/>'),
  unknown: food('<path d="M12 44c0-12 9-22 20-22s20 10 20 22z" fill="#E6E9F0"/><path d="M6 46h52" stroke-width="5"/><circle cx="32" cy="19" r="3" fill="#E6E9F0"/>'),
};

export function icon(name: IconName): string { return ICONS[name]; }
export function foodIcon(name: string): string { return FOOD_ICONS[name] ?? FOOD_ICONS.unknown; }
