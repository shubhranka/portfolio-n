import { load, save } from '../store';
import type { AppStart } from '../terminal';

type Grid = number[];
const N = 4;
const UNDO_DEPTH = 20;
const BG: Record<number, string> = {
  0: '#1a1714', 2: '#2a2622', 4: '#3a332c', 8: '#5a4220', 16: '#7a541b', 32: '#9a6416',
  64: '#c27c12', 128: '#e08e14', 256: '#f5a524', 512: '#f5b544', 1024: '#f7c665', 2048: '#ffd98a',
};

/** Slide one row toward index 0, merging equal neighbours once. `to[k]` is where row[k] ends up. */
function slide(row: number[]) {
  const out: number[] = [];
  const to = row.map(() => -1);
  let gained = 0;
  let open = -1; // index in `row` of the last placed tile, while it can still merge
  for (let k = 0; k < row.length; k++) {
    if (!row[k]) continue;
    if (open >= 0 && row[open] === row[k]) {
      out[out.length - 1] *= 2;
      gained += out[out.length - 1];
      open = -1;
    } else {
      out.push(row[k]);
      open = k;
    }
    to[k] = out.length - 1;
  }
  while (out.length < N) out.push(0);
  return { out, to, gained };
}

/** Indices of each line, ordered so index 0 is the edge tiles move toward. */
function lines(dir: string) {
  const ls: number[][] = [];
  for (let a = 0; a < N; a++) {
    const l: number[] = [];
    for (let b = 0; b < N; b++) {
      if (dir === 'ArrowLeft') l.push(a * N + b);
      else if (dir === 'ArrowRight') l.push(a * N + (N - 1 - b));
      else if (dir === 'ArrowUp') l.push(b * N + a);
      else l.push((N - 1 - b) * N + a);
    }
    ls.push(l);
  }
  return ls;
}

function move(g: Grid, dir: string) {
  const next = g.slice();
  const dest = g.map(() => -1);
  let gained = 0;
  for (const l of lines(dir)) {
    const r = slide(l.map((i) => g[i]));
    r.out.forEach((v, k) => (next[l[k]] = v));
    r.to.forEach((t, k) => t >= 0 && (dest[l[k]] = l[t]));
    gained += r.gained;
  }
  return { next, dest, gained, moved: next.some((v, i) => v !== g[i]) };
}

const canMove = (g: Grid) => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some((d) => move(g, d).moved);

/** Drop a 2 or 4 on a free cell; returns that cell, or -1 when the board is full. */
function spawn(g: Grid) {
  const free = g.flatMap((v, i) => (v ? [] : [i]));
  if (!free.length) return -1;
  const at = free[Math.floor(Math.random() * free.length)];
  g[at] = Math.random() < 0.9 ? 2 : 4;
  return at;
}

export const start: AppStart = (host, exit) => {
  host.innerHTML = `
    <div class="tg-2048">
      <div class="g2048 term-board" role="img" aria-label="2048 board"></div>
      <div class="tg-side">
        <span data-score></span>
        <span class="term-dim" data-best></span>
        <span class="term-dim">arrows · u undo · q quit</span>
        <span class="term-acc" role="status" data-msg></span>
      </div>
    </div>`;
  const boardEl = host.querySelector<HTMLElement>('.g2048')!;
  const el = (k: string) => host.querySelector<HTMLElement>(`[data-${k}]`)!;
  let grid: Grid;
  let score: number;
  let history: { grid: Grid; score: number }[];
  let won: boolean;
  let best = load('2048-best', 0);
  // One element per tile, so a move can slide it rather than redraw the board.
  let tiles: (HTMLElement | null)[] = [];
  boardEl.innerHTML = '<span class="g2048-cell"></span>'.repeat(N * N);

  function tile(cell: number, v: number, anim?: 'new' | 'merged') {
    const t = document.createElement('span');
    t.className = anim ? `g2048-tile g2048-${anim}` : 'g2048-tile';
    t.textContent = String(v);
    t.style.background = BG[v] ?? '#ffe3a8';
    t.style.color = v >= 128 ? '#1a1408' : '#f2eee8';
    place(t, cell);
    boardEl.append(t);
    return t;
  }

  function place(t: HTMLElement, cell: number) {
    t.style.setProperty('--r', String(Math.floor(cell / N)));
    t.style.setProperty('--c', String(cell % N));
  }

  /** Redraw every tile in place, for a new game or an undo. */
  function rebuild(anim?: 'new') {
    boardEl.querySelectorAll('.g2048-tile').forEach((t) => t.remove());
    tiles = grid.map((v, i) => (v ? tile(i, v, anim) : null));
  }

  function reset() {
    grid = Array(N * N).fill(0);
    spawn(grid);
    spawn(grid);
    score = 0;
    history = [];
    won = false;
    rebuild('new');
    render('');
  }

  function render(msg: string) {
    boardEl.setAttribute('aria-label', `2048 board: ${grid.map((v) => v || '·').join(' ')}`);
    el('score').textContent = `score ${score.toLocaleString('en-US')}`;
    el('best').textContent = `best ${best ? best.toLocaleString('en-US') : 'none yet'}`;
    el('msg').textContent = msg;
  }

  reset();
  return {
    touch: ['u'],
    key(k) {
      if (k === 'q' || k === 'Q') {
        exit(`2048 · score ${score.toLocaleString('en-US')} · best ${best.toLocaleString('en-US')}`);
        return true;
      }
      if (k === 'r' || k === 'R') {
        reset();
        return true;
      }
      if (k === 'u' || k === 'U') {
        const prev = history.pop();
        if (prev) {
          ({ grid, score } = prev);
          rebuild();
        }
        render(prev ? 'undone' : 'nothing to undo');
        return true;
      }
      if (!k.startsWith('Arrow')) return false;
      const { next, dest, gained, moved } = move(grid, k);
      if (!moved) return true;
      history.push({ grid, score });
      if (history.length > UNDO_DEPTH) history.shift();
      grid = next;
      score += gained;
      // Slide each tile to its new cell. The two halves of a merge slide onto
      // the same cell, then the doubled tile pops in on top and they go.
      boardEl.querySelectorAll('.g2048-gone').forEach((t) => t.remove());
      const landed: (HTMLElement | null)[] = Array(N * N).fill(null);
      tiles.forEach((t, i) => {
        if (!t) return;
        const d = dest[i];
        place(t, d);
        const there = landed[d];
        if (!there) return void (landed[d] = t);
        for (const half of [there, t]) {
          half.classList.add('g2048-gone');
          setTimeout(() => half.remove(), 150);
        }
        landed[d] = tile(d, grid[d], 'merged');
      });
      tiles = landed;
      const at = spawn(grid);
      if (at >= 0) tiles[at] = tile(at, grid[at], 'new');
      if (score > best) save('2048-best', (best = score));
      let msg = '';
      if (!won && grid.includes(2048)) {
        won = true;
        msg = '2048! keep going, or q to quit';
      } else if (!canMove(grid)) msg = 'no moves left · u to undo · r to restart';
      render(msg);
      return true;
    },
    stop: () => {},
  };
};
