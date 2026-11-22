import { useEffect, useMemo } from 'preact/hooks';
import type { CafeState } from '../game/types';
import { coinsFor, starsFor } from '../game/sim';
import { getLevel, LEVELS } from '../data/levels';
import { getCountry } from '../data/countries';
import { t } from '../data/i18n';
import { audio } from '../engine/audio';
import { Btn, Flag, Icon, IconBtn, Stars } from './components';
import { isLevelPlayable } from '../game/levelCheck';

/** Hasil Level: latar kuning + konfeti, 3 bintang, statistik TIM (bukan per anak). */
export function ResultScreen({ state, onNext, onReplay, onHome, readonly }: { state: CafeState; onNext: (id: number) => void; onReplay: () => void; onHome: () => void; readonly?: boolean }) {
  const L = getLevel(state.level);
  const stars = starsFor(state.stats.score, L);
  const coins = coinsFor(state.stats.score, state.stats.happy, L);
  const next = LEVELS.find((l) => l.id === L.id + 1);
  const nextOk = next ? isLevelPlayable(next.id) : false;
  const st = state.stats;
  const badge = st.bellsOnTime >= st.right && st.bellsOnTime > 0
    ? t('result.badgeBell', { n: st.bellsOnTime })
    : st.washed >= st.right && st.washed > 0 ? t('result.badgeWash', { n: st.washed }) : t('result.badgeServe', { n: st.right });
  useEffect(() => {
    audio.play('fanfare');
    const ids = [0, 1, 2].slice(0, stars).map((i) => setTimeout(() => audio.play('star'), 500 + i * 380));
    return () => ids.forEach(clearTimeout);
  }, []);
  const confetti = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    left: (i * 37) % 100, delay: (i % 10) * 0.25, dur: 2.6 + (i % 5) * 0.4, color: ['#C9432A', '#1F6FD1', '#FFFFFF', '#2E9E5B', '#7E5BD6', '#FF7AA8'][i % 6], rot: (i * 47) % 360,
  })), []);
  const nc = next ? getCountry(next.country) : null;
  return (
    <div class="result-screen">
      <div class="confetti" aria-hidden="true">
        {confetti.map((c, i) => <i key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s`, background: c.color, transform: `rotate(${c.rot}deg)` }} />)}
      </div>
      <div class="result-card">
        <Stars n={stars} class="result-stars" />
        <h1>{stars >= 2 ? t('result.title') : t('result.titleOk')}</h1>
        <span class="pill pill-love">{t('role.kakak')} <Icon name="heart" /> {t('role.adik')}</span>
        <div class="result-stats">
          <div><Icon name="happy" /><b>{st.happy}</b><small>{t('result.happy')}</small></div>
          <div><Icon name="plate" /><b>{st.washed}</b><small>{t('result.washed')}</small></div>
          <div><Icon name="check" /><b>{st.right}</b><small>{t('result.rightTable')}</small></div>
        </div>
        {st.right > 0 && <div class="result-badge"><Icon name="bell" /> {badge}</div>}
        <div class="result-coins"><Icon name="coin" /> {t('result.coins', { n: coins })}</div>
        {readonly ? (
          <div class="result-actions"><span class="dots"><i /><i /><i /></span><span class="wait-text">{t('net.waitingKakak')}</span><IconBtn icon="home" label={t('common.quit')} onClick={onHome} /></div>
        ) : <div class="result-actions">
          {next && nc && (
            <Btn color="red" big disabled={!nextOk} onClick={() => onNext(next.id)}>
              <Flag code={nc.flag} /> {nextOk ? t('result.next', { country: t(`country.${nc.id}`) }) : t('result.nextSoon', { country: t(`country.${nc.id}`) })}
            </Btn>
          )}
          <Btn color="blue" disabled title={t('title.joinSoon')}><Icon name="palette" /> {t('result.decorate')}</Btn>
          <IconBtn icon="replay" label={t('result.replay')} onClick={onReplay} color="yellow" />
          <IconBtn icon="home" label={t('common.quit')} onClick={onHome} />
        </div>}
      </div>
    </div>
  );
}
