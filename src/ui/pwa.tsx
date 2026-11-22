import { useEffect, useState } from 'preact/hooks';
import { t } from '../data/i18n';

/** Toast "Ada versi baru!" dari service worker (vite-plugin-pwa, mode prompt). */
export function UpdateToast() {
  const [update, setUpdate] = useState<null | (() => void)>(null);
  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    let cancelled = false;
    import('virtual:pwa-register').then(({ registerSW }) => {
      if (cancelled) return;
      const updateSW = registerSW({
        onNeedRefresh() { setUpdate(() => () => updateSW(true)); },
        onRegisteredSW(_url, reg) { if (reg) setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000); },
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (!update) return null;
  return <button class="update-toast" onClick={update}>{t('pwa.update')}</button>;
}
