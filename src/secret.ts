import { profile } from './data';
import { secretNote as t, stones } from './extras';
import { $, esc, fmt, linkAttrs } from './lib/dom';
import { found } from './lib/progress';
import { boot, footer, pageHeader } from './shared';

const ph = (on?: boolean) => (on ? ' data-placeholder title="Placeholder: replace in src/data.ts"' : '');
const n = found().size;

// Only unlocked in this browser. The note is in the page source for anyone who looks.
$('#app')!.innerHTML = `
  ${pageHeader('')}
  <main class="wrap secret">
    ${
      n >= stones.length
        ? `<article class="secret-card">
            <span class="eyebrow">${esc(t.eyebrow)}</span>
            <h1>${fmt(t.title)}</h1>
            ${t.body.map((p) => `<p>${fmt(p)}</p>`).join('')}
            <div class="hero-actions">
              <a class="btn btn-primary" href="mailto:${esc(profile.email)}?subject=${encodeURIComponent('I found the stones')}">Email me</a>
              <a class="btn" ${linkAttrs(profile.resume.href)}${ph(profile.resume.placeholder)}>Download résumé</a>
            </div>
          </article>`
        : `<article class="secret-card is-locked">
            <span class="eyebrow">${n} / ${stones.length}</span>
            <h1>${esc(t.locked.replace('{n}', String(n)))}</h1>
            <p>${esc(t.lockedHint)}</p>
            <a class="btn" href="/">Back to the site</a>
          </article>`
    }
  </main>
  ${footer}`;

boot();
