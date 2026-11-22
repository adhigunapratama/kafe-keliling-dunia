import { useEffect } from 'preact/hooks';
import { DECOR, type DecorDef } from '../data/decor';
import { audio } from '../engine/audio';
import { t } from '../data/i18n';
import type { ShopPicks, ShopRole } from '../game/shop';
import { Btn, Icon, IconBtn, Svg } from './components';

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** Gambar kecil tiap dekorasi (SVG, dari warna barang). */
export function decorIcon(d: DecorDef): string {
  const c = hex(d.color), ink = '#2B2340';
  const body: Record<DecorDef['slot'], string> = {
    lantai: `<rect x="6" y="10" width="36" height="28" rx="4" fill="${c}" stroke="${ink}" stroke-width="3"/><path d="M6 24h36M18 10v28M30 10v28" stroke="#fff" stroke-width="2" opacity=".7"/>`,
    meja: `<ellipse cx="24" cy="34" rx="18" ry="6" fill="#EFE8DA" stroke="${ink}" stroke-width="3"/>${d.tableTop === 'vase' ? `<path d="M20 34v-10h8v10" fill="#fff" stroke="${ink}" stroke-width="2.5"/><circle cx="20" cy="18" r="4" fill="${c}" stroke="${ink}" stroke-width="2"/><circle cx="28" cy="17" r="4" fill="#FFC233" stroke="${ink}" stroke-width="2"/>` : d.tableTop === 'candle' ? `<rect x="21" y="18" width="6" height="16" rx="2" fill="#FFF8EE" stroke="${ink}" stroke-width="2.5"/><path d="M24 8c4 4 3 8 0 9-3-1-4-5 0-9z" fill="${c}" stroke="${ink}" stroke-width="2"/>` : `<path d="M22 34V10" stroke="${ink}" stroke-width="3"/><path d="M22 11h14l-4 5 4 5H22z" fill="${c}" stroke="${ink}" stroke-width="2.5"/>`}`,
    lampu: `<path d="M4 12q20 14 40 0" stroke="${ink}" stroke-width="2.5" fill="none"/>${[10, 18, 26, 34, 40].map((x, i) => `<circle cx="${x}" cy="${16 + Math.sin(i) * 2 + (i === 2 ? 3 : 0)}" r="4" fill="${['#FFC233', '#FF7AA8', '#5BD06F', '#5B9BF0', c][i]}" stroke="${ink}" stroke-width="2"/>`).join('')}<rect x="14" y="26" width="20" height="16" rx="8" fill="${c}" stroke="${ink}" stroke-width="3" opacity="${d.id === 'lampu-lampion' ? 1 : 0}"/>`,
    tanaman: `<path d="M16 30h16l-2 12H18z" fill="#D98C5F" stroke="${ink}" stroke-width="3"/><circle cx="24" cy="20" r="10" fill="${d.id === 'tanaman-bunga' ? '#5BAF4E' : c}" stroke="${ink}" stroke-width="3"/>${d.id === 'tanaman-bunga' ? `<circle cx="19" cy="17" r="3" fill="${c}"/><circle cx="28" cy="16" r="3" fill="#FFC233"/><circle cx="24" cy="24" r="3" fill="#fff"/>` : ''}`,
    celemek: `<path d="M16 8h16v6l6 6v20c0 2-2 4-4 4H14c-2 0-4-2-4-4V20l6-6z" fill="${c}" stroke="${ink}" stroke-width="3"/><path d="M18 26h12v8H18z" fill="#fff" opacity=".6" stroke="${ink}" stroke-width="2"/>`,
    syal: `<ellipse cx="24" cy="20" rx="14" ry="7" fill="none" stroke="${c}" stroke-width="7"/><ellipse cx="24" cy="20" rx="14" ry="7" fill="none" stroke="${ink}" stroke-width="2"/><path d="M30 25l4 16-6-2-2-12" fill="${c}" stroke="${ink}" stroke-width="2.5"/>`,
  };
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body[d.slot]}</svg>`;
}

export interface ShopView { coins: number; owned: string[]; placed: Record<string, string> }

/**
 * Toko Hias Kafe. Setiap kartu punya tombol pilih Kakak (topi koki merah) & Adik (nampan biru).
 * Barang terbeli bila keduanya memilih barang yang sama. `me` = peran di perangkat ini
 * ('both' = satu perangkat, keduanya mengetuk di layar yang sama).
 */
export function DecorShop({ view, picks, me, onPick, onPlace, onClose, bought }: {
  view: ShopView; picks: ShopPicks; me: ShopRole | 'both';
  onPick: (role: ShopRole, id: string) => void; onPlace: (id: string) => void; onClose?: () => void; bought?: string | null;
}) {
  const showText = me !== 'waiter';
  useEffect(() => { if (bought) { audio.play('coin'); setTimeout(() => audio.play('star'), 250); } }, [bought]);
  return (
    <div class="shop-back">
      <div class="shop">
        <header class="shop-head">
          <Icon name="palette" />
          <h2>{t('result.decorate')}</h2>
          <span class="pill"><Icon name="coin" /> {view.coins}</span>
          <span class="grow" />
          {onClose && <IconBtn icon="close" label={t('common.close')} onClick={onClose} />}
        </header>
        <p class="shop-hint"><span class="pick-dot chef"><Icon name="chefHat" /></span><span>+</span><span class="pick-dot waiter"><Icon name="tray" /></span>{showText && <span>{t('shop.hint')}</span>}</p>
        <div class="shop-grid">
          {DECOR.map((d) => {
            const owned = view.owned.includes(d.id);
            const placed = view.placed[d.slot] === d.id;
            const afford = view.coins >= d.price;
            const pc = picks.chef === d.id, pw = picks.waiter === d.id;
            return (
              <div key={d.id} class={`shop-card ${owned ? 'owned' : ''} ${placed ? 'placed' : ''} ${pc || pw ? 'picked' : ''} ${bought === d.id ? 'bought' : ''} ${!owned && !afford ? 'poor' : ''}`}>
                <Svg html={decorIcon(d)} class="shop-pic" />
                {showText && <b class="shop-name">{t(`decor.${d.id}`)}</b>}
                {owned ? (
                  <Btn class={`shop-place ${placed ? 'on' : ''}`} color={placed ? 'green' : 'white'} onClick={() => onPlace(d.id)} aria-label={t(placed ? 'shop.placed' : 'shop.place')}>
                    {placed ? <Icon name="check" /> : <Icon name="palette" />}{showText && <span>{t(placed ? 'shop.placed' : 'shop.place')}</span>}
                  </Btn>
                ) : (
                  <>
                    <span class="shop-price"><Icon name="coin" />{d.price}</span>
                    <div class="shop-picks">
                      <button class={`pick-btn chef ${pc ? 'on' : ''}`} disabled={me === 'waiter' || !afford} aria-label="Kakak" onClick={() => onPick('chef', d.id)}><Icon name="chefHat" /></button>
                      <button class={`pick-btn waiter ${pw ? 'on' : ''}`} disabled={me === 'chef' || !afford} aria-label="Adik" onClick={() => onPick('waiter', d.id)}><Icon name="tray" /></button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
