import { aiMove, emptyBoard, result, winLine } from '../../games/minimax';
import { award } from '../progress';
import type { AppStart } from '../terminal';

/** Tic-tac-toe drawn in box characters; same minimax as /play. */
export const start: AppStart = (host, exit) => {
  host.innerHTML = `
    <div class="tg-head"><span>TTT · you are X · arrows + enter, or 1–9 · n new · q quit</span></div>
    <pre class="tg-ttt term-board" aria-hidden="true"></pre>
    <div class="tg-foot" role="status"></div>`;
  const pre = host.querySelector<HTMLElement>('pre')!;
  const foot = host.querySelector<HTMLElement>('.tg-foot')!;
  let board = emptyBoard();
  let cursor = 4;
  const tally = { x: 0, o: 0, d: 0 };

  function render() {
    const line = winLine(board) ?? [];
    const cell = (i: number) => {
      // Empty squares show a dot: in a mono font the AI's O and a digit 0 look alike.
      const v = board[i] ?? '·';
      const cls = [board[i] === 'O' ? 'term-acc' : board[i] ? '' : 'term-dim', line.includes(i) ? 'tg-win' : '', i === cursor && !result(board) ? 'tg-cur' : '']
        .filter(Boolean)
        .join(' ');
      return ` <span class="${cls}">${v}</span> `;
    };
    const row = (r: number) => [0, 1, 2].map((c) => cell(r * 3 + c)).join('│');
    pre.innerHTML = [row(0), '───┼───┼───', row(1), '───┼───┼───', row(2)].join('\n');
    const r = result(board);
    foot.innerHTML =
      r === 'draw'
        ? '<span class="term-ok">draw. a worthy opponent.</span> n for another'
        : r === 'O'
          ? '<span class="term-acc">the AI wins this one.</span> n for another'
          : r === 'X'
            ? 'you won? that should be impossible.'
            : `your move · square ${cursor + 1}`;
  }

  function place(i: number) {
    if (board[i] || result(board)) return;
    board[i] = 'X';
    if (!result(board)) board[aiMove(board)] = 'O';
    const r = result(board);
    if (r === 'draw') {
      tally.d++;
      award('worthy');
    } else if (r === 'O') tally.o++;
    else if (r === 'X') tally.x++;
    render();
  }

  render();
  return {
    touch: ['Enter'],
    key(k) {
      if (k === 'q' || k === 'Q') {
        exit(`ttt · you ${tally.x} · draws ${tally.d} · AI ${tally.o}`);
        return true;
      }
      if (k === 'n' || k === 'N') {
        board = emptyBoard();
        cursor = 4;
      } else if (/^[1-9]$/.test(k)) {
        cursor = Number(k) - 1;
        place(cursor);
      } else if (k === 'Enter' || k === ' ') place(cursor);
      else if (k === 'ArrowLeft') cursor = cursor % 3 ? cursor - 1 : cursor + 2;
      else if (k === 'ArrowRight') cursor = cursor % 3 === 2 ? cursor - 2 : cursor + 1;
      else if (k === 'ArrowUp') cursor = (cursor + 6) % 9;
      else if (k === 'ArrowDown') cursor = (cursor + 3) % 9;
      else return false;
      render();
      return true;
    },
    stop: () => {},
  };
};
