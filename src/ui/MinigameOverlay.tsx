import { useEffect, useRef, useState } from 'preact/hooks';
import type { HostSession } from '../game/session';
import { RECIPES, type RecipeStep } from '../data/recipes';
import { MENUS } from '../data/menus';
import { TABLE_COLORS } from '../data/palette';
import type { StationId } from '../data/stations';
import { t } from '../data/i18n';
import { MINIGAMES } from '../minigames';
import { gosok } from '../minigames/gosok';
import { audio } from '../engine/audio';
import { FoodIcon, Icon, IconBtn } from './components';

export type OpenGame =
  | { kind: 'cook'; ticketId: number; step: number; station: StationId }
  | { kind: 'wash'; station: 'wastafel' };

export function stepLabel(s: RecipeStep, menu: string): string {
  if (s.type === 'seret-bahan') return t('step.seret-bahan', { item: t(`menu.${menu}`).toLowerCase() });
  const item = t(`ing.${s.ingredient}`);
  if (s.type === 'timing') return t(`step.timing.${s.action}`, { item });
  return t(`step.${s.type}`, { item });
}

/** Overlay putih di atas dapur yang digelapkan: panel resep, area masak, grid bahan. */
export function MinigameOverlay({ game, session, onClose }: { game: OpenGame; session: HostSession; onClose: () => void }) {
  const area = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState('');
  const [praise, setPraise] = useState<string | null>(null);
  const s = session.sim.state;
  const ticket = game.kind === 'cook' ? s.tickets.find((x) => x.id === game.ticketId) : undefined;
  const recipe = ticket ? RECIPES[ticket.menu] : null;
  const table = ticket ? s.tables[ticket.table] : null;

  useEffect(() => {
    const a = area.current!, sd = side.current!;
    let inst: { destroy(): void } | null = null;
    let closed = false;
    const close = () => { if (!closed) { closed = true; onClose(); } };
    if (game.kind === 'wash') {
      inst = gosok({
        area: a,
        remaining: () => session.sim.state.sink,
        washOne: () => { session.sim.washPlate(); },
        setHint,
        sfx: (x) => audio.play(x),
        t,
        finished: close,
      });
    } else if (recipe) {
      const step = recipe.steps[game.step];
      inst = MINIGAMES[step.type]({
        area: a, side: sd, step, setHint, t,
        sfx: (x) => audio.play(x),
        done: (q) => {
          setPraise(q >= 0.95 ? t('mg.great') : q >= 0.75 ? t('mg.good') : t('mg.ok'));
          audio.play(q >= 0.95 ? 'star' : 'pop');
          setTimeout(() => { session.sim.completeStep(game.ticketId, q); close(); }, 650);
        },
      });
    }
    return () => { closed = true; inst?.destroy(); };
  }, []);

  // tiket dibatalkan (tamu pergi) saat sedang memasak -> tutup
  useEffect(() => {
    if (game.kind === 'cook' && !ticket && !praise) onClose();
  });

  const title = game.kind === 'wash' ? t('mg.washTitle') : ticket ? t(`menu.${ticket.menu}`) : '';
  return (
    <div class="mg-back">
      <div class="mg-panel">
        <header class="mg-head">
          {ticket ? <FoodIcon name={MENUS[ticket.menu]?.icon ?? ''} /> : <Icon name="plateDirty" />}
          <h2>{title}</h2>
          {table && <span class="tag" style={{ '--tc': TABLE_COLORS[table.color].css } as Record<string, string>}>{t('hud.forTable', { color: t(`color.${table.color}`) })}</span>}
          <span class="grow" />
          <IconBtn icon="close" label={t('common.close')} onClick={onClose} class="mg-close" />
        </header>
        <div class="mg-body">
          {recipe && (
            <aside class="mg-recipe">
              <h3>{t('mg.recipe')}</h3>
              <ol>
                {recipe.steps.map((st, i) => (
                  <li key={i} class={i < (game.kind === 'cook' ? game.step : 0) ? 'done' : i === (game.kind === 'cook' ? game.step : -1) ? 'cur' : ''}>
                    <span class="dot">{i < (game.kind === 'cook' ? game.step : 0) ? <Icon name="check" /> : i + 1}</span>
                    <span>{stepLabel(st, recipe.menu)}<small>{t(`station.${st.station}`)}</small></span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
          <div class="mg-area" ref={area} />
          <div class="mg-side" ref={side} />
        </div>
        <footer class="mg-hint">{hint}</footer>
        {praise && <div class="mg-praise">{praise}</div>}
      </div>
    </div>
  );
}
