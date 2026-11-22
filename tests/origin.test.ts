import { describe, expect, it } from 'vitest';
import { originAllowed } from '../worker/src/origin';

const P = 'https://cafe-abangade.pages.dev,https://*.cafe-abangade.pages.dev,http://localhost:*,http://127.0.0.1:*';

describe('cek origin server ruangan', () => {
  it('mengizinkan produksi, semua preview branch, dan localhost', () => {
    for (const o of ['https://cafe-abangade.pages.dev', 'https://tahap-2.cafe-abangade.pages.dev', 'https://a1b2c3d4.cafe-abangade.pages.dev', 'http://localhost:5173', 'http://127.0.0.1:4173']) expect(originAllowed(o, P), o).toBe(true);
  });
  it('menolak situs lain', () => {
    for (const o of ['https://evil.pages.dev', 'https://cafe-abangade.pages.dev.evil.com', 'https://x.y.cafe-abangade.pages.dev', 'http://cafe-abangade.pages.dev', 'https://localhost:5173']) expect(originAllowed(o, P), o).toBe(false);
  });
  it('tanpa header Origin (bukan browser) diizinkan', () => expect(originAllowed(null, P)).toBe(true));
});
