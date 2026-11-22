import { HAIR_COLORS, SHIRT_COLORS, SKIN_TONES } from '../data/palette';
import { t } from '../data/i18n';
import { settings } from './settings';
import { useStore } from './store';
import { IconBtn } from './components';
import { audio } from '../engine/audio';

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** Gambar tokoh kecil dari warna yang dipilih. */
function Preview({ skin, hair, shirt, role }: { skin: number; hair: number; shirt: number; role: 'chef' | 'waiter' }) {
  return (
    <svg class="look-preview" viewBox="0 0 64 72" aria-hidden="true">
      <path d="M14 70c0-14 8-22 18-22s18 8 18 22z" fill={hex(shirt)} stroke="#2B2340" stroke-width="3" />
      {role === 'waiter' && <path d="M24 52h16v18H24z" fill="#1F6FD1" stroke="#2B2340" stroke-width="2.5" />}
      <circle cx="32" cy="30" r="17" fill={hex(skin)} stroke="#2B2340" stroke-width="3" />
      <path d="M15 28c0-10 8-16 17-16s17 6 17 16c-5-4-11-6-17-6s-12 2-17 6z" fill={hex(hair)} stroke="#2B2340" stroke-width="3" />
      {role === 'chef' && <path d="M18 14c-5 0-6-8 0-9 1-5 9-6 14-3 5-3 13-2 14 3 6 1 5 9 0 9z" fill="#fff" stroke="#2B2340" stroke-width="3" />}
      <circle cx="26" cy="31" r="2.2" fill="#2B2340" /><circle cx="38" cy="31" r="2.2" fill="#2B2340" />
      <circle cx="22" cy="36" r="3" fill="#F29B8F" opacity=".7" /><circle cx="42" cy="36" r="3" fill="#F29B8F" opacity=".7" />
    </svg>
  );
}

/** Pilih warna kulit, rambut, dan baju tokoh sendiri (tersimpan di perangkat ini). */
export function LookPicker({ role, onClose, showText = true }: { role: 'chef' | 'waiter'; onClose: () => void; showText?: boolean }) {
  const s = useStore(settings);
  const key = role === 'chef' ? 'chefLook' : 'waiterLook';
  const look = s[key];
  const set = (p: Partial<typeof look>) => { audio.play('click'); settings.update({ [key]: { ...look, ...p } } as never); };
  const Row = ({ colors, cur, onPick }: { colors: number[]; cur: number | undefined; onPick: (c: number) => void }) => (
    <div class="look-row">{colors.map((c) => <button key={c} class={`swatch ${cur === c ? 'on' : ''}`} style={{ background: hex(c) }} onClick={() => onPick(c)} aria-label={hex(c)} />)}</div>
  );
  return (
    <div class="modal-back" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class={`modal look-modal look-${role}`}>
        <IconBtn icon="check" label={t('common.done')} onClick={onClose} class="look-done" color="green" />
        {showText && <h2>{t('look.title')}</h2>}
        <div class="look-body">
          <Preview skin={look.skin} hair={look.hair ?? 0x2b2340} shirt={look.shirt} role={role} />
          <div class="look-rows">
            <Row colors={SKIN_TONES} cur={look.skin} onPick={(c) => set({ skin: c })} />
            <Row colors={HAIR_COLORS} cur={look.hair} onPick={(c) => set({ hair: c })} />
            <Row colors={[0xffffff, ...SHIRT_COLORS]} cur={look.shirt} onPick={(c) => set({ shirt: c })} />
          </div>
        </div>
      </div>
    </div>
  );
}
