import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/data/levels';
import { MENUS } from '../src/data/menus';
import { RECIPES, stationsForMenus } from '../src/data/recipes';
import { INGREDIENTS } from '../src/data/ingredients';
import { COUNTRIES, getCountry } from '../src/data/countries';
import { FLAG_CODES } from '../src/data/flags';
import { STATION_IDS } from '../src/data/stations';
import { TABLE_COLOR_ORDER } from '../src/data/palette';
import { DINING, tableLayout } from '../src/data/layouts';
import { id } from '../src/data/i18n/id';
import { en } from '../src/data/i18n/en';
import { hasKey } from '../src/data/i18n';
import { MINIGAMES } from '../src/minigames';
import { FOOD_ICONS } from '../src/ui/icons';
import { isLevelPlayable } from '../src/game/levelCheck';
import { buildDiningNav, chairPos, decorObstacles, tableStand } from '../src/game/sim';
import { placeStations } from '../src/scenes/kitchen';
import { hasProceduralModel } from '../src/models/food';

describe('data konten', () => {
  it('ada 15 level, Indonesia terakhir dan final', () => {
    expect(LEVELS).toHaveLength(15);
    expect(LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(LEVELS[14].country).toBe('indonesia');
    expect(LEVELS[14].final).toBe(true);
    expect(LEVELS[0].tutorial).toBe(true);
  });

  it('angka level masuk akal', () => {
    for (const L of LEVELS) {
      expect(L.tables).toBeGreaterThanOrEqual(2);
      expect(L.tables).toBeLessThanOrEqual(5);
      expect(L.stars[0]).toBeLessThan(L.stars[1]);
      expect(L.stars[1]).toBeLessThan(L.stars[2]);
      expect(L.duration).toBeGreaterThanOrEqual(170);
      expect(L.duration).toBeLessThanOrEqual(250);
      expect(L.arrival[0]).toBeLessThanOrEqual(L.arrival[1]);
      expect(() => getCountry(L.country)).not.toThrow();
    }
  });

  it('level 1 bisa dimainkan', () => expect(isLevelPlayable(1)).toBe(true));

  it('setiap menu punya resep, ikon, model, dan teks ID/EN', () => {
    for (const m of Object.values(MENUS)) {
      expect(RECIPES[m.id], m.id).toBeDefined();
      expect(FOOD_ICONS[m.icon], m.icon).toBeDefined();
      expect(hasProceduralModel(m.model), m.model).toBe(true);
      expect(hasKey(`menu.${m.id}`), m.id).toBe(true);
    }
  });

  it('setiap langkah resep memakai mini-game, stasiun, dan bahan yang ada', () => {
    for (const r of Object.values(RECIPES)) {
      expect(r.steps.length).toBeGreaterThan(0);
      for (const s of r.steps) {
        expect(MINIGAMES[s.type], s.type).toBeTypeOf('function');
        expect(STATION_IDS).toContain(s.station);
        const ings = s.type === 'seret-bahan' ? [s.base, ...s.items, ...(s.distractors ?? [])] : [s.ingredient];
        for (const i of ings) {
          expect(INGREDIENTS[i], i).toBeDefined();
          expect(FOOD_ICONS[INGREDIENTS[i].icon], INGREDIENTS[i].icon).toBeDefined();
          expect(hasKey(`ing.${i}`), i).toBe(true);
        }
      }
    }
  });

  it('setiap bahan punya ikon (dan ikon tabur bila ada)', () => {
    for (const ing of Object.values(INGREDIENTS)) {
      expect(FOOD_ICONS[ing.icon], ing.id).toBeDefined();
      if (ing.topIcon) expect(FOOD_ICONS[ing.topIcon], ing.topIcon).toBeDefined();
    }
  });

  it('level 1–5 bisa dimainkan', () => { for (let i = 1; i <= 5; i++) expect(isLevelPlayable(i), `level ${i}`).toBe(true); });

  it('teks EN lengkap (kunci sama dengan ID) dan tidak kosong', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort());
    for (const [k, v] of Object.entries(en)) expect(v.length, k).toBeGreaterThan(0);
  });

  it('setiap negara, stasiun, dan warna meja punya teks; setiap negara punya bendera', () => {
    for (const c of COUNTRIES) { expect(hasKey(`country.${c.id}`), c.id).toBe(true); expect(FLAG_CODES).toContain(c.flag); }
    for (const s of STATION_IDS) expect(hasKey(`station.${s}`), s).toBe(true);
    for (const c of TABLE_COLOR_ORDER) expect(hasKey(`color.${c}`), c).toBe(true);
  });

  it('stasiun dapur level yang bisa dimainkan muat di slot dapur', () => {
    for (const L of LEVELS.filter((l) => isLevelPlayable(l.id))) {
      const placed = placeStations(stationsForMenus(L.menus));
      expect(placed.some((p) => p.id === 'wastafel')).toBe(true);
      expect(placed.some((p) => p.id === 'saji')).toBe(true);
    }
  });

  it('semua kursi, meja, jendela saji, dan antrean bisa dijangkau dari pintu (2–5 meja)', () => {
    for (const n of [2, 3, 4, 5]) {
      const tables = tableLayout(n);
      for (const c of COUNTRIES) {
        const nav = buildDiningNav(tables, decorObstacles(c.decorDining));
        const targets = [DINING.pass.stand, ...DINING.queue, ...tables.flatMap((t) => [tableStand(t), chairPos(t, 0), chairPos(t, 1)])];
        for (const tg of targets) {
          nav.findPath(DINING.door.spawn, tg);
          expect(nav.lastOk, `${c.id} ${n} meja -> ${tg}`).toBe(true);
          nav.findPath(DINING.pass.stand, tg);
          expect(nav.lastOk, `${c.id} ${n} meja dari jendela saji -> ${tg}`).toBe(true);
        }
      }
    }
  });
});
