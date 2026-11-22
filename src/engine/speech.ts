import { getLang, t } from '../data/i18n';

/**
 * Narasi suara singkat (Web Speech API), mis. "Meja merah!".
 * Bila perangkat tidak punya suara bahasa yang cocok, diam saja (ikon & efek suara tetap ada).
 */
let enabled = true;
let last = '';
let lastAt = 0;

// iOS/Android memuat daftar suara belakangan: muat ulang saat siap
try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices()); } catch { /* abaikan */ }

export function setNarration(on: boolean) { enabled = on; if (!on) try { speechSynthesis.cancel(); } catch { /* abaikan */ } }

function pickVoice(): SpeechSynthesisVoice | null {
  try {
    const want = getLang() === 'id' ? ['id-ID', 'id_ID', 'in-ID', 'id'] : ['en-US', 'en-GB', 'en'];
    const voices = speechSynthesis.getVoices();
    for (const w of want) { const v = voices.find((v) => v.lang.toLowerCase().startsWith(w.toLowerCase())); if (v) return v; }
  } catch { /* tidak didukung */ }
  return null;
}

/** Ucapkan kalimat dari kunci i18n (`voice.*`). Kalimat yang sama tidak diulang dalam 4 detik. */
export function say(key: string, params?: Record<string, string | number>) {
  if (!enabled || !key || typeof speechSynthesis === 'undefined') return;
  const text = t(key, params);
  const now = performance.now();
  if (text === last && now - lastAt < 4000) return;
  const voice = pickVoice();
  if (!voice) return;
  last = text; lastAt = now;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice; u.lang = voice.lang; u.rate = 0.95; u.pitch = 1.15; u.volume = 1;
    speechSynthesis.speak(u);
  } catch { /* abaikan */ }
}

/** iOS butuh ucapan pertama di dalam sentuhan pengguna. */
export function unlockSpeech() {
  try { if (typeof speechSynthesis !== 'undefined') { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); speechSynthesis.getVoices(); } } catch { /* abaikan */ }
}

/** Kunci suara tutorial, mendukung bentuk "voice.table:merah". */
export function sayHint(key: string) {
  if (!key) return;
  const [k, color] = key.split(':');
  say(k, color ? { color: t(`color.${color}`) } : undefined);
}
