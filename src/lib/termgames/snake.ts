import { load, save } from '../store';
import type { AppStart } from '../terminal';

type P = { x: number; y: number };

const TICK_MS = 115;
/** Every Nth food is amber — eating it finds a hidden stone. */
const STONE_EVERY = 5;
const C = { bg: '#1a1714', grid: '#201c18', food: '#e6e0d7', stone: '#f5a524', head: '#ffe3a8' };

type Listener = () => void;
const stoneListeners: Listener[] = [];
export const onStone = (fn: Listener) => stoneListeners.push(fn);

export const start: AppStart = (host, exit) => {
  const cols = host.clientWidth < 520 ? 16 : 24;
  const rows = 12;
  host.innerHTML = `
    <div class="tg-head"><span>SNAKE · arrows to move · q to quit</span><span class="term-acc" data-score></span></div>
    <canvas class="term-board" role="img" aria-label="Snake board"></canvas>
    <div class="tg-foot term-dim" role="status"></div>`;
  const canvas = host.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const scoreEl = host.querySelector<HTMLElement>('[data-score]')!;
  const foot = host.querySelector<HTMLElement>('.tg-foot')!;
  const cell = Math.min(22, Math.floor(host.clientWidth / cols));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = cols * cell * dpr;
  canvas.height = rows * cell * dpr;
  canvas.style.width = `${cols * cell}px`;
  ctx.scale(dpr, dpr);

  let snake: P[];
  let dir: P;
  let queue: P[];
  let food: P;
  let eaten: number;
  let score: number;
  let timer = 0;
  let state: 'ready' | 'run' | 'over';
  let best = load('snake-best', 0);

  const isStone = () => (eaten + 1) % STONE_EVERY === 0;

  function placeFood() {
    const free: P[] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    food = free[Math.floor(Math.random() * free.length)];
  }

  function reset() {
    const y = Math.floor(rows / 2);
    snake = [3, 2, 1, 0].map((x) => ({ x: x + 2, y }));
    dir = { x: 1, y: 0 };
    queue = [];
    eaten = score = 0;
    state = 'ready';
    placeFood();
    foot.textContent = 'press an arrow key to start · eat the ◆';
    draw();
  }

  function rect(p: P, color: string, inset = 1, r = 3) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(p.x * cell + inset, p.y * cell + inset, cell - inset * 2, cell - inset * 2, r);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, cols * cell, rows * cell);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) rect({ x, y }, C.grid, 1, 2);
    if (isStone()) {
      ctx.shadowColor = C.stone;
      ctx.shadowBlur = 12;
      rect(food, C.stone, 3, cell);
      ctx.shadowBlur = 0;
    } else rect(food, C.food, 4, 2);
    snake.forEach((s, i) => rect(s, i === 0 ? C.head : `rgba(245,165,36,${Math.max(0.35, 0.95 - i * 0.04).toFixed(2)})`));
    scoreEl.textContent = `score ${String(score).padStart(4, '0')}`;
  }

  function step() {
    const next = queue.shift();
    if (next) dir = next;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const hit = head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || snake.slice(0, -1).some((s) => s.x === head.x && s.y === head.y);
    if (hit) return gameOver();
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      if (isStone()) {
        stoneListeners.forEach((fn) => fn());
        foot.textContent = '◆ that one was amber — a hidden stone.';
      }
      eaten++;
      score += 10;
      if (snake.length === cols * rows) return gameOver();
      placeFood();
    } else snake.pop();
    draw();
  }

  function gameOver() {
    clearInterval(timer);
    state = 'over';
    const isBest = score > best;
    if (isBest) save('snake-best', (best = score));
    foot.textContent = `game over · score ${score}${isBest ? ' · new best!' : ` · best ${best}`} · r to retry · q to quit`;
    draw();
  }

  const DIRS: Record<string, P> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };

  reset();
  return {
    key(k) {
      if (k === 'q' || k === 'Q') {
        exit(`snake · score ${score} · best ${best}`);
        return true;
      }
      if ((k === 'r' || k === 'R') && state === 'over') {
        reset();
        return true;
      }
      const d = DIRS[k];
      if (!d) return false;
      if (state === 'over') return true;
      // Ignore reversing into yourself; queue turns so quick taps aren't lost.
      const last = queue[queue.length - 1] ?? dir;
      if (d.x !== -last.x || d.y !== -last.y) queue.push(d);
      if (queue.length > 3) queue.shift();
      if (state === 'ready') {
        state = 'run';
        foot.textContent = '';
        timer = window.setInterval(step, TICK_MS);
      }
      return true;
    },
    stop: () => clearInterval(timer),
  };
};
