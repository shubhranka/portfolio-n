import { limits, liveCopy, playPage } from '../extras';
import { esc } from '../lib/dom';
import { load, save } from '../lib/store';
import { bests, type Game } from '../lib/scores';
import { setExtra, setSource, type Row } from '../games/leaderboard';
import { submit, supabase } from './client';

const t = liveCopy.board;
const TOP = 10;
let online = false;

/** Swap the /play leaderboard to global scores, with a "submit my best" form. */
export function initBoard() {
  setSource(async (game) => {
    const { data, error } = await supabase()
      .from('scores')
      .select('nickname, value, label, created_at')
      .eq('game', game)
      .order('value', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(TOP);
    online = !error && !!data;
    if (error || !data) {
      // Fall back to this browser's bests if the service is unreachable.
      return { rows: bests(game).map((s) => ({ ...s, name: 'You', mine: true })), note: playPage.board.localNote };
    }
    const mine = load<string>('nickname', '');
    const rows: Row[] = data.map((r) => ({ name: r.nickname, value: r.value, label: r.label, at: Date.parse(r.created_at), mine: !!mine && r.nickname === mine }));
    return { rows, note: t.note };
  });

  setExtra((game: Game, host: HTMLElement) => {
    const best = bests(game)[0];
    if (!online) return;
    if (!best) {
      host.innerHTML = `<p class="game-hint">${esc(t.none)}</p>`;
      return;
    }
    host.innerHTML = `
      <form class="board-form">
        <label class="sr-only" for="nick-${game}">${esc(t.nickname)}</label>
        <input id="nick-${game}" name="nickname" required maxlength="${limits.nickname}" autocomplete="nickname" placeholder="${esc(t.nickname)}" value="${esc(load('nickname', ''))}" />
        <button class="btn btn-sm" type="submit">${esc(t.submit)} · ${esc(best.label)}</button>
        <span class="board-msg" role="status"></span>
      </form>`;
    const form = host.querySelector('form')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nickname = (form.elements.namedItem('nickname') as HTMLInputElement).value.trim();
      const msg = form.querySelector<HTMLElement>('.board-msg')!;
      const btn = form.querySelector('button')!;
      btn.disabled = true;
      try {
        const accuracy = game === 'typing' ? Number(/(\d+)%/.exec(best.label)?.[1] ?? 100) : undefined;
        await submit({ kind: 'score', game, nickname, value: best.value, accuracy });
        save('nickname', nickname);
        msg.textContent = t.sent;
      } catch {
        msg.textContent = liveCopy.wall.error;
        btn.disabled = false;
      }
    });
  });
}
