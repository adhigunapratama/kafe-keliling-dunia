import { useEffect } from 'preact/hooks';

/** Jaga layar tetap menyala selama bermain (bila didukung; iOS 16.4+, Chrome Android). */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let dead = false;
    const req = async () => { try { lock = await navigator.wakeLock.request('screen'); if (dead) lock.release(); } catch { /* ditolak */ } };
    const onVis = () => { if (!document.hidden) void req(); };
    void req();
    document.addEventListener('visibilitychange', onVis);
    return () => { dead = true; document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => {}); };
  }, [active]);
}
