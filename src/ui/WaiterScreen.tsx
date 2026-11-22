import { useEffect, useRef, useState } from 'preact/hooks';
import { DiningView } from '../scenes/dining';
import { addTick } from '../engine/loop';
import { audio, vibrate } from '../engine/audio';
import { suggestWaiterTarget } from '../game/guide';
import type { CafeState } from '../game/types';
import type { WaiterLink, EmojiKind } from '../net/protocol';
import type { EmojiMsg } from '../game/session';
import { getLevel } from '../data/levels';
import { getCountry } from '../data/countries';
import { decorEffects } from '../data/decor';
import { tableLayout } from '../data/layouts';
import { MENUS } from '../data/menus';
import { TABLE_COLORS } from '../data/palette';
import { t } from '../data/i18n';
import { settings, effectivePreset } from './settings';
import { useStore, useTicker } from './store';
import { FoodIcon, Icon } from './components';
import { EmojiBar, MessageBubble, TopBar } from './hud';
import { reportFrame } from './fps';
import { tutorialHint } from '../game/tutorial';
import { say, sayHint } from '../engine/speech';
import { TutorialIcon } from './tutorialUi';

interface Banner { dishes: { menu: string; table: number }[]; at: number }

/** Layar Pelayan (Adik): cukup ketuk; hampir tanpa tulisan. */
export function WaiterScreen({ link, level, visible, onPause, decor }: { link: WaiterLink; level: number; visible: boolean; onPause: () => void; decor?: Record<string, string> }) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<DiningView | null>(null);
  const st = useStore(settings);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [msg, setMsg] = useState<EmojiMsg | null>(null);
  const visRef = useRef(visible); visRef.current = visible;
  const guideRef = useRef(st.guide); guideRef.current = st.guide;
  useTicker(5);
  const L = getLevel(level);
  const country = getCountry(L.country);

  useEffect(() => {
    const el = host.current!;
    const fx = decorEffects(decor);
    const view = new DiningView(el, effectivePreset(), country, tableLayout(L.tables), { ...st.waiterLook, apron: fx.apron ?? st.waiterLook.apron }, fx);
    view.insets = { left: 20, right: 20, top: 64, bottom: 0 };
    view.fit();
    viewRef.current = view;
    const stop = addTick((dt) => {
      if (!visRef.current) return;
      const s = link.getState();
      if (!s) return;
      const tut = tutorialHint(s);
      const tutTarget = tut?.waiter?.target ?? null;
      view.showGuide = guideRef.current || !!tutTarget;
      view.tutorialArrow = !!tutTarget && !s.waiter.goal;
      view.guideTarget = s.waiter.goal ?? tutTarget ?? suggestWaiterTarget(s);
      view.update(dt, s);
      view.render();
      reportFrame('waiter', dt, view);
    });
    const onDown = (e: PointerEvent) => {
      const s = link.getState();
      if (!s || (e.target as HTMLElement).closest('button')) return;
      const r = el.getBoundingClientRect();
      const tg = view.pick(s, e.clientX - r.left, e.clientY - r.top);
      if (tg) { link.send({ t: 'tap', target: tg }); }
    };
    el.addEventListener('pointerdown', onDown);
    const off = link.onMessage((m) => {
      if (m.t === 'emoji') { setMsg({ from: 'chef', kind: m.kind, at: performance.now() }); audio.play('msg'); return; }
      if (m.t !== 'event') return;
      const e = m.e;
      switch (e.e) {
        case 'bell': setBanner({ dishes: e.dishes, at: performance.now() }); audio.play('bell'); vibrate([60, 40, 60]); setTimeout(() => say('voice.foodReady'), 900); break;
        case 'noop': view.flashNoop(e.target); audio.play('boing'); break;
        case 'walk': audio.play('step'); break;
        case 'arrive': audio.play('ding'); break;
        case 'greet': case 'seated': audio.play('pop'); break;
        case 'order': audio.play('order'); break;
        case 'pickup': {
          audio.play('plate');
          const st = link.getState(); const c = st?.waiter.carry;
          if (st && c?.k === 'dish') say('voice.table', { color: t(`color.${st.tables[c.dish.table].color}`) });
          break;
        }
        case 'collect': case 'dropDirty': audio.play('plate'); break;
        case 'dropOrder': audio.play('whoosh'); break;
        case 'served': audio.play('happy'); break;
        case 'wrong': audio.play('boing'); break;
        case 'happy': audio.play('star'); break;
        case 'angry': audio.play('sad'); break;
      }
    });
    return () => { stop(); off(); el.removeEventListener('pointerdown', onDown); view.dispose(); viewRef.current = null; };
  }, [link]);

  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), 3500);
    return () => clearTimeout(id);
  }, [banner]);

  const s = link.getState();
  const tut = s ? tutorialHint(s) : null;
  const tutKey = tut ? tut.step + (tut.waiter?.icon ?? '') : '';
  const lastTut = useRef('');
  useEffect(() => {
    if (!tut || tutKey === lastTut.current) return;
    lastTut.current = tutKey;
    if (tut.step === 'done') say('voice.done'); else if (tut.waiter?.voice) sayHint(tut.waiter.voice);
  }, [tutKey]);
  return (
    <div class="screen waiter-screen">
      <div class="view-host" ref={host} />
      {s && <TopBar state={s} onPause={onPause} role="waiter" center={banner ? <FoodBanner banner={banner} s={s} /> : null} />}
      {s && <CarrySlot s={s} />}
      {tut && !banner && (tut.waiter || tut.step === 'done') && <TutorialIcon step={tut.step} icon={tut.waiter?.icon ?? ''} />}
      <MessageBubble msg={msg} from="kakak" />
      <div class="waiter-actions">
        <EmojiBar big kinds={['thumb', 'heart', 'help'] as EmojiKind[]} onSend={(k) => { link.send({ t: 'emoji', kind: k }); audio.play('pop'); }} />
      </div>
    </div>
  );
}

