import { playPage } from '../extras';
import { env } from '../lib/env';
import { award } from '../lib/progress';
import { load, save } from '../lib/store';
import { aiMove, emptyBoard, result, winLine } from './minimax';

const t = playPage.ttt;

/** Unbeatable tic-tac-toe. The tally survives reloads. */
export function mount(card: HTMLElement) {
  const meta = card.querySelector<HTMLElement>('.game-meta')!;
  const body = card.querySelector<HTMLElement>('.game-body')!;
  const tally = load('ttt', { x: 0, o: 0, d: 0 });
  let board = emptyBoard();
  let thinking = false;

  body.innerHTML = `
    <div class="ttt" role="group" aria-label="Tic-tac-toe board. Arrow keys move between squares.">
      ${Array.from({ length: 9 }, (_, i) => `<button type="button" class="ttt-cell" data-i="${i}"></button>`).join('')}
    </div>
    <div class="game-foot">
      <span class="ttt-status" role="status"></span>
      <button class="btn btn-sm" type="button" data-act="new">New game</button>
    </div>`;

  const cells = [...body.querySelectorAll<HTMLButtonElement>('.ttt-cell')];
  const status = body.querySelector<HTMLElement>('.ttt-status')!;

  function render() {
    const r = result(board);
    const line = winLine(board) ?? [];
    cells.forEach((c, i) => {
      const v = board[i];
      c.textContent = v ?? '';
      c.className = `ttt-cell${v ? ` is-${v.toLowerCase()}` : ''}${line.includes(i) ? ' is-win' : ''}`;
      c.setAttribute('aria-label', `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, ${v ?? 'empty'}`);
      c.setAttribute('aria-disabled', String(!!v || !!r || thinking));
    });
    status.textContent = thinking ? t.status.thinking : r === 'draw' ? t.status.draw : r ? t.status[r === 'X' ? 'x' : 'o'] : t.status.turn;
    status.className = `ttt-status${r === 'draw' ? ' is-good' : ''}`;
    meta.textContent = `You ${tally.x} · Draws ${tally.d} · AI ${tally.o}`;
  }

  function end() {
    const r = result(board);
    if (!r) return false;
    if (r === 'X') tally.x++;
    else if (r === 'O') tally.o++;
    else {
      tally.d++;
      award('worthy');
    }
    save('ttt', tally);
    return true;
  }

  function play(i: number) {
    if (board[i] || result(board) || thinking) return;
    board[i] = 'X';
    if (end()) return render();
    thinking = true;
    render();
    window.setTimeout(
      () => {
        board[aiMove(board)] = 'O';
        thinking = false;
        end();
        render();
      },
      env.reducedMotion ? 0 : 320,
    );
  }

  body.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const cell = el.closest<HTMLElement>('.ttt-cell');
    if (cell) play(Number(cell.dataset.i));
    else if (el.closest('[data-act="new"]')) {
      board = emptyBoard();
      render();
      cells[4].focus();
    }
  });

  // Arrow keys move between cells.
  body.querySelector('.ttt')!.addEventListener('keydown', (e) => {
    const ke = e as KeyboardEvent;
    const i = cells.indexOf(document.activeElement as HTMLButtonElement);
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[ke.key];
    if (i < 0 || d === undefined) return;
    ke.preventDefault();
    cells[(i + d + 9) % 9].focus();
  });

  render();
}
