import { useEffect, useState } from 'preact/hooks';
import type { ComponentProps, FunctionComponent } from 'preact';
import type { WorldMapScreen as WMS } from './WorldMapScreen';

type Props = ComponentProps<typeof WMS>;
let mod: Promise<{ WorldMapScreen: FunctionComponent<Props> }> | null = null;

/** Peta Dunia dimuat hanya saat dibuka (mengecilkan unduhan awal). */
export function LazyWorldMap(props: Props) {
  const [C, setC] = useState<FunctionComponent<Props> | null>(null);
  useEffect(() => {
    if (!mod) mod = import('./WorldMapScreen') as Promise<{ WorldMapScreen: FunctionComponent<Props> }>;
    let dead = false;
    mod.then((m) => { if (!dead) setC(() => m.WorldMapScreen); });
    return () => { dead = true; };
  }, []);
  return C ? <C {...props} /> : <div class="screen map-screen"><div class="lobby-card"><div class="spinner" /></div></div>;
}
