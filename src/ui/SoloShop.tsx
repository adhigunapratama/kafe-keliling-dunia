import { useState } from 'preact/hooks';
import { saveStore, saveProgress } from '../game/progress';
import { NO_PICKS, shopPick, togglePlace, type ShopPicks } from '../game/shop';
import { useStore } from './store';
import { DecorShop } from './DecorShop';

/** Hias Kafe di satu perangkat: Kakak & Adik mengetuk tombol masing-masing di layar yang sama. */
export function SoloShop({ onClose }: { onClose: () => void }) {
  const p = useStore(saveStore);
  const [picks, setPicks] = useState<ShopPicks>({ ...NO_PICKS });
  const [bought, setBought] = useState<string | null>(null);
  return (
    <DecorShop view={{ coins: p.coins, owned: p.decor.owned, placed: p.decor.placed }} picks={picks} me="both" bought={bought} onClose={onClose}
      onPick={(role, id) => { const r = shopPick(saveStore.get(), picks, role, id); if (r.bought) saveProgress(r.save); setPicks(r.picks); setBought(r.bought); }}
      onPlace={(id) => { saveProgress(togglePlace(saveStore.get(), id)); setBought(null); }} />
  );
}
