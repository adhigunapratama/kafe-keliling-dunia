import type { ComponentChildren, JSX } from 'preact';
import { ICONS, foodIcon, type IconName } from './icons';
import { flagSvg } from '../data/flags';
import { audio } from '../engine/audio';

export function Svg({ html, class: cls = '' }: { html: string; class?: string }) {
  return <span class={`svg ${cls}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
export function Icon({ name, class: cls = '' }: { name: IconName; class?: string }) {
  return <Svg html={ICONS[name]} class={`icon ${cls}`} />;
}
export function FoodIcon({ name, class: cls = '' }: { name: string; class?: string }) {
  return <Svg html={foodIcon(name)} class={`food-icon ${cls}`} />;
}
export function Flag({ code, class: cls = '' }: { code: string; class?: string }) {
  return <Svg html={flagSvg(code)} class={`flag ${cls}`} />;
}

type BtnColor = 'red' | 'blue' | 'yellow' | 'white' | 'green';

/** Tombol "chunky": sudut membulat, bayangan solid di bawah, turun 4px saat ditekan. */
export function Btn(props: { color?: BtnColor; onClick?: () => void; children?: ComponentChildren; class?: string; disabled?: boolean; big?: boolean; title?: string; sound?: boolean } & Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const { color = 'white', onClick, children, class: cls = '', disabled, big, sound = true, ...rest } = props;
  return (
    <button
      {...rest}
      class={`btn btn-${color} ${big ? 'btn-big' : ''} ${cls}`}
      disabled={disabled}
      onClick={() => { if (sound) audio.play('click'); onClick?.(); }}
    >
      {children}
    </button>
  );
}

export function IconBtn(props: { icon: IconName; onClick?: () => void; color?: BtnColor; class?: string; label: string; disabled?: boolean }) {
  return (
    <Btn color={props.color ?? 'white'} class={`btn-icon ${props.class ?? ''}`} onClick={props.onClick} aria-label={props.label} title={props.label} disabled={props.disabled}>
      <Icon name={props.icon} />
    </Btn>
  );
}

export function Stars({ n, max = 3, class: cls = '' }: { n: number; max?: number; class?: string }) {
  return (
    <span class={`stars ${cls}`}>
      {Array.from({ length: max }, (_, i) => <Icon key={i} name={i < n ? 'star' : 'starEmpty'} class={i < n ? 'on' : ''} />)}
    </span>
  );
}

export function Modal({ children, onClose, class: cls = '' }: { children: ComponentChildren; onClose?: () => void; class?: string }) {
  return (
    <div class="modal-back" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div class={`modal ${cls}`}>{children}</div>
    </div>
  );
}

export function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label class="toggle-row">
      <span class="toggle-text"><b>{label}</b>{sub && <small>{sub}</small>}</span>
      <button type="button" role="switch" aria-checked={on} class={`toggle ${on ? 'on' : ''}`} onClick={() => { audio.play('click'); onChange(!on); }}>
        <span />
      </button>
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div class="segmented">
      {options.map((o) => (
        <button type="button" key={o.v} class={o.v === value ? 'on' : ''} onClick={() => { audio.play('click'); onChange(o.v); }}>{o.label}</button>
      ))}
    </div>
  );
}
