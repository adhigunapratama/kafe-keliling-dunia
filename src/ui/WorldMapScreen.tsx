import { useEffect, useRef, useState } from 'preact/hooks';
import { WorldMapView, loadMap, type PinInfo } from '../scenes/worldMap';
import { addTick } from '../engine/loop';
import { audio } from '../engine/audio';
import { LEVELS } from '../data/levels';
import { COUNTRIES } from '../data/countries';
import { MENUS } from '../data/menus';
import { t } from '../data/i18n';
import { saveStore, totalStars, type Progress } from '../game/progress';
import { isLevelPlayable } from '../game/levelCheck';
import { effectivePreset } from './settings';
import { useStore } from './store';
import { Btn, Flag, FoodIcon, Icon, IconBtn, Stars } from './components';
import { reportFrame } from './fps';

/** Status pin untuk tiap level dari simpanan. */
export function pinInfos(p: Progress): PinInfo[] {
  return LEVELS.map((L) => {
    const c = COUNTRIES.find((c) => c.id === L.country)!;
    const stars = p.best[L.id] ?? 0;
    const last = L.id === LEVELS.length && stars > 0;
    const status = L.id < p.unlocked || last ? 'done' : L.id === p.unlocked ? 'current' : 'locked';
    return { code: c.flag, level: L.id, status, stars, label: t(`country.${c.id}`) } as PinInfo;
  });
}

/** Layar Peta Dunia 3D: geser & pinch, ketuk pin untuk kartu level. */
export function WorldMapScreen({ onBack, onPlay, onDecorate }: { onBack: () => void; onPlay: (level: number) => void; onDecorate?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<WorldMapView | null>(null);
  const p = useStore(saveStore);
  const [sel, setSel] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let dead = false, stop = () => {}, cleanup = () => {};
    loadMap().then((data) => {
      if (dead) return;
      const el = host.current!;
      const view = new WorldMapView(el, effectivePreset(), data);
      viewRef.current = view;
      const pins = pinInfos(saveStore.get());
      view.setPins(pins);
      const cur = pins.find((x) => x.status === 'current') ?? pins[0];
      view.centerOn(cur.code, 18);
      stop = addTick((dt) => { view.update(dt); view.render(); reportFrame('peta', dt, view); });
      // gestur: geser (1 jari), pinch (2 jari), roda tetikus, ketuk
      const pts = new Map<number, { x: number; y: number }>();
      let moved = 0, pinchD = 0, downAt = 0;
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('button, .map-card')) return;
        el.setPointerCapture(e.pointerId);
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { moved = 0; downAt = performance.now(); }
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
      };
      const onMove = (e: PointerEvent) => {
        const prev = pts.get(e.pointerId); if (!prev) return;
        const cur2 = { x: e.clientX, y: e.clientY };
        if (pts.size === 1) { view.pan(cur2.x - prev.x, cur2.y - prev.y); moved += Math.hypot(cur2.x - prev.x, cur2.y - prev.y); }
        pts.set(e.pointerId, cur2);
        if (pts.size === 2) {
          const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinchD > 0) view.zoom(pinchD / d);
          pinchD = d; moved += 20;
        }
      };
      const onUp = (e: PointerEvent) => {
        const was = pts.get(e.pointerId);
        pts.delete(e.pointerId);
        if (pts.size < 2) pinchD = 0;
        if (was && pts.size === 0 && moved < 12 && performance.now() - downAt < 600) {
          const r = el.getBoundingClientRect();
          const code = view.pick(e.clientX - r.left, e.clientY - r.top);
          if (code) {
            const info = view.pins.find((x) => x.code === code)!;
            view.selected = code; view.flyTo(code, 9); setSel(info.level); audio.play('pop');
          }
        }
      };
      const onWheel = (e: WheelEvent) => { e.preventDefault(); view.zoom(e.deltaY > 0 ? 1.1 : 0.9); };
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      el.addEventListener('wheel', onWheel, { passive: false });
      cleanup = () => { el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp); el.removeEventListener('wheel', onWheel); };
      (window as unknown as { __kkdMap: unknown }).__kkdMap = view;
    }).catch(() => setFailed(true));
    return () => { dead = true; stop(); cleanup(); viewRef.current?.dispose(); viewRef.current = null; };
  }, []);

  // simpanan berubah (mis. dipulihkan) -> perbarui pin
  useEffect(() => { viewRef.current?.setPins(pinInfos(p)); }, [p]);

  const L = sel ? LEVELS.find((l) => l.id === sel)! : null;
  const c = L ? COUNTRIES.find((x) => x.id === L.country)! : null;
  const status = L ? pinInfos(p).find((x) => x.level === L.id)!.status : null;
  const playable = L ? isLevelPlayable(L.id) && status !== 'locked' : false;

  return (
    <div class="screen map-screen">
      <div class="view-host" ref={host} />
      <div class="map-header">
        <IconBtn icon="back" label={t('common.back')} onClick={onBack} />
        <h1>{t('map.title')}</h1>
        <span class="pill pill-saved"><Icon name="check" /> {t('map.saved')}</span>
        <span class="grow" />
        <span class="pill"><Icon name="star" /> {totalStars(p)} / {LEVELS.length * 3}</span>
        <span class="pill"><Icon name="coin" /> {p.coins}</span>
        <Btn color="blue" disabled={!onDecorate} onClick={onDecorate}><Icon name="palette" /> {t('result.decorate')}</Btn>
      </div>
      {failed && <div class="net-banner err"><Icon name="sad" /> {t('family.network')}</div>}
      {L && c && (
        <div class="map-card" key={L.id}>
          <IconBtn icon="close" label={t('common.close')} class="map-card-close" onClick={() => { setSel(null); if (viewRef.current) { viewRef.current.selected = null; viewRef.current.flyTo(null, 18); } }} />
          <div class="map-card-head"><Flag code={c.flag} /><div><b>{t(`cafe.${c.id}`)}</b><small>{t('room.level', { n: L.id, country: t(`country.${c.id}`) })}</small></div></div>
          <div class="map-card-row"><small>{t('map.best')}</small><Stars n={p.best[L.id] ?? 0} /></div>
          <div class="map-card-row"><small>{t('map.menu')}</small><span class="map-menus">{L.menus.map((m) => <FoodIcon key={m} name={MENUS[m]?.icon ?? 'unknown'} />)}</span></div>
          {playable ? (
            <Btn color="red" big onClick={() => { audio.unlock(); onPlay(L.id); }}><Icon name="play" /> {(p.best[L.id] ?? 0) > 0 ? t('map.replay') : t('map.play')}</Btn>
          ) : (
            <div class="map-locked"><Icon name="lock" /> {status === 'locked' ? t('map.locked') : t('map.soon')}</div>
          )}
        </div>
      )}
    </div>
  );
}
