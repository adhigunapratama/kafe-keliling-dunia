import { useEffect, useRef, useState } from 'preact/hooks';
import { RoomGuest } from '../net/room';
import { recallRoom, rememberRoom, roomServerUrl } from '../net/client';
import { audio } from '../engine/audio';
import { getCountry } from '../data/countries';
import { getLevel } from '../data/levels';
import { t } from '../data/i18n';
import { useStore } from './store';
import { Btn, Flag, Icon, IconBtn, Modal } from './components';
import { WaiterScreen } from './WaiterScreen';
import { ResultScreen } from './ResultScreen';
import { NetBanner, VersionModal, WaitingOverlay } from './netUi';
import { useWakeLock } from './wakeLock';

/** Alur di tablet Adik: keypad kode -> menunggu -> main -> hasil. Hampir tanpa tulisan. */
export function GuestFlow({ onExit }: { onExit: () => void }) {
  const base = roomServerUrl();
  const [guest, setGuest] = useState<RoomGuest | null>(() => {
    const mem = base ? recallRoom('guest') : null;
    return mem ? new RoomGuest(base, mem.code) : null;
  });
  const [shake, setShake] = useState(0);
  const [joined, setJoined] = useState(false);
  const [verr, setVerr] = useState(false);

  useEffect(() => { (window as unknown as { __kkdGuest: unknown }).__kkdGuest = guest; return () => guest?.close(); }, [guest]);
  useEffect(() => {
    if (!guest) return;
    return guest.net.sub(() => {
      const n = guest.net.get();
      if (n.status === 'open') { setJoined(true); rememberRoom('guest', { code: guest.code }); }
      if (n.error === 'version') setVerr(true);
      if ((n.error === 'notfound' || n.error === 'expired') && joined) { rememberRoom('guest', null); }
      if (n.error === 'notfound' && !joined) { rememberRoom('guest', null); audio.play('boing'); setShake((x) => x + 1); guest.close(); setGuest(null); }
    });
  }, [guest, joined]);

  if (!base) {
    return (
      <div class="screen lobby-screen"><div class="lobby-card"><Icon name="sad" class="big-icon" /><p class="lobby-msg">{t('room.noServer')}</p><Btn onClick={onExit}><Icon name="back" /> {t('common.back')}</Btn></div></div>
    );
  }
  if (guest && joined) return <GuestRoom guest={guest} onExit={() => { rememberRoom('guest', null); guest.close(); onExit(); }} />;
  return (
    <Keypad shake={shake} busy={!!guest} onBack={onExit}
      onSubmit={(code) => { audio.unlock(); setJoined(false); setGuest(new RoomGuest(base, code)); }}
      versionError={verr} />
  );
}

/** Keypad angka besar 3x4 (hapus & centang) untuk kode ruangan 4 angka. */
function Keypad({ onSubmit, onBack, shake, busy, versionError }: { onSubmit: (code: string) => void; onBack: () => void; shake: number; busy: boolean; versionError: boolean }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState(false);
  const boxes = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!shake) return;
    setCode(''); setErr(true);
    const el = boxes.current; if (!el) return;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }, [shake]);
  const press = (k: string) => {
    if (busy) return;
    audio.play('click');
    setErr(false);
    if (k === 'del') setCode((c) => c.slice(0, -1));
    else if (k === 'ok') { if (code.length === 4) onSubmit(code); }
    else setCode((c) => (c.length < 4 ? c + k : c));
  };
  // keyboard (untuk uji di laptop)
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') press('ok'); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  return (
    <div class="screen keypad-screen">
      <IconBtn icon="back" label={t('common.back')} onClick={onBack} class="keypad-back" />
      <div class="keypad-left">
        <Icon name="tray" class="big-icon" />
        <div class={`code-boxes ${err ? 'err' : ''}`} ref={boxes}>
          {[0, 1, 2, 3].map((i) => <span key={i} class={code.length === i ? 'cur' : ''}>{code[i] ?? ''}</span>)}
        </div>
        {busy && <span class="spinner" />}
        {err && !busy && <span class="keypad-err"><Icon name="close" /></span>}
      </div>
      <div class="keypad">
        {keys.map((k) => (
          <Btn key={k} sound={false} color={k === 'ok' ? 'green' : 'white'} class={`key key-${k} ${k === 'ok' && code.length === 4 ? 'pulse' : ''}`}
            disabled={(k === 'ok' && code.length < 4) || busy} onClick={() => press(k)} aria-label={k}>
            {k === 'del' ? <Icon name="backspace" /> : k === 'ok' ? <Icon name="check" /> : k}
          </Btn>
        ))}
      </div>
      {versionError && <VersionModal />}
    </div>
  );
}

function GuestRoom({ guest, onExit }: { guest: RoomGuest; onExit: () => void }) {
  const room = useStore(guest.room);
  const net = useStore(guest.net);
  useWakeLock(room.phase === 'play');
  const hostGone = room.hostLeft || !net.peer;

  if (room.phase === 'play' || room.phase === 'result') {
    return (
      <div class="screen net-play">
        <WaiterScreen key={room.round} link={guest} level={room.level} visible={room.phase === 'play'} onPause={() => guest.send({ t: 'pause', on: true })} />
        <NetBanner net={net} />
        {room.phase === 'play' && hostGone && net.status === 'open' && <WaitingOverlay text={t('net.waitingKakak')} icon="chefHat" />}
        {room.phase === 'play' && room.paused && !hostGone && (
          <Modal class="pause pause-guest" onClose={() => guest.send({ t: 'pause', on: false })}>
            <Btn color="yellow" big class="resume-big" onClick={() => guest.send({ t: 'pause', on: false })} aria-label={t('common.resume')}><Icon name="play" /></Btn>
          </Modal>
        )}
        {room.phase === 'result' && room.final && <ResultScreen state={room.final} readonly onNext={() => {}} onReplay={() => {}} onHome={onExit} />}
      </div>
    );
  }
  // menunggu Kakak memulai
  const L = getLevel(room.level);
  const c = getCountry(L.country);
  return (
    <div class="screen lobby-screen guest-wait">
      <IconBtn icon="back" label={t('common.back')} onClick={onExit} class="keypad-back" />
      <NetBanner net={net} />
      <div class="guest-wait-main">
        <div class="role-card role-waiter big">
          <Icon name="tray" class="role-icon" />
          <span class="role-status ok"><Icon name="check" /></span>
        </div>
        <span class="dots big"><i /><i /><i /></span>
        <div class={`role-card role-chef big ${hostGone ? 'dim' : ''}`}>
          <Icon name="chefHat" class="role-icon" />
          <Flag code={c.flag} />
        </div>
      </div>
      <p class="guest-wait-text">{t('net.waitingKakak')}</p>
    </div>
  );
}
