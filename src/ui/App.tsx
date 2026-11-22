import { useEffect, useState } from 'preact/hooks';
import { onLangChange } from '../data/i18n';
import { TitleScreen } from './TitleScreen';
import { TestModeScreen } from './TestModeScreen';
import { HostFlow } from './HostFlow';
import { GuestFlow } from './GuestFlow';
import { WorldMapScreen } from './WorldMapScreen';
import { FpsCounter } from './FpsCounter';
import { UpdateToast } from './pwa';
import { recallRoom, roomServerUrl } from '../net/client';
import { loadProgress } from '../game/progress';

type Route = { name: 'title' } | { name: 'test'; level: number } | { name: 'host'; level: number } | { name: 'join' } | { name: 'map' };

function initialRoute(): Route {
  const q = new URLSearchParams(location.search);
  if (q.has('test')) return { name: 'test', level: +(q.get('level') || 1) };
  if (q.has('join')) return { name: 'join' };
  // dimuat ulang / aplikasi dibuka lagi saat masih di ruangan -> langsung masuk lagi
  if (roomServerUrl()) {
    if (recallRoom('guest')) return { name: 'join' };
    if (recallRoom('host')) return { name: 'host', level: loadProgress().last || 1 };
  }
  return { name: 'title' };
}

export function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [, force] = useState(0);
  useEffect(() => onLangChange(() => force((x) => x + 1)), []);
  return (
    <>
      {route.name === 'title' && (
        <TitleScreen onHost={(level) => setRoute({ name: 'host', level })} onJoin={() => setRoute({ name: 'join' })} onTest={(level) => setRoute({ name: 'test', level })} onMap={() => setRoute({ name: 'map' })} />
      )}
      {route.name === 'map' && (
        <WorldMapScreen onBack={() => setRoute({ name: 'title' })} onPlay={(level) => setRoute(roomServerUrl() ? { name: 'host', level } : { name: 'test', level })} />
      )}
      {route.name === 'host' && <HostFlow level={route.level} onExit={() => setRoute({ name: 'title' })} />}
      {route.name === 'join' && <GuestFlow onExit={() => setRoute({ name: 'title' })} />}
      {route.name === 'test' && (
        <TestModeScreen key={route.level} level={route.level} onExit={() => setRoute({ name: 'title' })} onLevel={(level) => setRoute({ name: 'test', level })} />
      )}
      <FpsCounter />
      <UpdateToast />
      <div class="rotate-hint" aria-hidden="true"><span>⟳</span></div>
    </>
  );
}
