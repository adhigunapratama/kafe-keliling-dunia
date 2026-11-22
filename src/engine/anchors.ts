/**
 * Elemen DOM yang menempel pada titik 3D (gelembung tamu, label stasiun).
 * Diperbarui tiap frame lewat transform (murah); isi HTML hanya ditulis ulang bila berubah.
 */
interface Item { el: HTMLDivElement; html: string; cls: string; seen: boolean; style: string }

export class AnchorLayer {
  private items = new Map<string, Item>();
  constructor(private root: HTMLElement) {}

  begin() { this.items.forEach((i) => (i.seen = false)); }

  /** Tampilkan / perbarui elemen `key` di piksel (x, y). `style` = CSS custom properties tambahan. */
  put(key: string, x: number, y: number, html: string, cls: string, style = ''): HTMLDivElement {
    let it = this.items.get(key);
    if (!it) {
      const el = document.createElement('div');
      it = { el, html: '', cls: '', seen: true, style: '' };
      this.items.set(key, it);
      this.root.appendChild(el);
    }
    it.seen = true;
    if (it.html !== html) { it.el.innerHTML = html; it.html = html; }
    if (it.cls !== cls) { it.el.className = 'anchor ' + cls; it.cls = cls; }
    if (it.style !== style) { it.el.style.cssText = style; it.style = style; }
    it.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    return it.el;
  }

  /** Hapus elemen yang tidak dipakai di frame ini. */
  end() {
    for (const [k, it] of this.items) if (!it.seen) { it.el.remove(); this.items.delete(k); }
  }

  clear() { this.items.forEach((i) => i.el.remove()); this.items.clear(); }
}
