import { load, save } from '../store';
import type { AppStart } from '../terminal';

type Grid = number[];
const N = 4;
const UNDO_DEPTH = 20;
const BG: Record<number, string> = {
  0: '#1a1714', 2: '#2a2622', 4: '#3a332c', 8: '#5a4220', 16: '#7a541b', 32: '#9a6416',
  64: '#c27c12', 128: '#e08e14', 256: '#f5a524', 512: '#f5b544', 1024: '#f7c665', 2048: '#ffd98a',
};

/** Slide one row toward index 0, merging equal neighbours once. */
function slide(row: number[]) {
  const vals = row.filter(Boolean);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      i++;
    } else out.push(vals[i]);
  }
  while (out.length < N) out.push(0);
  return { out, gained };
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
  let gained = 0;
  for (const l of lines(dir)) {
    const r = slide(l.map((i) => g[i]));
    r.out.forEach((v, k) => (next[l[k]] = v));
    gained += r.gained;
  }
  return { next, gained, moved: next.some((v, i) => v !== g[i]) };
}

const canMove = (g: Grid) => ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].some((d) => move(g, d).moved);

function spawn(g: Grid) {
  const free = g.flatMap((v, i) => (v ? [] : [i]));
  if (free.length) g[free[Math.floor(Math.random() * free.length)]] = Math.random() < 0.9 ? 2 : 4;
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

  function reset() {
    grid = Array(N * N).fill(0);
    spawn(grid);
    spawn(grid);
    score = 0;
    history = [];
    won = false;
    render('');
  }

  function render(msg: string) {
    boardEl.innerHTML = grid
      .map((v) => `<span style="background:${BG[v] ?? '#ffe3a8'};color:${v >= 128 ? '#1a1408' : '#f2eee8'}">${v || ''}</span>`)
      .join('');
    boardEl.setAttribute('aria-label', `2048 board: ${grid.map((v) => v || '·').join(' ')}`);
    el('score').textContent = `score ${score.toLocaleString('en-US')}`;
    el('best').textContent = `best ${best ? best.toLocaleString('en-US') : '—'}`;
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
        if (prev) ({ grid, score } = prev);
        render(prev ? 'undone' : 'nothing to undo');
        return true;
      }
      if (!k.startsWith('Arrow')) return false;
      const { next, gained, moved } = move(grid, k);
      if (!moved) return true;
      history.push({ grid, score });
      if (history.length > UNDO_DEPTH) history.shift();
      grid = next;
      score += gained;
      spawn(grid);
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
