import { useEffect, useState } from 'preact/hooks';
import { onLangChange } from '../data/i18n';
import { TitleScreen } from './TitleScreen';
import { TestModeScreen } from './TestModeScreen';
import { FpsCounter } from './FpsCounter';
import { UpdateToast } from './pwa';

type Route = { name: 'title' } | { name: 'test'; level: number };

function initialRoute(): Route {
  const q = new URLSearchParams(location.search);
  if (q.has('test')) return { name: 'test', level: +(q.get('level') || 1) };
  return { name: 'title' };
}

export function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [, force] = useState(0);
  useEffect(() => onLangChange(() => force((x) => x + 1)), []);
  return (
    <>
      {route.name === 'title' && <TitleScreen onPlay={(level) => setRoute({ name: 'test', level })} />}
      {route.name === 'test' && (
        <TestModeScreen key={route.level} level={route.level} onExit={() => setRoute({ name: 'title' })} onLevel={(level) => setRoute({ name: 'test', level })} />
      )}
      <FpsCounter />
      <UpdateToast />
      <div class="rotate-hint" aria-hidden="true"><span>⟳</span></div>
    </>
  );
}
