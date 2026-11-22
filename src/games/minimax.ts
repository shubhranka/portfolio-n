/** Tic-tac-toe rules and an unbeatable minimax player. The human is X, the AI is O. */
export type Cell = 'X' | 'O' | null;
export type Result = 'X' | 'O' | 'draw' | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const emptyBoard = (): Cell[] => Array(9).fill(null);

export function winLine(b: Cell[]) {
  return LINES.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]) ?? null;
}

export function result(b: Cell[]): Result {
  const line = winLine(b);
  if (line) return b[line[0]];
  return b.every(Boolean) ? 'draw' : null;
}

/** Score from O's point of view; faster wins and slower losses score better. */
function score(b: Cell[], turn: 'X' | 'O', depth: number): number {
  const r = result(b);
  if (r === 'O') return 10 - depth;
  if (r === 'X') return depth - 10;
  if (r === 'draw') return 0;
  let best = turn === 'O' ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = turn;
    const s = score(b, turn === 'O' ? 'X' : 'O', depth + 1);
    b[i] = null;
    best = turn === 'O' ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

/** The AI's move, or -1 when the game is over. Ties go to a random best move. */
export function aiMove(board: Cell[]) {
  if (result(board)) return -1;
  const b = board.slice();
  let best = -Infinity;
  let moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = 'O';
    const s = score(b, 'X', 1);
    b[i] = null;
    if (s > best) [best, moves] = [s, [i]];
    else if (s === best) moves.push(i);
  }
  return moves[Math.floor(Math.random() * moves.length)];
}
