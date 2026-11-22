import { useEffect, useState } from 'preact/hooks';
import type { TutStep } from '../game/tutorial';
import { TABLE_COLORS, type TableColor } from '../data/palette';
import { Icon } from './components';
import type { IconName } from './icons';

/** Kartu petunjuk tutorial di layar Koki (teks pendek, Kakak sudah bisa membaca). */
export function TutorialCard({ step, text }: { step: TutStep; text: string }) {
  const [hideDone, setHideDone] = useState(false);
  useEffect(() => { if (step !== 'done') { setHideDone(false); return; } const id = setTimeout(() => setHideDone(true), 4500); return () => clearTimeout(id); }, [step]);
  if (!text || hideDone) return null;
  return (
    <div class={`tut-card ${step === 'done' ? 'done' : ''}`} key={step}>
      <Icon name={step === 'done' ? 'star' : 'chefHat'} />
      <span>{text}</span>
    </div>
  );
}

/** Kartu petunjuk bergambar di layar Pelayan (tanpa tulisan). */
export function TutorialIcon({ step, icon }: { step: TutStep; icon: string }) {
  const [hideDone, setHideDone] = useState(false);
  useEffect(() => { if (step !== 'done') { setHideDone(false); return; } const id = setTimeout(() => setHideDone(true), 4500); return () => clearTimeout(id); }, [step]);
  if (hideDone) return null;
  if (step === 'done') return <div class="tut-icon done" key="done"><Icon name="star" /><Icon name="heart" /><Icon name="star" /></div>;
  if (icon.startsWith('table:')) {
    const c = icon.slice(6) as TableColor;
    return <div class="tut-icon" key={step}><span class="tut-color" style={{ background: TABLE_COLORS[c].css }} /></div>;
  }
  return <div class="tut-icon" key={step}><Icon name={icon as IconName} /></div>;
}
