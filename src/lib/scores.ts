import { load, save } from './store';

export type Game = 'sql' | 'typing';

export interface Score {
  /** What the list sorts by — higher is better. */
  value: number;
  label: string;
  at: number;
}

const KEEP = 5;
const EVENT = 'scorechange';

/** This browser's best runs for a game, best first. */
export const bests = (game: Game) => load<Score[]>(`scores:${game}`, []);

/** Adds a run; returns true when it's a new personal best. */
export function record(game: Game, value: number, label: string) {
  const list = bests(game);
  const isBest = !list.length || value > list[0].value;
  list.push({ value, label, at: Date.now() });
  list.sort((a, b) => b.value - a.value || a.at - b.at);
  save(`scores:${game}`, list.slice(0, KEEP));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: game }));
  return isBest;
}

export const onScore = (fn: (game: Game) => void) =>
  window.addEventListener(EVENT, (e) => fn((e as CustomEvent<Game>).detail));
