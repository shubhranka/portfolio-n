import { badges, secretsCopy as t, stones } from '../extras';
import { $$, esc } from './dom';
import { checkNightOwl, earned, findStone, found, onBadge, onReset, onStone, resetProgress } from './progress';
import { toast } from './toast';

let shelf: HTMLDialogElement | null = null;

function renderCounters(fresh?: string) {
  const have = found();
  $$('[data-stones]').forEach((b) => {
    b.hidden = have.size === 0;
    b.setAttribute('aria-label', `${t.counterLabel}: ${have.size} of ${stones.length} — open your progress`);
    b.innerHTML = stones.map((s) => `<i class="${have.has(s.id) ? 'on' : ''}${s.id === fresh ? ' fresh' : ''}"></i>`).join('');
  });
  const n = earned().size;
  $$('[data-badge-count]').forEach((b) => (b.textContent = `Badges earned: ${n} / ${badges.length}`));
}

function shelfHtml() {
  const have = found();
  const got = earned();
  return `
    <div class="shelf-head">
      <h2 id="shelf-h">${esc(t.shelfTitle)}</h2>
      <button type="button" class="shelf-x" data-close aria-label="Close">×</button>
    </div>
    <section>
      <h3>${esc(t.stonesTitle)} <span>${have.size} / ${stones.length}</span></h3>
      <ul class="shelf-stones">
        ${stones
          .map((s) => `<li class="${have.has(s.id) ? 'on' : ''}"><i aria-hidden="true"></i>${esc(have.has(s.id) ? s.where : t.hidden)}</li>`)
          .join('')}
      </ul>
      ${have.size === stones.length ? `<p class="shelf-unlocked">${esc(t.unlocked)} <a href="/secret/">${esc(t.openSecret)}</a></p>` : ''}
    </section>
    <section>
      <h3>${esc(t.badgesTitle)} <span>${got.size} / ${badges.length}</span></h3>
      <ul class="shelf-badges">
        ${badges
          .map(
            (b) => `
          <li class="${got.has(b.id) ? 'on' : ''}">
            <span class="toast-icon" aria-hidden="true">${esc(b.icon)}</span>
            <div><b>${esc(b.name)}</b><span>${esc(b.how)}</span></div>
            <span class="sr-only">${got.has(b.id) ? 'earned' : 'not yet earned'}</span>
          </li>`,
          )
          .join('')}
      </ul>
    </section>
    <div class="shelf-foot" role="status">
      <button type="button" class="btn btn-sm" data-reset>${esc(t.reset)}</button>
    </div>`;
}

function openShelf() {
  if (!shelf) {
    shelf = document.createElement('dialog');
    shelf.className = 'shelf';
    shelf.setAttribute('aria-labelledby', 'shelf-h');
    document.body.append(shelf);
    shelf.addEventListener('click', (e) => {
      const el = e.target as HTMLElement;
      if (el === shelf || el.closest('[data-close]')) shelf!.close();
      else if (el.closest('[data-reset]')) {
        shelf!.querySelector('.shelf-foot')!.innerHTML = `
          <span>${esc(t.resetConfirm)}</span>
          <button type="button" class="btn btn-sm btn-danger" data-reset-yes>Reset</button>
          <button type="button" class="btn btn-sm" data-reset-no>Cancel</button>`;
        shelf!.querySelector<HTMLElement>('[data-reset-no]')!.focus();
      } else if (el.closest('[data-reset-yes]')) {
        resetProgress();
        shelf!.innerHTML = shelfHtml();
        shelf!.querySelector('.shelf-foot')!.insertAdjacentHTML('afterbegin', `<span>${esc(t.resetDone)}</span>`);
        shelf!.querySelector<HTMLElement>('[data-close]')!.focus();
      } else if (el.closest('[data-reset-no]')) {
        shelf!.innerHTML = shelfHtml();
        shelf!.querySelector<HTMLElement>('[data-reset]')!.focus();
      }
    });
  }
  shelf.innerHTML = shelfHtml();
  shelf.showModal();
}

/** Stones, badges and their UI — shared by every page. */
export function initSecrets() {
  renderCounters();
  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (el.closest('[data-shelf]')) openShelf();
    const stone = el.closest<HTMLElement>('[data-stone="footer"]');
    if (stone) {
      stone.classList.add('stone-glow');
      findStone('footer');
    }
  });

  onStone(({ id, count }) => {
    renderCounters(id);
    toast({ icon: '◆', label: t.stoneToast, title: `${count} / ${stones.length}`, body: count === stones.length ? t.unlocked : undefined });
  });
  onBadge((b) => {
    renderCounters();
    toast({ icon: b.icon, label: t.badgeToast, title: b.name, body: b.how });
  });
  onReset(() => renderCounters());

  checkNightOwl();
}
