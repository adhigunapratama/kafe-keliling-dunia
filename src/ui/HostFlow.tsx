import { useEffect, useState } from 'preact/hooks';
import { RoomHost } from '../net/room';
import { createRoom, recallRoom, rememberRoom, roomServerUrl } from '../net/client';
import { addTick } from '../engine/loop';
import { audio } from '../engine/audio';
import { getLevel } from '../data/levels';
import { getCountry } from '../data/countries';
import { t } from '../data/i18n';
import { coinsFor, starsFor } from '../game/sim';
import { applyResult, loadProgress, saveProgress } from '../game/progress';
import { isLevelPlayable } from '../game/levelCheck';
import { settings } from './settings';
import { useStore } from './store';
import { Btn, Flag, Icon, IconBtn, Modal, Toggle } from './components';
import { ChefScreen } from './ChefScreen';
import { ResultScreen } from './ResultScreen';
import { SettingsModal } from './SettingsModal';
import { NetBanner, WaitingOverlay } from './netUi';
import { useWakeLock } from './wakeLock';
import { WorldMapScreen } from './WorldMapScreen';

/** Alur di HP Koki: buat ruangan -> layar Ruangan & Pilih Peran -> main -> hasil. */
export function HostFlow({ level, onExit }: { level: number; onExit: () => void }) {
  const base = roomServerUrl();
  const [host, setHost] = useState<RoomHost | null>(null);
  const [err, setErr] = useState<string | null>(base ? null : t('room.noServer'));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!base) return;
    let dead = false, h: RoomHost | null = null;
    setErr(null);
    const mem = attempt === 0 ? recallRoom('host') : null;
    (mem?.token ? Promise.resolve({ code: mem.code, token: mem.token }) : createRoom(base))
      .then(({ code, token }) => {
        if (dead) return;
        h = new RoomHost(base, code, token, level, settings.get().relaxed);
        rememberRoom('host', { code, token });
        (window as unknown as { __kkdHost: unknown }).__kkdHost = h;
        // ruangan lama sudah kedaluwarsa -> buat baru
        const off = h.net.sub(() => { const e = h!.net.get().error; if (e === 'notfound' || e === 'forbidden' || e === 'expired') { off(); rememberRoom('host', null); h!.close(); setHost(null); setAttempt((a) => a + 1); } });
        setHost(h);
      })
      .catch(() => { if (!dead) setErr(t('room.failed')); });
    return () => { dead = true; h?.close(); };
  }, [attempt]);

  if (err) {
    return (
      <div class="screen lobby-screen">
        <div class="lobby-card">
          <Icon name="sad" class="big-icon" />
          <p class="lobby-msg">{err}</p>
          <div class="row">
            {base && <Btn color="yellow" onClick={() => setAttempt((a) => a + 1)}><Icon name="replay" /> {t('room.retry')}</Btn>}
            <Btn onClick={onExit}><Icon name="back" /> {t('common.back')}</Btn>
          </div>
        </div>
      </div>
    );
  }
  if (!host) return <div class="screen lobby-screen"><div class="lobby-card"><div class="spinner" /><p class="lobby-msg">{t('room.creating')}</p></div></div>;
  return <HostRoom host={host} onExit={() => { rememberRoom('host', null); onExit(); }} />;
}

function HostRoom({ host, onExit }: { host: RoomHost; onExit: () => void }) {
  const room = useStore(host.room);
  if (room.phase === 'lobby') return <RoomLobby host={host} onExit={onExit} />;
  return <HostPlay host={host} key={room.round} />;
}

