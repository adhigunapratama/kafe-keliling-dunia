import { useEffect, useRef, useState } from 'preact/hooks';
import { KitchenView } from '../scenes/kitchen';
import { addTick } from '../engine/loop';
import { AnchorLayer } from '../engine/anchors';
import { audio, vibrate } from '../engine/audio';
import type { HostSession, EmojiMsg } from '../game/session';
import type { Ticket } from '../game/types';
import { RECIPES, stationsForMenus } from '../data/recipes';
import type { StationId } from '../data/stations';
import { getCountry } from '../data/countries';
import { decorEffects } from '../data/decor';
import { MENUS } from '../data/menus';
import { TABLE_COLORS } from '../data/palette';
import { t } from '../data/i18n';
import { settings, effectivePreset } from './settings';
import { useStore, useTicker } from './store';
import { Btn, FoodIcon, Icon } from './components';
import { TopBar, EmojiBar, MessageBubble } from './hud';
import { MinigameOverlay, type OpenGame } from './MinigameOverlay';
import { reportFrame } from './fps';
import { tutorialHint } from '../game/tutorial';
import { say, sayHint } from '../engine/speech';
import { TutorialCard } from './tutorialUi';

export function ChefScreen({ session, visible, onPause }: { session: HostSession; visible: boolean; onPause: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<KitchenView | null>(null);
  const st = useStore(settings);
  const [selected, setSelected] = useState<number | null>(null);
  const [game, setGame] = useState<OpenGame | null>(null);
  const [msg, setMsg] = useState<EmojiMsg | null>(null);
  const newTickets = useRef(new Map<number, number>());
  const gameRef = useRef(game); gameRef.current = game;
  const selRef = useRef(selected); selRef.current = selected;
  const visRef = useRef(visible); visRef.current = visible;
  const L = session.sim.level;
  const country = getCountry(L.country);
  useTicker(5);

  // adegan 3D
  useEffect(() => {
    const el = host.current!;
    const fx = decorEffects(session.decorPlaced);
    const view = new KitchenView(el, effectivePreset(), country, stationsForMenus(L.menus), { ...st.chefLook, scarf: fx.scarf ?? st.chefLook.scarf }, fx);
    view.insets = { left: 160, right: 10, top: 60, bottom: 0 };
    view.fit();
    viewRef.current = view;
    const labels = new AnchorLayer(view.overlay);
    let frame = 0, pausedDrawn = false;
    const stop = addTick((dt) => {
      if (!visRef.current) return;
      // hemat baterai: berhenti merender saat dijeda, dan render lebih jarang di balik mini-game
      if (session.paused) { if (pausedDrawn) return; pausedDrawn = true; } else pausedDrawn = false;
      if (gameRef.current && frame++ % 3 !== 0) return;
      const s = session.sim.state;
      view.update(dt, s);
      // stasiun aktif = langkah sekarang tiket terpilih (+ wastafel bila piring habis)
      const sel = s.tickets.find((x) => x.id === selRef.current) ?? s.tickets.find((x) => x.state === 'cooking');
      const active: StationId[] = [];
      if (sel && sel.state === 'cooking') active.push(RECIPES[sel.menu].steps[sel.step].station);
      if (s.sink > 0 && (s.clean === 0 || !sel)) active.push('wastafel');
      if (s.pass.some((d) => !d.announced)) active.push('saji');
      view.setActiveStations(gameRef.current ? [] : active);
      view.setSteam(gameRef.current?.station ?? null);
      labels.begin();
      for (const stn of view.stations) {
        const a = view.stationAnchor(stn.id);
        const [x, y] = view.project(a.x, a.y, a.z);
        let badge = '';
        if (stn.id === 'wastafel' && s.sink > 0) badge = `<b class="badge">${s.sink}</b>`;
        if (stn.id === 'saji' && s.pass.length) badge = `<b class="badge badge-yellow">${s.pass.length}</b>`;
        const tutSt = tutorialHint(s)?.chef?.station;
        const lab = labels.put('st-' + stn.id, x, y, `<span>${t(`station.${stn.id}`)}</span>${badge}`, `station-label ${active.includes(stn.id) ? 'active' : ''} ${tutSt === stn.id ? 'tut' : ''}`);
        lab.dataset.station = stn.id;
      }
      labels.end();
      view.render();
      reportFrame('chef', dt, view);
    });
    const onDown = (e: PointerEvent) => {
      if (gameRef.current) return;
      const lab = (e.target as HTMLElement).closest('[data-station]') as HTMLElement | null;
      const r = el.getBoundingClientRect();
      const id = (lab?.dataset.station as StationId | undefined) ?? view.pick(e.clientX - r.left, e.clientY - r.top);
      if (id) tapStation(id);
    };
    el.addEventListener('pointerdown', onDown);
    return () => { stop(); el.removeEventListener('pointerdown', onDown); labels.clear(); view.dispose(); viewRef.current = null; };
  }, [session]);

  // event simulasi -> suara & tanda tiket baru
  useEffect(() => {
    const off1 = session.onEvent((e) => {
      if (e.e === 'ticket') { newTickets.current.set(e.ticket, performance.now()); audio.play('order'); }
      else if (e.e === 'dishReady') audio.play('ding');
      else if (e.e === 'needPlate') audio.play('boing');
      else if (e.e === 'happy') audio.play('coin');
      else if (e.e === 'dropDirty') audio.play('plate');
    });
    const off2 = session.onEmoji((m) => { if (m.from === 'waiter') { setMsg(m); audio.play('msg'); } });
    return () => { off1(); off2(); };
  }, [session]);

  const s = session.sim.state;
  const tickets = s.tickets;
  const selTicket = tickets.find((x) => x.id === selected) ?? tickets.find((x) => x.state === 'cooking') ?? null;

  function tapStation(id: StationId) {
    const s = session.sim.state;
    const view = viewRef.current!;
    if (id === 'saji') { ringBell(); return; }
    if (id === 'wastafel') {
      view.chefGoTo('wastafel');
      if (s.sink > 0) { setGame({ kind: 'wash', station: 'wastafel' }); audio.play('pop'); }
      else { audio.play('boing'); }
      return;
    }
    const cur = s.tickets.find((x) => x.id === selRef.current && x.state === 'cooking');
    const pickFor = (tk: Ticket | undefined) => tk && RECIPES[tk.menu].steps[tk.step]?.station === id;
    let tk = pickFor(cur) ? cur : s.tickets.find((x) => x.state === 'cooking' && pickFor(x));
    view.chefGoTo(id);
    if (!tk) { audio.play('boing'); return; }
    setSelected(tk.id);
    newTickets.current.delete(tk.id);
    setGame({ kind: 'cook', ticketId: tk.id, step: tk.step, station: id });
    audio.play('pop');
  }

  function ringBell() {
    if (session.sim.ringBell()) { audio.play('bell'); vibrate(40); viewRef.current?.ringBell(); }
    else audio.play('boing');
  }

  const unannounced = s.pass.filter((d) => !d.announced).length;
  const tut = tutorialHint(s);
  const tutKey = tut ? tut.step : '';
  const lastTut = useRef('');
  useEffect(() => {
    if (!tut || tutKey === lastTut.current) return;
    lastTut.current = tutKey;
    if (tut.step === 'done') say('voice.done'); else if (tut.chef?.voice) sayHint(tut.chef.voice);
  }, [tutKey]);
  const cooking = tickets.length;
  const plateLow = s.clean <= 1 && (cooking > 0 || s.clean === 0);
  const now = performance.now();

  return (
    <div class="screen chef-screen">
      <div class="view-host" ref={host} />
      <TopBar session={session} onPause={onPause} role="chef" />
      <div class="ticket-col">
        {tickets.map((tk) => {
          const party = s.parties.find((p) => p.id === tk.party);
          const tb = s.tables[tk.table];
          const steps = RECIPES[tk.menu].steps;
          const isNew = now - (newTickets.current.get(tk.id) ?? -1e9) < 4000;
          const pat = party?.patience ?? 1;
          return (
            <button key={tk.id} class={`ticket ${tk.id === selTicket?.id ? 'sel' : ''} ${isNew ? 'new' : ''}`} style={{ '--tc': TABLE_COLORS[tb.color].css } as Record<string, string>}
              onClick={() => { audio.play('click'); setSelected(tk.id); newTickets.current.delete(tk.id); }}>
              <span class="ticket-color" />
              <FoodIcon name={MENUS[tk.menu]?.icon ?? ''} />
              <span class="ticket-body">
                <b>{t(`menu.${tk.menu}`)}</b>
                <small>{t(`color.${tb.color}`)}</small>
                <span class="steps">{steps.map((_, i) => <i key={i} class={i < tk.step ? 'done' : i === tk.step ? 'cur' : ''} />)}</span>
                {tk.state === 'needPlate' ? <span class="ticket-warn"><Icon name="plate" />{t('hud.needPlate')}</span> :
                  <span class={`pbar ${pat > 0.5 ? 'p-hi' : pat > 0.25 ? 'p-mid' : 'p-lo'}`}><span style={{ width: `${Math.max(0, pat) * 100}%` }} /></span>}
              </span>
            </button>
          );
        })}
      </div>
      <div class={`plates-card ${plateLow ? 'low' : ''}`}>
        <Icon name="plate" />
        <span><small>{t('hud.plates')}</small><b>{s.clean}/{s.totalPlates}</b></span>
        {plateLow && <em>{t('hud.platesLow')}</em>}
      </div>
      <MessageBubble msg={msg} from="adik" />
      {tut && !game && <TutorialCard step={tut.step} text={tut.step === 'done' ? t('tut.done') : tut.chef ? t(tut.chef.text, { station: tut.chef.station && tut.chef.station !== 'bell' ? t(`station.${tut.chef.station}`) : '' }) : ''} />}
      <div class="chef-actions">
        <EmojiBar kinds={['thumb', 'heart', 'bolt']} onSend={(k) => { session.chefEmoji(k); audio.play('pop'); }} />
        <Btn color="red" big class={`bell-btn ${unannounced ? 'pulse' : ''} ${tut?.chef?.station === 'bell' ? 'tut-target' : ''}`} onClick={ringBell} sound={false}>
          <Icon name="bell" /><span>{t('hud.bell')}</span>{unannounced > 0 && <b class="badge badge-yellow">{unannounced}</b>}
        </Btn>
      </div>
      {game && (
        <MinigameOverlay
          game={game}
          session={session}
          onClose={() => setGame(null)}
        />
      )}
    </div>
  );
}
