import { describe, expect, it } from 'vitest';
import { DECOR, DECOR_SLOTS, decorEffects, getDecor } from '../src/data/decor';
import { shopPick, togglePlace, NO_PICKS } from '../src/game/shop';
import { migrate } from '../src/game/progress';
import { hasKey } from '../src/data/i18n';
import { COUNTRIES } from '../src/data/countries';
import { DINING, tableLayout } from '../src/data/layouts';
import { buildDiningNav, chairPos, decorObstacles, tableStand } from '../src/game/sim';

const rich = () => ({ ...migrate({ coins: 500 }) });

describe('Hias Kafe', () => {
  it('barang baru terbeli HANYA bila kedua anak memilih barang yang sama', () => {
    let p = rich();
    let r = shopPick(p, NO_PICKS, 'chef', 'meja-bunga');
    expect(r.bought).toBeNull();
    r = shopPick(r.save, r.picks, 'waiter', 'lampu-untai');
    expect(r.bought).toBeNull();
    expect(r.save.coins).toBe(500);
    r = shopPick(r.save, r.picks, 'waiter', 'meja-bunga');
    expect(r.bought).toBe('meja-bunga');
    expect(r.save.coins).toBe(500 - getDecor('meja-bunga')!.price);
    expect(r.save.decor.owned).toContain('meja-bunga');
    expect(r.save.decor.placed.meja).toBe('meja-bunga');
    expect(r.picks).toEqual(NO_PICKS);
    p = r.save;
    // ketuk lagi = batal memilih
    r = shopPick(p, NO_PICKS, 'chef', 'syal-emas');
    r = shopPick(r.save, r.picks, 'chef', 'syal-emas');
    expect(r.picks.chef).toBeNull();
  });

  it('koin kurang atau sudah punya -> tidak terbeli', () => {
    const poor = migrate({ coins: 10 });
    let r = shopPick(poor, { chef: 'lantai-pelangi', waiter: null }, 'waiter', 'lantai-pelangi');
    expect(r.bought).toBeNull();
    const own = migrate({ coins: 500, decor: { owned: ['syal-biru'], placed: {} } });
    r = shopPick(own, { chef: 'syal-biru', waiter: null }, 'waiter', 'syal-biru');
    expect(r.bought).toBeNull();
  });

  it('pasang/lepas: satu barang per slot', () => {
    let p = migrate({ coins: 0, decor: { owned: ['lantai-kayu', 'lantai-laut'], placed: {} } });
    p = togglePlace(p, 'lantai-kayu');
    expect(p.decor.placed.lantai).toBe('lantai-kayu');
    p = togglePlace(p, 'lantai-laut');
    expect(p.decor.placed.lantai).toBe('lantai-laut');
    p = togglePlace(p, 'lantai-laut');
    expect(p.decor.placed.lantai).toBeUndefined();
    expect(togglePlace(p, 'syal-emas')).toBe(p); // belum dimiliki
  });

  it('setiap dekorasi punya slot valid, harga, dan teks; efek tergabung', () => {
    for (const d of DECOR) { expect(DECOR_SLOTS).toContain(d.slot); expect(d.price).toBeGreaterThan(0); expect(hasKey(`decor.${d.id}`), d.id).toBe(true); }
    const fx = decorEffects({ lantai: 'lantai-laut', meja: 'meja-lilin', celemek: 'celemek-hijau', syal: 'syal-emas', lampu: 'lampu-untai' });
    expect(fx.floor?.kind).toBe('tiles');
    expect(fx.tableTop).toBe('candle');
    expect(fx.apron).toBe(0x2e9e5b);
    expect(fx.dining.length).toBeGreaterThan(0);
  });

  it('dengan SEMUA dekorasi terpasang, kursi & meja tetap bisa dijangkau (semua negara, 2–5 meja)', () => {
    const allFx = DECOR_SLOTS.flatMap((slot) => DECOR.filter((d) => d.slot === slot).map((d) => decorEffects({ [slot]: d.id }).dining)).flat();
    for (const n of [2, 3, 4, 5]) {
      const tables = tableLayout(n);
      for (const c of COUNTRIES) {
        const nav = buildDiningNav(tables, decorObstacles([...c.decorDining, ...allFx]));
        for (const tg of [DINING.pass.stand, ...DINING.queue, ...tables.flatMap((t) => [tableStand(t), chairPos(t, 0), chairPos(t, 1)])]) {
          nav.findPath(DINING.door.spawn, tg);
          expect(nav.lastOk, `${c.id} ${n} meja -> ${tg}`).toBe(true);
        }
      }
    }
  });
});
