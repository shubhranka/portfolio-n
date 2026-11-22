import { playPage as t } from './extras';
import * as sql from './games/sql';
import * as ttt from './games/ttt';
import { $, $$, esc, fmt } from './lib/dom';
import { boot, footer, pageHeader } from './shared';

type Card = { id: 'sql' | 'ttt' | 'typing' | 'blob' | 'leaderboard'; title: string; intro?: string; wide?: boolean };

const cards: Card[] = [
  { id: 'sql', title: t.sql.title, intro: t.sql.intro },
  { id: 'ttt', title: t.ttt.title, intro: t.ttt.intro },
  { id: 'typing', title: t.typing.title, intro: t.typing.intro },
  { id: 'blob', title: t.blob.title, intro: t.blob.intro },
  { id: 'leaderboard', title: t.board.title, wide: true },
];

// The two games above the fold ship with the page so nothing shifts as they appear;
// the rest are their own chunks, fetched as their card nears the viewport.
const games: Record<Card['id'], () => Promise<{ mount: (card: HTMLElement) => unknown }>> = {
  sql: async () => sql,
  ttt: async () => ttt,
  typing: () => import('./games/typing'),
  blob: () => import('./games/blob'),
  leaderboard: () => import('./games/leaderboard'),
};

$('#app')!.innerHTML = `
  <a class="skip" href="#games">Skip to games</a>
  ${pageHeader('play')}
  <main id="games">
    <section class="wrap play-intro">
      <span class="eyebrow">${esc(t.eyebrow)}</span>
      <div class="play-title">
        <h1 class="h2">${fmt(t.title)}</h1>
        <div class="play-tools"><button class="kbd-hint badge-chip" type="button" data-shelf data-badge-count></button></div>
      </div>
    </section>
    <section class="wrap play-grid">
      ${cards
        .map(
          (c) => `
        <article class="game${c.wide ? ' game-wide' : ''}" id="${c.id}" aria-labelledby="${c.id}-h">
          <div class="game-head"><h2 id="${c.id}-h">${esc(c.title)}</h2><div class="game-meta"></div></div>
          ${c.intro ? `<p class="game-intro">${fmt(c.intro)}</p>` : ''}
          <div class="game-body"></div>
        </article>`,
        )
        .join('')}
    </section>
    <section class="wrap section" id="guestbook" hidden></section>
  </main>
  ${footer}`;

boot();

sql.mount($('#sql')!);
ttt.mount($('#ttt')!);

const load = (el: HTMLElement) => void games[el.id as Card['id']]().then((m) => m.mount(el));
const els = $$('.game').filter((el) => el.id !== 'sql' && el.id !== 'ttt');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        load(e.target as HTMLElement);
      }
    },
    { rootMargin: '300px 0px' },
  );
  els.forEach((el) => io.observe(el));
} else els.forEach(load);
