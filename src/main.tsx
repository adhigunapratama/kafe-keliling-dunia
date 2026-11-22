import { render } from 'preact';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import './ui/styles.css';
import { App } from './ui/App';
import { settings } from './ui/settings';
import { setLang } from './data/i18n';
import { audio } from './engine/audio';
import { setNarration, unlockSpeech } from './engine/speech';
import { initSave } from './game/progress';
import { initBackup } from './net/backup';

const s = settings.get();
setLang(s.lang);
audio.setVolume(s.volume);
audio.setMuted(s.muted);
audio.setMusicOn(s.music);
setNarration(s.narration);

// Audio hanya boleh dimulai setelah sentuhan pertama (iOS/Android).
let speechUnlocked = false;
const unlock = () => { audio.unlock(); if (!speechUnlocked) { speechUnlocked = true; unlockSpeech(); } };
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('touchend', unlock, { capture: true });
window.addEventListener('click', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

// cegah zoom dobel-ketuk & menu konteks di layar game
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

void initSave().then(initBackup);
render(<App />, document.getElementById('app')!);