/** Layar Ruangan & Pilih Peran (HP Koki). */
function RoomLobby({ host, onExit }: { host: RoomHost; onExit: () => void }) {
  const room = useStore(host.room);
  const net = useStore(host.net);
  const L = getLevel(room.level);
  const c = getCountry(L.country);
  const peer = net.peer;
  const [map, setMap] = useState(false);
  if (map) return <WorldMapScreen onBack={() => setMap(false)} onPlay={(lv) => { host.setLobby({ level: lv }); setMap(false); }} />;
  return (
    <div class="screen lobby-screen">
      <div class="lobby-top">
        <IconBtn icon="back" label={t('common.back')} onClick={onExit} />
        <h1>{t('room.title')}</h1>
        <Btn class="pill-btn" onClick={() => setMap(true)}><Flag code={c.flag} /> {t('room.level', { n: L.id, country: t(`country.${c.id}`) })} <Icon name="globe" /></Btn>
      </div>
      <NetBanner net={net} />
      <div class="lobby-main">
        <div class="code-block">
          <div class="code-boxes" aria-label={host.code}>{host.code.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
          <p>{t('room.codeHint')}</p>
        </div>
        <div class="role-cards">
          <div class="role-card role-chef">
            <Icon name="chefHat" class="role-icon" />
            <b>{t('role.chef')}</b><small>{t('role.kakak')}</small>
            <span class="role-status ok"><Icon name="check" /> {t('room.ready')}</span>
          </div>
          <div class={`role-card role-waiter ${peer ? '' : 'dim'}`}>
            <Icon name="tray" class="role-icon" />
            <b>{t('role.waiter')}</b><small>{t('role.adik')}</small>
            <span class={`role-status ${peer ? 'ok' : 'wait'}`}>{peer ? <><Icon name="check" /> {t('room.connected')}</> : <><span class="dots"><i /><i /><i /></span> {t('room.waiting')}</>}</span>
          </div>
        </div>
      </div>
      <div class="lobby-bottom">
        <div class="relax-box"><Toggle label={t('settings.relaxed')} sub={t('settings.relaxedInfo')} on={room.relaxed} onChange={(v) => { settings.update({ relaxed: v }); host.setLobby({ relaxed: v }); }} /></div>
        <Btn color="yellow" big class={`start-btn ${peer ? 'pulse' : ''}`} disabled={!peer} onClick={() => { audio.unlock(); host.start(room.level, room.relaxed); }}>
          <Icon name="play" /> {t('room.start')}
        </Btn>
      </div>
    </div>
  );
}

/** Layar main di HP Koki (lewat jaringan). */
function HostPlay({ host }: { host: RoomHost }) {
  const room = useStore(host.room);
  const net = useStore(host.net);
  const session = host.session!;
  const [showSettings, setShowSettings] = useState(false);
  const L = getLevel(room.level);
  useWakeLock(room.phase === 'play');
  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    if (room.phase !== 'result') { setShowResult(false); return; }
    const id = setTimeout(() => setShowResult(true), 1800);
    return () => clearTimeout(id);
  }, [room.phase]);

  useEffect(() => {
    audio.playMusic(getCountry(L.country).music);
    const stop = addTick((dt) => session.tick(dt));
    const off = session.onEvent((e) => {
      if (e.e !== 'end') return;
      const s = session.sim.state;
      saveProgress(applyResult(loadProgress(), L.id, starsFor(s.stats.score, L), coinsFor(s.stats.score, s.stats.happy, L), isLevelPlayable(L.id + 1)));
      audio.stopMusic();
    });
    return () => { stop(); off(); audio.stopMusic(); };
  }, [session]);
  useEffect(() => { audio.pauseMusic(room.paused); }, [room.paused]);

  return (
    <div class="screen net-play">
      <ChefScreen session={session} visible={room.phase === 'play'} onPause={() => host.setPaused(true)} />
      <NetBanner net={net} />
      {room.phase === 'play' && room.waitingPeer && <WaitingOverlay text={t('net.waitingAdik')} />}
      {room.phase === 'play' && room.paused && !room.waitingPeer && (
        <Modal class="pause" onClose={() => host.setPaused(false)}>
          <h2>{t('common.pause')}</h2>
          <div class="col">
            <Btn color="yellow" big onClick={() => host.setPaused(false)}><Icon name="play" /> {t('common.resume')}</Btn>
            <Btn onClick={() => setShowSettings(true)}><Icon name="gear" /> {t('common.settings')}</Btn>
            <Btn onClick={() => host.start(room.level, room.relaxed)}><Icon name="replay" /> {t('result.replay')}</Btn>
            <Btn onClick={() => host.backToLobby()}><Icon name="home" /> {t('net.toLobby')}</Btn>
          </div>
        </Modal>
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {room.phase === 'result' && !showResult && <div class="closing-banner"><Icon name="bell" /> {t('hud.closing')}</div>}
      {room.phase === 'result' && showResult && (
        <ResultScreen state={session.sim.state}
          onNext={(id) => host.start(id, room.relaxed)}
          onReplay={() => host.start(room.level, room.relaxed)}
          onHome={() => host.backToLobby()} />
      )}
    </div>
  );
}
