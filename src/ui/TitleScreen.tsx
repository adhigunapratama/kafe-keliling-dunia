import { useEffect, useRef, useState } from 'preact/hooks';
import { TitleCafeView } from '../scenes/titleCafe';
import { addTick } from '../engine/loop';
import { audio } from '../engine/audio';
import { adjustPresetByFps, guessPresetFromGpu } from '../engine/quality';
import { LEVELS, getLevel } from '../data/levels';
import { getCountry } from '../data/countries';
import { t, setLang } from '../data/i18n';
import { loadProgress, saveProgress, totalStars, EMPTY_PROGRESS } from '../game/progress';
import { isLevelPlayable } from '../game/levelCheck';
import { settings, effectivePreset } from './settings';
import { useStore } from './store';
import { Btn, Flag, Icon, IconBtn, Modal } from './components';
import { SettingsModal } from './SettingsModal';
import { reportFrame } from './fps';

export function TitleScreen({ onPlay }: { onPlay: (level: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const s = useStore(settings);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [prog, setProg] = useState(loadProgress);

  useEffect(() => {
    const st = settings.get();
    const firstRun = st.detected === null;
    const preset = firstRun ? guessPresetFromGpu() : effectivePreset();
    const view = new TitleCafeView(host.current!, preset);
    let acc = 0, frames = 0, elapsed = 0, decided = !firstRun;
    const stop = addTick((dt) => {
      view.update(dt);
      view.render();
      reportFrame('title', dt, view);
      elapsed += dt;
      // uji fps 2 detik (setelah 0.5 detik pemanasan) untuk memilih preset otomatis
      if (!decided && elapsed > 0.5) {
        acc += dt; frames++;
        if (acc >= 2) { decided = true; settings.update({ detected: adjustPresetByFps(preset, frames / acc) }); }
      }
    });
    return () => { stop(); view.dispose(); };
  }, []);

  const level = Math.min(prog.last || 1, LEVELS.length);
  const playable = isLevelPlayable(level) ? level : 1;
  const L = getLevel(playable);
  const c = getCountry(L.country);

  return (
    <div class="screen title-screen">
      <div class="title-art" ref={host} />
      <div class="title-side">
        <span class="badge-pill"><Icon name="heart" /> {t('title.badge')}</span>
        <h1 class="title-h1">{t('app.title')}</h1>
        <p class="title-sub">{t('app.subtitle')}</p>
        <Btn color="red" big class="btn-continue" onClick={() => { audio.unlock(); onPlay(playable); }}>
          <span class="bc-main"><Icon name="play" /> {t('title.continue')}</span>
          <span class="bc-info"><Flag code={c.flag} /> {t('title.continueInfo', { level: playable, total: LEVELS.length, country: t(`country.${c.id}`), stars: totalStars(prog) })}</span>
        </Btn>
        <Btn color="blue" big disabled class="btn-join">
          <span class="bc-main"><Icon name="tray" /> {t('title.join')}</span>
          <span class="bc-info">{t('title.joinSoon')}</span>
        </Btn>
        <p class="test-note"><Icon name="chefHat" /> + <Icon name="tray" /> {t('title.testMode')}</p>
        <div class="title-row">
          <IconBtn icon="gear" label={t('common.settings')} onClick={() => setShowSettings(true)} />
          <IconBtn icon={s.muted ? 'soundOff' : 'sound'} label={t('common.sound')} onClick={() => { const m = !s.muted; settings.update({ muted: m }); audio.setMuted(m); }} />
          <Btn class="btn-lang" onClick={() => { const l = s.lang === 'id' ? 'en' : 'id'; settings.update({ lang: l }); setLang(l); }}>
            <b class={s.lang === 'id' ? 'on' : ''}>ID</b> · <b class={s.lang === 'en' ? 'on' : ''}>EN</b>
          </Btn>
          <Btn class="btn-small" onClick={() => setConfirmNew(true)}>{t('title.newGame')}</Btn>
        </div>
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {confirmNew && (
        <Modal onClose={() => setConfirmNew(false)} class="confirm">
          <p>{t('title.newGameConfirm')}</p>
          <div class="row">
            <Btn color="red" onClick={() => { const p = { ...EMPTY_PROGRESS, best: {} }; saveProgress(p); setProg(p); setConfirmNew(false); }}>{t('common.yes')}</Btn>
            <Btn onClick={() => setConfirmNew(false)}>{t('common.no')}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
