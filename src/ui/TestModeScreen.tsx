import { useEffect, useMemo, useState } from 'preact/hooks';
import { HostSession } from '../game/session';
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
import { Btn, Icon, Modal, Segmented } from './components';
import { ChefScreen } from './ChefScreen';
import { WaiterScreen } from './WaiterScreen';
import { ResultScreen } from './ResultScreen';
import { SettingsModal } from './SettingsModal';

type ViewMode = 'both' | 'chef' | 'waiter';

/**
 * MODE UJI 1 PERANGKAT: layar Koki dan Pelayan di satu browser (berdampingan atau bergantian).
 * Pelayan terhubung ke host lewat penghubung lokal dengan antarmuka yang sama seperti jaringan.
 */
export function TestModeScreen({ level, onExit, onLevel }: { level: number; onExit: () => void; onLevel: (id: number) => void }) {
  const st = useStore(settings);
  const [round, setRound] = useState(0);
  const session = useMemo(() => new HostSession(level, st.relaxed, undefined, !!getLevel(level).tutorial && !loadProgress().best[level]), [level, round]);
  const link = useMemo(() => session.localWaiterLink(), [session]);
  const [mode, setMode] = useState<ViewMode>(() => (window.innerWidth >= 1000 ? 'both' : 'chef'));
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const L = getLevel(level);

  useEffect(() => {
    setClosing(false); setEnded(false); setPaused(false);
    audio.playMusic(getCountry(L.country).music);
    const stop = addTick((dt) => session.tick(dt));
    const off = session.onEvent((e) => {
      if (e.e !== 'end') return;
      setClosing(true);
      const s = session.sim.state;
      const stars = starsFor(s.stats.score, L);
      saveProgress(applyResult(loadProgress(), L.id, stars, coinsFor(s.stats.score, s.stats.happy, L), isLevelPlayable(L.id + 1)));
      setTimeout(() => { setEnded(true); audio.stopMusic(); }, 1800);
    });
    return () => { stop(); off(); audio.stopMusic(); };
  }, [session]);

  // kait untuk uji otomatis (tools/smoke.mjs)
  (window as unknown as { __kkd: unknown }).__kkd = { session, link, setMode };

  const pause = (p: boolean) => { session.paused = p; setPaused(p); audio.pauseMusic(p); };

  return (
    <div class={`screen test-mode mode-${mode}`}>
      <div class="pane pane-chef" style={{ display: mode === 'waiter' ? 'none' : undefined }}>
        <ChefScreen key={'c' + round} session={session} visible={mode !== 'waiter' && !ended} onPause={() => pause(true)} />
      </div>
      <div class="pane pane-waiter" style={{ display: mode === 'chef' ? 'none' : undefined }}>
        <WaiterScreen key={'w' + round} link={link} level={level} visible={mode !== 'chef' && !ended} onPause={() => pause(true)} />
      </div>
      <div class="mode-switch">
        <Segmented<ViewMode> value={mode} onChange={setMode} options={[{ v: 'chef', label: t('test.chef') }, { v: 'both', label: t('test.both') }, { v: 'waiter', label: t('test.waiter') }]} />
      </div>
      {closing && !ended && <div class="closing-banner"><Icon name="bell" /> {t('hud.closing')}</div>}
      {paused && !ended && (
        <Modal class="pause" onClose={() => pause(false)}>
          <h2>{t('common.pause')}</h2>
          <div class="col">
            <Btn color="yellow" big onClick={() => pause(false)}><Icon name="play" /> {t('common.resume')}</Btn>
            <Btn onClick={() => setShowSettings(true)}><Icon name="gear" /> {t('common.settings')}</Btn>
            <Btn onClick={() => setRound((r) => r + 1)}><Icon name="replay" /> {t('result.replay')}</Btn>
            <Btn onClick={onExit}><Icon name="home" /> {t('common.quit')}</Btn>
          </div>
        </Modal>
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {ended && (
        <ResultScreen state={session.sim.state} onNext={onLevel} onReplay={() => setRound((r) => r + 1)} onHome={onExit} />
      )}
    </div>
  );
}
