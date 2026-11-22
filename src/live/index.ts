import { $ } from '../lib/dom';
import { initBoard } from './board';
import { mountGuestbook } from './guestbook';
import { initPresence } from './presence';

/** Entry for every live feature. Loaded only when VITE_LIVE=true; failures stay quiet. */
export function initLive() {
  initPresence().catch(() => {});
  if ($('#leaderboard')) initBoard();
  const wall = $<HTMLElement>('#guestbook');
  if (wall) mountGuestbook(wall).catch(() => (wall.hidden = true));
}
