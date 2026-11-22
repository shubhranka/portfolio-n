import { badges, stones, type BadgeId, type StoneId } from '../extras';
import { clearAll, load, save } from './store';

export type Badge = (typeof badges)[number];

const BADGE = 'badge';
const STONE = 'stone';
const RESET = 'progressreset';

export const earned = () => new Set(load<BadgeId[]>('badges', []));
export const found = () => new Set(load<StoneId[]>('stones', []));

/** Unlock a badge once; listeners (the toast) hear about new ones only. */
export function award(id: BadgeId) {
  const have = earned();
  if (have.has(id)) return;
  have.add(id);
  save('badges', [...have]);
  window.dispatchEvent(new CustomEvent(BADGE, { detail: badges.find((b) => b.id === id) }));
}

/** Record a hidden stone. Finding all five also earns "Stone collector". */
export function findStone(id: StoneId) {
  const have = found();
  if (have.has(id)) return;
  have.add(id);
  save('stones', [...have]);
  window.dispatchEvent(new CustomEvent(STONE, { detail: { id, count: have.size } }));
  if (have.size === stones.length) award('stones');
}

/** Called on every page load. */
export function checkNightOwl(now = new Date()) {
  if (now.getHours() < 5) award('night-owl');
}

/** Case studies read to the end; all of them earns "Read every case study". */
export function markRead(slug: string, all: string[]) {
  const read = new Set(load<string[]>('read', []));
  read.add(slug);
  save('read', [...read]);
  if (all.every((s) => read.has(s))) award('reader');
}

export function resetProgress() {
  clearAll();
  window.dispatchEvent(new Event(RESET));
}

export const onBadge = (fn: (badge: Badge) => void) => window.addEventListener(BADGE, (e) => fn((e as CustomEvent<Badge>).detail));
export const onStone = (fn: (s: { id: StoneId; count: number }) => void) =>
  window.addEventListener(STONE, (e) => fn((e as CustomEvent<{ id: StoneId; count: number }>).detail));
export const onReset = (fn: () => void) => window.addEventListener(RESET, fn);
