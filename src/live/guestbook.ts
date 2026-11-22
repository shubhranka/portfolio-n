import { limits, liveColors, liveCopy } from '../extras';
import { esc } from '../lib/dom';
import { submit, supabase } from './client';

const t = liveCopy.wall;
const FONT = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=swap';

/** Approved notes as sticky notes, and a one-line form. New notes wait for approval. */
export async function mountGuestbook(host: HTMLElement) {
  if (!document.querySelector(`link[href="${FONT}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT;
    document.head.append(link);
  }
  // Read first: if the service is unreachable the section stays hidden.
  const { data, error } = await supabase().from('guestbook').select('name, message').order('created_at', { ascending: false }).limit(24);
  if (error) throw error;
  host.hidden = false;
  host.innerHTML = `
    <div class="section-head">
      <div><span class="eyebrow">${esc(t.eyebrow)}</span><h2 class="h2">${esc(t.title)}</h2></div>
    </div>
    <div class="game wall">
      <div class="game-head">
        <h3>${esc(t.heading)}</h3>
        <form class="wall-form">
          <label class="sr-only" for="gb-name">${esc(t.name)}</label>
          <input id="gb-name" name="name" required maxlength="${limits.name}" placeholder="${esc(t.name)}" autocomplete="off" />
          <label class="sr-only" for="gb-line">${esc(t.line)}</label>
          <input id="gb-line" name="message" required maxlength="${limits.line}" placeholder="${esc(t.line)}" autocomplete="off" />
          <button class="btn btn-primary btn-sm" type="submit">${esc(t.submit)}</button>
        </form>
      </div>
      <p class="wall-msg" role="status"></p>
      <ul class="notes"></ul>
    </div>`;

  const list = host.querySelector<HTMLElement>('.notes')!;
  const msg = host.querySelector<HTMLElement>('.wall-msg')!;
  const form = host.querySelector<HTMLFormElement>('.wall-form')!;

  list.innerHTML = data?.length
    ? data
        .map(
          (n, i) =>
            `<li style="--rot:${((i * 37) % 9) - 4}deg;background:${liveColors[i % liveColors.length]}"><p>${esc(n.message)}</p><span>${esc(n.name)}</span></li>`,
        )
        .join('')
    : `<li class="notes-empty">${esc(t.empty)}</li>`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector('button')!;
    btn.disabled = true;
    try {
      await submit({ kind: 'guestbook', name: String(fd.get('name')).trim(), message: String(fd.get('message')).trim() });
      form.reset();
      msg.textContent = t.sent;
    } catch {
      msg.textContent = t.error;
    }
    btn.disabled = false;
  });
}
