import { playPage, typingSnippets, typistBar } from '../extras';
import { esc } from '../lib/dom';
import { award } from '../lib/progress';
import { bests, record } from '../lib/scores';

const t = playPage.typing;

/** Type a real snippet; live WPM and accuracy, personal best kept locally. */
export function mount(card: HTMLElement) {
  const meta = card.querySelector<HTMLElement>('.game-meta')!;
  const body = card.querySelector<HTMLElement>('.game-body')!;
  let si = Math.floor(Math.random() * typingSnippets.length);
  let started = 0;
  let keys = 0;
  let errors = 0;
  let timer = 0;
  let done = false;

  body.innerHTML = `
    <pre class="type-code" aria-hidden="true"></pre>
    <label class="sr-only" for="type-input">Type the snippet</label>
    <textarea id="type-input" class="type-input" rows="2" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" placeholder="Start typing here…"></textarea>
    <div class="stats">
      <div><span>Your speed</span><b data-s="wpm">0 wpm</b></div>
      <div><span>Accuracy</span><b data-s="acc">100%</b></div>
      <div class="stat-best"><span>Your best</span><b data-s="best"></b></div>
    </div>
    <div class="game-foot">
      <span class="type-msg" role="status"></span>
      <button class="btn btn-sm" type="button" data-act="next">New snippet</button>
    </div>`;

  const code = body.querySelector<HTMLElement>('.type-code')!;
  const input = body.querySelector<HTMLTextAreaElement>('.type-input')!;
  const stat = (k: string) => body.querySelector<HTMLElement>(`[data-s="${k}"]`)!;
  const msg = body.querySelector<HTMLElement>('.type-msg')!;
  const text = () => typingSnippets[si].code;

  /** Net speed: correctly placed characters only. The live readout waits a second to settle. */
  const wpm = (final = false) => {
    const mins = (performance.now() - started) / 60000;
    if (!started || mins <= 0 || (!final && mins < 1 / 60)) return 0;
    const src = text();
    let right = 0;
    for (let i = 0; i < input.value.length; i++) if (input.value[i] === src[i]) right++;
    return Math.round(right / 5 / mins);
  };
  const accuracy = () => (keys ? Math.max(0, Math.round(((keys - errors) / keys) * 100)) : 100);

  function paint() {
    const src = text();
    const typed = input.value;
    let html = '';
    for (let i = 0; i < src.length; i++) {
      const ch = src[i] === '\n' ? '↵\n' : src[i];
      const cls = i < typed.length ? (typed[i] === src[i] ? 'ok' : 'bad') : i === typed.length ? 'cur' : '';
      html += cls ? `<span class="${cls}">${esc(ch)}</span>` : esc(ch);
    }
    code.innerHTML = html;
    stat('wpm').textContent = `${wpm()} wpm`;
    stat('acc').textContent = `${accuracy()}%`;
  }

  function showBest() {
    const b = bests('typing')[0];
    stat('best').textContent = b ? b.label : 'none yet';
  }

  function reset(next = false) {
    if (next) si = (si + 1) % typingSnippets.length;
    clearInterval(timer);
    started = keys = errors = 0;
    done = false;
    input.value = '';
    input.readOnly = false;
    input.rows = text().split('\n').length + 1;
    meta.textContent = `${t.note} ${typingSnippets[si].repo}`;
    msg.textContent = '';
    paint();
  }

  input.addEventListener('beforeinput', (e) => {
    if (done) return;
    const src = text();
    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
      e.preventDefault();
      return;
    }
    const add = e.inputType === 'insertLineBreak' ? '\n' : e.data;
    if (!add) return;
    if (!started) {
      started = performance.now();
      timer = window.setInterval(paint, 250);
    }
    const at = input.value.length;
    for (let i = 0; i < add.length; i++) {
      keys++;
      if (src[at + i] !== add[i]) errors++;
    }
  });

  input.addEventListener('input', () => {
    if (done) return;
    const src = text();
    // After a line break, skip the snippet's indentation for the typist.
    if (input.value.endsWith('\n') && src.startsWith(input.value)) {
      const indent = /^[ \t]*/.exec(src.slice(input.value.length))![0];
      input.value += indent;
    }
    paint();
    if (input.value === src) finish();
  });

  function finish() {
    done = true;
    input.readOnly = true;
    clearInterval(timer);
    paint();
    const w = wpm(true);
    const a = accuracy();
    stat('wpm').textContent = `${w} wpm`;
    const best = record('typing', w, `${w} wpm · ${a}%`);
    msg.textContent = `${w} wpm at ${a}% accuracy.${best ? ' New personal best!' : ''}`;
    if (w >= typistBar.wpm && a >= typistBar.accuracy) award('typist');
    showBest();
  }

  body.querySelector('[data-act="next"]')!.addEventListener('click', () => {
    reset(true);
    input.focus();
  });

  reset();
  showBest();
}
