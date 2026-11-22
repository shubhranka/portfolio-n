import { playPage } from '../extras';
import { esc } from '../lib/dom';
import { bests, onScore, type Game, type Score } from '../lib/scores';

const t = playPage.board;
const TABS: { id: Game; label: string }[] = [
  { id: 'sql', label: playPage.sql.title },
  { id: 'typing', label: playPage.typing.title },
];

export function ago(at: number) {
  const s = Math.max(0, (Date.now() - at) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export interface Row extends Score {
  name: string;
  mine?: boolean;
}

/** Where rows come from. Local bests now; the live module swaps in global ones. */
let source: (game: Game) => Promise<{ rows: Row[]; note: string }> = async (game) => ({
  rows: bests(game).map((s) => ({ ...s, name: 'You', mine: true })),
  note: t.localNote,
});
export const setSource = (fn: typeof source) => {
  source = fn;
  refresh?.();
};
let refresh: (() => void) | undefined;

/** Tabbed personal-best lists for the SQL game and the typing race. */
export function mount(card: HTMLElement) {
  const body = card.querySelector<HTMLElement>('.game-body')!;
  let game: Game = 'sql';

  card.querySelector('.game-meta')!.innerHTML = `
    <div class="tabs" role="tablist" aria-label="Game">
      ${TABS.map((tab) => `<button type="button" role="tab" id="tab-${tab.id}" aria-controls="board-panel" data-tab="${tab.id}">${esc(tab.label)}</button>`).join('')}
    </div>`;
  body.innerHTML = `<div id="board-panel" role="tabpanel"></div>`;
  const panel = body.firstElementChild as HTMLElement;
  const tabs = [...card.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

  async function render() {
    tabs.forEach((b) => {
      const on = b.dataset.tab === game;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${game}`);
    const shown = game;
    const { rows, note } = await source(game);
    if (shown !== game) return;
    panel.innerHTML = `
      ${
        rows.length
          ? `<ol class="board">${rows
              .map(
                (r, i) => `
            <li${r.mine ? ' class="is-mine"' : ''}>
              <span class="rank">${i + 1}</span><span class="who">${esc(r.name)}</span>
              <b>${esc(r.label)}</b><span class="when">${ago(r.at)}</span>
            </li>`,
              )
              .join('')}</ol>`
          : `<p class="board-empty">${esc(t.empty)}</p>`
      }
      <p class="game-hint">${esc(note)}</p>`;
  }

  card.querySelector('.tabs')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
    if (!b) return;
    game = b.dataset.tab as Game;
    void render();
  });
  card.querySelector('.tabs')!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight') return;
    const i = TABS.findIndex((x) => x.id === game);
    game = TABS[(i + (k === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length].id;
    void render().then(() => tabs.find((b) => b.dataset.tab === game)?.focus());
  });

  refresh = () => void render();
  onScore(() => void render());
  void render();
}
