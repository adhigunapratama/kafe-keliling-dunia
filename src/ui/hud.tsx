import { useEffect, useState } from 'preact/hooks';
import type { HostSession, EmojiMsg } from '../game/session';
import type { CafeState } from '../game/types';
import type { EmojiKind } from '../net/protocol';
import { getLevel } from '../data/levels';
import { getCountry } from '../data/countries';
import { starsProgress } from '../game/sim';
import { t } from '../data/i18n';
import { Btn, Flag, Icon, IconBtn, Stars } from './components';
import type { IconName } from './icons';

const EMOJI_ICON: Record<EmojiKind, IconName> = { thumb: 'thumb', heart: 'heart', bolt: 'bolt', help: 'help' };

export function fmtTime(sec: number) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Bilah atas: jeda, pil negara + hari, timer, bintang tim. */
export function TopBar({ session, state, onPause, role, center }: { session?: HostSession; state?: CafeState | null; onPause: () => void; role: 'chef' | 'waiter'; center?: preact.ComponentChildren }) {
  const s = state ?? session?.sim.state ?? null;
  if (!s) return null;
  const L = getLevel(s.level);
  const c = getCountry(L.country);
  const left = s.duration - s.t;
  return (
    <div class={`topbar topbar-${role}`}>
      <IconBtn icon="pause" label={t('common.pause')} onClick={onPause} class="btn-pause" />
      {role === 'chef' ? (
        <span class="pill"><Flag code={c.flag} /> {t('hud.day', { country: t(`country.${c.id}`), day: 1 })}</span>
      ) : (
        <span class="pill pill-flag"><Flag code={c.flag} /></span>
      )}
      <div class="topbar-center">
        {center ?? (role === 'chef' ? <span class={`timer ${left < 20 ? 'hurry' : ''}`}>{fmtTime(left)}</span> : null)}
      </div>
      <span class="pill pill-stars"><Stars n={starsProgress(s.stats.score, L)} /></span>
    </div>
  );
}

/** Tombol emoji (ikon SVG) untuk berkirim pesan ke saudara. */
export function EmojiBar({ kinds, onSend, big }: { kinds: EmojiKind[]; onSend: (k: EmojiKind) => void; big?: boolean }) {
  const [cool, setCool] = useState(0);
  return (
    <div class={`emoji-bar ${big ? 'big' : ''}`}>
      {kinds.map((k) => (
        <Btn key={k} color="white" class={`btn-emoji emoji-${k}`} sound={false} aria-label={k}
          onClick={() => { const now = performance.now(); if (now - cool < 400) return; setCool(now); onSend(k); }}>
          <Icon name={EMOJI_ICON[k]} />
        </Btn>
      ))}
    </div>
  );
}

/** Gelembung pesan dari saudara: "Adik: ❤" (digambar sebagai ikon). */
export function MessageBubble({ msg, from }: { msg: EmojiMsg | null; from: 'adik' | 'kakak' }) {
  const [shown, setShown] = useState<EmojiMsg | null>(null);
  useEffect(() => {
    if (!msg) return;
    setShown(msg);
    const id = setTimeout(() => setShown(null), 3200);
    return () => clearTimeout(id);
  }, [msg]);
  if (!shown) return null;
  return (
    <div class={`msg-bubble msg-from-${from}`} key={shown.at}>
      <span class="msg-who">{t('hud.msgFrom', { who: t(from === 'adik' ? 'role.adik' : 'role.kakak') })}</span>
      <Icon name={EMOJI_ICON[shown.kind]} />
    </div>
  );
}
