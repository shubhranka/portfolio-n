import { badges, type BadgeId } from '../extras';
import { load, save } from './store';

const EVENT = 'badge';

export const earned = () => new Set(load<BadgeId[]>('badges', []));

/** Unlock a badge once; listeners (the toast) hear about new ones only. */
export function award(id: BadgeId) {
  const have = earned();
  if (have.has(id)) return;
  have.add(id);
  save('badges', [...have]);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: badges.find((b) => b.id === id) }));
}

export const onBadge = (fn: (badge: (typeof badges)[number]) => void) =>
  window.addEventListener(EVENT, (e) => fn((e as CustomEvent<(typeof badges)[number]>).detail));
