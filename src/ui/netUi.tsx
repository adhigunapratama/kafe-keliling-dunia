import type { NetState } from '../net/client';
import { t } from '../data/i18n';
import { Btn, Icon } from './components';

/** Pita kecil saat sambungan terputus / menyambung lagi. */
export function NetBanner({ net }: { net: NetState }) {
  if (net.status === 'open' || net.status === 'connecting' || net.status === 'closed') return null;
  if (net.status === 'reconnecting') return <div class="net-banner"><span class="spinner small" /> {t('net.reconnecting')}</div>;
  if (net.error === 'version') return <VersionModal />;
  const msg = net.error === 'replaced' ? t('net.replaced') : net.error === 'expired' ? t('net.expired') : net.error === 'notfound' ? t('join.notfound') : t('net.reconnecting');
  return <div class="net-banner err"><Icon name="sad" /> {msg}</div>;
}

export function VersionModal() {
  return (
    <div class="modal-back">
      <div class="modal version-modal">
        <Icon name="replay" class="big-icon" />
        <h2>{t('net.update')}</h2>
        <p>{t('net.updateInfo')}</p>
        <Btn color="yellow" big onClick={() => location.reload()}><Icon name="replay" /> {t('net.reload')}</Btn>
      </div>
    </div>
  );
}

/** Layar tunggu ramah saat saudara terputus: "Menunggu Adik/Kakak…". */
export function WaitingOverlay({ text, icon = 'tray' }: { text: string; icon?: 'tray' | 'chefHat' }) {
  return (
    <div class="waiting-overlay">
      <div class="waiting-card">
        <Icon name={icon} class="big-icon bob" />
        <span class="dots big"><i /><i /><i /></span>
        <b>{text}</b>
      </div>
    </div>
  );
}
