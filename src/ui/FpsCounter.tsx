import { fpsStore } from './fps';
import { settings } from './settings';
import { useStore } from './store';

/** Penghitung fps kecil (nyalakan di Pengaturan) + draw call & segitiga. */
export function FpsCounter() {
  const s = useStore(settings);
  const f = useStore(fpsStore);
  if (!s.showFps) return null;
  return (
    <div class={`fps ${f.fps < 30 ? 'bad' : f.fps < 50 ? 'mid' : ''}`}>
      <b>{f.fps}</b> fps<small>{f.calls} dc · {(f.tris / 1000).toFixed(0)}k ▲</small><small>res ×{f.dpr.toFixed(2)}</small>
    </div>
  );
}
