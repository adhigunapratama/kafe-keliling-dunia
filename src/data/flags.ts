/**
 * Bendera sederhana (SVG 3:2) untuk UI. Digambar sendiri, disederhanakan
 * supaya terbaca di ukuran kecil. Kunci = kode negara (ISO 3166-1 alpha-2, huruf kecil).
 */
const W = 30, H = 20;
const rect = (x: number, y: number, w: number, h: number, c: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const vert = (a: string, b: string, c: string) => rect(0, 0, 10, H, a) + rect(10, 0, 10, H, b) + rect(20, 0, 10, H, c);
const horiz = (a: string, b: string, c: string) => rect(0, 0, W, 7, a) + rect(0, 7, W, 6, b) + rect(0, 13, W, 7, c);
const star = (cx: number, cy: number, r: number, c: string) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`;
  }
  return `<path d="${d}Z" fill="${c}"/>`;
};

const FLAGS: Record<string, string> = {
  us: (() => {
    let s = '';
    for (let i = 0; i < 7; i++) s += rect(0, (i * H) / 7, W, H / 7 + 0.05, i % 2 ? '#FFFFFF' : '#C9302C');
    s += rect(0, 0, 13, 10.8, '#2C3E8C');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += `<circle cx="${2 + c * 3}" cy="${2 + r * 3.4}" r="0.8" fill="#fff"/>`;
    return s;
  })(),
  it: vert('#1E9E4A', '#FFFFFF', '#D3333A'),
  mx: vert('#127A45', '#FFFFFF', '#C8313E') + `<circle cx="15" cy="10" r="2.6" fill="#8B5A2B"/><circle cx="15" cy="10" r="1.4" fill="#4C8C3A"/>`,
  fr: vert('#2350A0', '#FFFFFF', '#E0393E'),
  jp: rect(0, 0, W, H, '#FFFFFF') + `<circle cx="15" cy="10" r="5.6" fill="#C8102E"/>`,
  ar: horiz('#74ACDF', '#FFFFFF', '#74ACDF') + `<circle cx="15" cy="10" r="2.2" fill="#F6B40E"/>`,
  au: rect(0, 0, W, H, '#1F3A8A') + rect(0, 0, 14, 10, '#1F3A8A') +
    `<path d="M0 0L14 10M14 0L0 10" stroke="#fff" stroke-width="2.2"/><path d="M0 0L14 10M14 0L0 10" stroke="#C8102E" stroke-width="0.9"/>` +
    rect(5.5, 0, 3, 10, '#fff') + rect(0, 3.5, 14, 3, '#fff') + rect(6.3, 0, 1.4, 10, '#C8102E') + rect(0, 4.3, 14, 1.4, '#C8102E') +
    star(7, 15, 2.2, '#fff') + star(22, 5, 1.3, '#fff') + star(25.5, 10, 1.3, '#fff') + star(22, 16, 1.3, '#fff') + star(19, 9.5, 1.3, '#fff'),
  tr: rect(0, 0, W, H, '#E30A17') + `<circle cx="12" cy="10" r="5" fill="#fff"/><circle cx="13.3" cy="10" r="4" fill="#E30A17"/>` + star(19, 10, 2.4, '#fff'),
  kr: rect(0, 0, W, H, '#FFFFFF') +
    `<path d="M10 10a5 5 0 0 1 10 0z" fill="#CD2E3A"/><path d="M10 10a5 5 0 0 0 10 0z" fill="#0047A0"/>` +
    `<circle cx="12.5" cy="10" r="2.5" fill="#CD2E3A"/><circle cx="17.5" cy="10" r="2.5" fill="#0047A0"/>` +
    `<g fill="#2B2340"><rect x="3" y="3" width="4" height="0.9" transform="rotate(34 5 4)"/><rect x="3" y="15.5" width="4" height="0.9" transform="rotate(-34 5 16)"/><rect x="23" y="3" width="4" height="0.9" transform="rotate(-34 25 4)"/><rect x="23" y="15.5" width="4" height="0.9" transform="rotate(34 25 16)"/></g>`,
  sa: rect(0, 0, W, H, '#006C35') +
    `<path d="M8 8q2-2 4 0t4 0t4 0t3 0" stroke="#fff" stroke-width="1.2" fill="none"/>` + rect(8, 13, 14, 1.2, '#fff'),
  cn: rect(0, 0, W, H, '#DE2910') + star(6, 6, 3.4, '#FFDE00') + star(11, 2.5, 1, '#FFDE00') + star(13, 4.5, 1, '#FFDE00') + star(13, 7.5, 1, '#FFDE00') + star(11, 9.5, 1, '#FFDE00'),
  ng: vert('#008751', '#FFFFFF', '#008751'),
  th: rect(0, 0, W, H, '#A51931') + rect(0, 3.33, W, 13.34, '#F4F5F8') + rect(0, 6.67, W, 6.66, '#2D2A4A'),
  in: horiz('#FF9933', '#FFFFFF', '#138808') + `<circle cx="15" cy="10" r="2.4" fill="none" stroke="#000080" stroke-width="0.7"/><circle cx="15" cy="10" r="0.6" fill="#000080"/>`,
  id: rect(0, 0, W, 10, '#E2231A') + rect(0, 10, W, 10, '#FFFFFF'),
};

/** Mengembalikan markup SVG bendera (dengan bingkai bulat lembut). */
export function flagSvg(code: string): string {
  const body = FLAGS[code] ?? rect(0, 0, W, H, '#ccc');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><clipPath id="fc-${code}"><rect width="${W}" height="${H}" rx="3"/></clipPath><g clip-path="url(#fc-${code})">${body}</g><rect width="${W}" height="${H}" rx="3" fill="none" stroke="rgba(43,35,64,.35)" stroke-width="1"/></svg>`;
}

export const FLAG_CODES = Object.keys(FLAGS);