function FoodBanner({ banner, s }: { banner: Banner; s: CafeState }) {
  return (
    <div class="food-banner" key={banner.at}>
      <Icon name="bell" class="ring" />
      <b>{t('hud.foodReady')}</b>
      {banner.dishes.slice(0, 3).map((d, i) => (
        <span key={i} class="banner-dish" style={{ '--tc': TABLE_COLORS[s.tables[d.table]?.color ?? 'merah'].css } as Record<string, string>}>
          <FoodIcon name={MENUS[d.menu]?.icon ?? ''} />
        </span>
      ))}
    </div>
  );
}

/** Slot "Bawaan": barang di tangan, cincin warna meja tujuan, dan panah ke tujuan. */
function CarrySlot({ s }: { s: CafeState }) {
  const c = s.waiter.carry;
  let item = <span class="carry-empty" />;
  let color = '';
  let dest: preact.JSX.Element | null = null;
  if (c?.k === 'dish') {
    color = TABLE_COLORS[s.tables[c.dish.table].color].css;
    item = <FoodIcon name={MENUS[c.dish.menu]?.icon ?? ''} />;
    dest = <span class="carry-dest-color" style={{ background: color }} />;
  } else if (c?.k === 'order') {
    color = TABLE_COLORS[s.tables[c.table].color].css;
    item = <Icon name="note" />;
    dest = <Icon name="chefHat" class="carry-dest-icon" />;
  } else if (c?.k === 'dirty') {
    item = <span class="carry-stack"><Icon name="plateDirty" />{c.n > 1 && <b class="badge">{c.n}</b>}</span>;
    dest = <Icon name="chefHat" class="carry-dest-icon" />;
  } else if (c?.k === 'party') {
    item = <Icon name="guest" />;
    dest = <Icon name="chair" class="carry-dest-icon" />;
  }
  return (
    <div class={`carry ${c ? 'has' : ''}`} key={c ? c.k : 'none'}>
      <div class="carry-slot" style={color ? ({ '--tc': color } as Record<string, string>) : undefined}>
        <Icon name="tray" class="carry-tray" />
        <div class="carry-item">{item}</div>
      </div>
      {dest && <><Icon name="arrowRight" class="carry-arrow" />{dest}</>}
    </div>
  );
}
