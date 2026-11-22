import { t, setLang } from '../data/i18n';
import { audio } from '../engine/audio';
import type { Preset } from '../engine/quality';
import { settings } from './settings';
import { useStore } from './store';
import { IconBtn, Modal, Segmented, Toggle } from './components';

declare const __APP_VERSION__: string;

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useStore(settings);
  return (
    <Modal onClose={onClose} class="settings">
      <header class="modal-head">
        <h2>{t('settings.title')}</h2>
        <IconBtn icon="close" label={t('common.close')} onClick={onClose} />
      </header>
      <div class="settings-body">
        <div class="set-row">
          <b>{t('settings.language')}</b>
          <Segmented value={s.lang} options={[{ v: 'id', label: 'ID' }, { v: 'en', label: 'EN' }]} onChange={(v) => { settings.update({ lang: v }); setLang(v); }} />
        </div>
        <div class="set-row">
          <b>{t('settings.graphics')}{s.graphics === 'auto' && s.detected ? ` (${t(`settings.gfx.${s.detected}`)})` : ''}</b>
          <Segmented<'auto' | Preset> value={s.graphics}
            options={[{ v: 'auto', label: t('settings.gfx.auto') }, { v: 'rendah', label: t('settings.gfx.rendah') }, { v: 'sedang', label: t('settings.gfx.sedang') }, { v: 'tinggi', label: t('settings.gfx.tinggi') }]}
            onChange={(v) => settings.update({ graphics: v })} />
        </div>
        <small class="note">{t('settings.reloadNote')}</small>
        <div class="set-row">
          <b>{t('settings.volume')}</b>
          <input type="range" min="0" max="1" step="0.05" value={s.volume} class="slider"
            onInput={(e) => { const v = +(e.target as HTMLInputElement).value; settings.update({ volume: v }); audio.setVolume(v); }} />
        </div>
        <Toggle label={t('common.sound')} on={!s.muted} onChange={(v) => { settings.update({ muted: !v }); audio.setMuted(!v); }} />
        <Toggle label={t('settings.music')} on={s.music} onChange={(v) => { settings.update({ music: v }); audio.setMusicOn(v); }} />
        <Toggle label={t('settings.relaxed')} sub={t('settings.relaxedInfo')} on={s.relaxed} onChange={(v) => settings.update({ relaxed: v })} />
        <Toggle label={t('settings.guide')} on={s.guide} onChange={(v) => settings.update({ guide: v })} />
        <Toggle label={t('settings.fps')} on={s.showFps} onChange={(v) => settings.update({ showFps: v })} />
        <p class="version">{t('settings.version', { v: __APP_VERSION__ })}</p>
      </div>
    </Modal>
  );
}
