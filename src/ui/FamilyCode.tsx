import { useState } from 'preact/hooks';
import { t } from '../data/i18n';
import { saveStore } from '../game/progress';
import { backupState, restoreFromCode, normalizeFamilyCode } from '../net/backup';
import { roomServerUrl } from '../net/client';
import { useStore } from './store';
import { Btn, Icon } from './components';

/** Bagian Kode Keluarga di Pengaturan: tampilkan, salin, dan pulihkan. */
export function FamilyCodeSection() {
  const p = useStore(saveStore);
  const b = useStore(backupState);
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!roomServerUrl()) return null;

  const copy = async () => {
    if (!p.familyCode) return;
    try { await navigator.clipboard.writeText(p.familyCode); } catch {
      const ta = document.createElement('textarea'); ta.value = p.familyCode; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* abaikan */ } ta.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  const doRestore = async (code: string) => {
    setBusy(true); setMsg(null);
    try { await restoreFromCode(code); setMsg({ ok: true, text: t('family.restored') }); setInput(''); }
    catch (e) { const k = (e as Error).message; setMsg({ ok: false, text: t(k === 'notfound' ? 'family.notfound' : k === 'invalid' ? 'family.invalid' : 'family.network') }); }
    setBusy(false); setConfirm(null);
  };

  return (
    <div class="family">
      <div class="family-head"><Icon name="lock" /><b>{t('family.title')}</b>
        <span class={`family-status ${b.status}`}>{b.status === 'saved' ? t('family.saved') : b.status === 'saving' ? t('family.saving') : b.status === 'offline' ? t('family.offline') : ''}</span>
      </div>
      {p.familyCode ? (
        <>
          <div class="family-code-row"><code class="family-code">{p.familyCode}</code><Btn color="yellow" onClick={copy}>{copied ? t('family.copied') : t('family.copy')}</Btn></div>
          <small class="note">{t('family.info')}</small>
        </>
      ) : <small class="note">{t('family.none')}</small>}
      <div class="family-restore">
        <small>{t('family.restoreHint')}</small>
        <div class="family-code-row">
          <input class="family-input" value={input} placeholder="KAFE-XXXX-XXXX" maxLength={16} autoCapitalize="characters" spellcheck={false}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)} />
          <Btn disabled={busy || input.trim().length < 8} onClick={() => setConfirm(normalizeFamilyCode(input))}>{t('family.restore')}</Btn>
        </div>
        {confirm && (
          <div class="family-confirm">
            <span>{t('family.restoreConfirm', { code: confirm })}</span>
            <div class="row"><Btn color="red" disabled={busy} onClick={() => doRestore(confirm)}>{t('common.yes')}</Btn><Btn onClick={() => setConfirm(null)}>{t('common.no')}</Btn></div>
          </div>
        )}
        {msg && <span class={`family-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
