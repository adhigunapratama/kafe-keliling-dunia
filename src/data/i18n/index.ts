import { id, type I18nKey } from './id';
import { en } from './en';

export type Lang = 'id' | 'en';
export type { I18nKey };

const DICTS: Record<Lang, Record<I18nKey, string>> = { id, en };
let current: Lang = 'id';
const listeners = new Set<() => void>();

export function setLang(l: Lang) {
  current = l;
  if (typeof document !== 'undefined') document.documentElement.lang = l;
  listeners.forEach((f) => f());
}
export function getLang(): Lang { return current; }
export function onLangChange(f: () => void) { listeners.add(f); return () => listeners.delete(f); }

/** Terjemahkan kunci, dengan isian {nama}. Kunci dinamis (mis. `menu.${id}`) diterima sebagai string. */
export function t(key: I18nKey | (string & {}), params?: Record<string, string | number>): string {
  const dict = DICTS[current];
  let s = (dict as Record<string, string>)[key] ?? (id as Record<string, string>)[key] ?? key;
  if (params) for (const k in params) s = s.split(`{${k}}`).join(String(params[k]));
  return s;
}

export function hasKey(key: string): boolean { return key in id; }
