import { playPage, sqlQuestions as qs } from '../extras';
import { esc } from '../lib/dom';
import { award, findStone } from '../lib/progress';
import { record } from '../lib/scores';

const t = playPage.sql;
/** "Would Zusk run this?": allow or block each statement under read-only mode. */
export function mount(card: HTMLElement) {
  const meta = card.querySelector<HTMLElement>('.game-meta')!;
  const body = card.querySelector<HTMLElement>('.game-body')!;
  let qi = 0;
  let score = 0;
  let answered: boolean | null = null;

  function render() {
    meta.textContent = qi < qs.length ? `${qi + 1} / ${qs.length} · score ${score}` : `done · score ${score}`;
    if (qi >= qs.length) {
      const perfect = score === qs.length;
      body.innerHTML = `
        <div class="sql-end">
          <b>${score} / ${qs.length}</b>
          <p>${esc(perfect ? t.perfect : t.good)}</p>
          <button class="btn btn-primary btn-sm" type="button" data-act="restart">Play again</button>
        </div>`;
      return;
    }
    const q = qs[qi];
    const correct = answered !== null && answered === q.ok;
    body.innerHTML = `
      <pre class="sql-code" aria-label="SQL statement ${qi + 1} of ${qs.length}"><code>${esc(q.sql)}</code></pre>
      ${
        answered === null
          ? `<div class="sql-actions">
              <button class="btn sql-allow" type="button" data-act="allow"><kbd>A</kbd>Allow</button>
              <button class="btn sql-block" type="button" data-act="block"><kbd>B</kbd>Block</button>
            </div>`
          : `<div class="sql-verdict ${correct ? 'is-right' : 'is-wrong'}" role="status">
              <b>${correct ? 'Correct.' : 'Not quite.'}</b> ${q.ok ? 'Zusk runs it.' : 'Blocked.'} ${esc(q.why)}
            </div>
            <button class="btn btn-sm" type="button" data-act="next">${qi + 1 < qs.length ? 'Next statement' : 'See score'} <kbd>N</kbd></button>`
      }
      <span class="game-hint">${esc(t.keys)}</span>`;
  }

  function act(a: string) {
    if ((a === 'allow' || a === 'block') && answered === null && qi < qs.length) {
      answered = a === 'allow';
      if (answered === qs[qi].ok) score++;
    } else if (a === 'next' && answered !== null) {
      qi++;
      answered = null;
      if (qi === qs.length) finish();
    } else if (a === 'restart') {
      qi = score = 0;
      answered = null;
    } else return;
    render();
    // Keep focus inside the card so the letter keys keep working.
    body.querySelector<HTMLElement>('[data-act]')?.focus();
  }

  function finish() {
    record('sql', score, `${score} / ${qs.length}`);
    if (score === qs.length) {
      award('read-only');
      findStone('sql');
    }
  }

  body.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (a) act(a);
  });
  // Letter keys only while focus is in this card, so they never fight other games.
  card.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const a = { a: 'allow', b: 'block', n: 'next' }[e.key.toLowerCase()];
    if (a) {
      e.preventDefault();
      act(a);
    }
  });

  render();
}
