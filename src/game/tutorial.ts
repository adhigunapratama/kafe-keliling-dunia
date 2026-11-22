import { RECIPES } from '../data/recipes';
import type { StationId } from '../data/stations';
import type { CafeState, Target } from './types';

/**
 * Langkah tutorial Level 1, dihitung dari status kafe (jadi sama di HP Koki dan tablet Adik).
 * `waiter`/`chef` = apa yang harus dilakukan masing-masing; null = menunggu saudaranya.
 */
export type TutStep =
  | 'greet' | 'seat' | 'order' | 'toKitchen' | 'cook' | 'bell' | 'pickup' | 'deliver' | 'eat' | 'clear' | 'plates' | 'wash' | 'done';

export interface TutHint {
  step: TutStep;
  waiter: { target: Target | null; icon: string; voice: string } | null;
  chef: { station: StationId | 'bell' | null; text: string; voice: string } | null;
}

export function tutorialHint(s: CafeState): TutHint | null {
  if (!s.tutorial) return null;
  if (s.stats.washed > 0) return { step: 'done', waiter: null, chef: null };
  const c = s.waiter.carry;
  const party = s.parties.find((p) => p.state !== 'leaving');
  const waitChef = (text: string) => ({ station: null, text, voice: '' });
  const waitWaiter = { target: null, icon: 'chefHat', voice: '' };

  if (s.sink > 0) return { step: 'wash', waiter: waitWaiter, chef: { station: 'wastafel', text: 'tut.wash', voice: 'voice.wash' } };
  if (c?.k === 'dirty') return { step: 'plates', waiter: { target: { k: 'pass' }, icon: 'plateDirty', voice: 'voice.plates' }, chef: waitChef('tut.waitPlates') };
  const dirty = s.tables.find((t) => t.dirty > 0 && t.party === null);
  if (dirty) return { step: 'clear', waiter: { target: { k: 'table', id: dirty.id }, icon: 'sparkle', voice: 'voice.clear' }, chef: waitChef('tut.waitPlates') };
  if (c?.k === 'dish') return { step: 'deliver', waiter: { target: { k: 'table', id: c.dish.table }, icon: 'table:' + s.tables[c.dish.table].color, voice: 'voice.table:' + s.tables[c.dish.table].color }, chef: waitChef('tut.waitDeliver') };
  if (s.pass.some((d) => d.announced)) return { step: 'pickup', waiter: { target: { k: 'pass' }, icon: 'bell', voice: 'voice.foodReady' }, chef: waitChef('tut.waitDeliver') };
  if (s.pass.some((d) => !d.announced)) return { step: 'bell', waiter: waitWaiter, chef: { station: 'bell', text: 'tut.bell', voice: 'voice.bell' } };
  const tk = s.tickets.find((t) => t.state === 'cooking');
  if (tk) return { step: 'cook', waiter: waitWaiter, chef: { station: RECIPES[tk.menu].steps[tk.step].station, text: 'tut.cook', voice: 'voice.cook' } };
  if (c?.k === 'order') return { step: 'toKitchen', waiter: { target: { k: 'pass' }, icon: 'note', voice: 'voice.toKitchen' }, chef: waitChef('tut.waitOrder') };
  if (party?.state === 'waitFood' && party.guests.some((g) => g.dishState === 'served')) return { step: 'eat', waiter: { target: null, icon: 'heart', voice: '' }, chef: waitChef('tut.waitEat') };
  if (party && (party.state === 'wantOrder' || party.state === 'reading')) return { step: 'order', waiter: { target: { k: 'table', id: party.table }, icon: 'book', voice: 'voice.order' }, chef: waitChef('tut.waitOrder') };
  if (c?.k === 'party') { const t = s.tables.find((t) => t.party === null && t.dirty === 0); return { step: 'seat', waiter: { target: t ? { k: 'table', id: t.id } : null, icon: 'chair', voice: 'voice.seat' }, chef: waitChef('tut.waitOrder') }; }
  if (party && (party.state === 'waitSeat' || party.state === 'arriving')) return { step: 'greet', waiter: { target: { k: 'party', id: party.id }, icon: 'guest', voice: 'voice.greet' }, chef: waitChef('tut.waitOrder') };
  return { step: 'greet', waiter: { target: null, icon: 'guest', voice: '' }, chef: waitChef('tut.waitOrder') };
}
