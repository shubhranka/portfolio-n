import { caseStudyHref, profile, projects } from '../data';
import { esc, plain } from './dom';
import { award, resetProgress } from './progress';
import { getTheme, toggleTheme } from './theme';

type Cmd = { desc: string; run: (args: string[]) => string | void; hidden?: boolean };

/** A full-keyboard program inside the terminal (the games). */
export interface TermApp {
  /** Return true when the key was used. */
  key: (key: string) => boolean;
  stop: () => void;
  /** Extra keys for the on-screen pad on touch screens, e.g. ['u']. */
  touch?: string[];
}
export type AppStart = (host: HTMLElement, exit: (msg?: string) => void) => TermApp;

const apps: Record<string, () => Promise<{ start: AppStart }>> = {
  snake: () => import('./termgames/snake'),
  '2048': () => import('./termgames/g2048'),
  ttt: () => import('./termgames/ttt'),
};
const PAD: Record<string, string> = { ArrowUp: '↑', ArrowLeft: '←', ArrowDown: '↓', ArrowRight: '→', Enter: '⏎', u: 'undo', q: 'quit' };

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));
const acc = (s: string) => `<span class="term-acc">${esc(s)}</span>`;
const mail = `<a href="mailto:${profile.email}">${profile.email}</a>`;

export function initTerminal() {
  const root = document.createElement('div');
  root.className = 'term-root';
  root.innerHTML = `
    <div class="term-backdrop" data-close></div>
    <div class="term-frame">
      <div class="term" role="dialog" aria-modal="true" aria-label="Terminal">
        <div class="term-bar">
          <div class="term-dots" aria-hidden="true"><i></i><i></i><i></i></div>
          <span class="term-title">shubhranka@portfolio: ~</span>
          <button class="term-close" type="button" data-close aria-label="Close terminal">esc</button>
        </div>
        <div class="term-body" aria-live="polite">
          <div class="term-log"></div>
          <label class="term-input-row">
            <span aria-hidden="true"><span class="term-ok">~</span> <span class="term-acc">$</span></span>
            <span class="sr-only">Command</span>
            <input class="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" />
          </label>
        </div>
      </div>
    </div>
    <span class="term-hint">~ to toggle · ↑ for history · tab to complete</span>`;
  document.body.append(root);

  const body = root.querySelector<HTMLElement>('.term-body')!;
  const log = root.querySelector<HTMLElement>('.term-log')!;
  const input = root.querySelector<HTMLInputElement>('.term-input')!;
  const inputRow = root.querySelector<HTMLElement>('.term-input-row')!;
  const promptEl = inputRow.querySelector<HTMLElement>('span[aria-hidden]')!;
  const promptHtml = promptEl.innerHTML;
  let app: { run: TermApp; host: HTMLElement; exit: (msg?: string) => void } | null = null;
  /** Set while a fake password prompt is up: we only count keys, never keep them. */
  let secret: { n: number; done: () => void } | null = null;
  const history: string[] = [];
  let hIndex = 0;
  let lastFocus: Element | null = null;
  let greeted = false;

  const print = (html: string, cls = 'term-out') => {
    const el = document.createElement('div');
    el.className = `term-line ${cls}`;
    el.innerHTML = html;
    log.append(el);
  };

  const commands: Record<string, Cmd> = {
    help: {
      desc: 'list commands',
      run: () =>
        Object.entries(commands)
          .filter(([, c]) => !c.hidden)
          .map(([k, c]) => `${pad(k, 11)}${esc(c.desc)}`)
          .join('\n'),
    },
    about: { desc: 'who I am, in one paragraph', run: () => esc(plain(profile.about)) },
    projects: {
      desc: "things I've built",
      run: () => {
        const w = Math.max(...projects.map((p) => p.slug.length)) + 2;
        return (
          projects
            .map((p) => `${acc(p.slug)}${' '.repeat(w - p.slug.length)}${esc(plain(p.oneLiner))}`)
            .join('\n') + `\n\n<span class="term-dim">type </span>${acc('open <name>')}<span class="term-dim"> for a case study or repo</span>`
        );
      },
    },
    contact: {
      desc: 'how to reach me',
      run: () =>
        [
          `${pad('email', 12)}${mail}`,
          `${pad('github', 12)}<a href="${profile.github}" target="_blank" rel="noopener">${profile.github.replace('https://', '')}</a>`,
          `${pad('linkedin', 12)}<a href="${esc(profile.linkedin.href)}">${profile.linkedin.placeholder ? '[add your LinkedIn]' : esc(profile.linkedin.href)}</a>`,
          ...profile.elsewhere.map(
            (l) => `${pad(l.label.toLowerCase(), 12)}<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.href.replace(/^https:\/\/(www\.)?/, ''))}</a>`,
          ),
          `${pad('résumé', 12)}<a href="${esc(profile.resume.href)}" target="_blank" rel="noopener">${esc(profile.resume.href)}</a>`,
        ].join('\n'),
    },
    hire: {
      desc: 'the short version',
      run: () =>
        `${esc(profile.meta.split('·')[0].trim())} · ${esc(profile.role)} · ${profile.openToWork ? 'open to work' : 'not looking right now'} → ${mail}`,
    },
    theme: {
      desc: 'toggle light / dark',
      run: () => {
        toggleTheme();
        return `theme → ${acc(getTheme())}`;
      },
    },
    open: {
      desc: 'open a project, e.g. open zusk',
      run: ([name]) => {
        const p = projects.find((x) => x.slug === name?.toLowerCase());
        if (!p) return `usage: open &lt;name&gt; · try ${acc('projects')}`;
        const href = p.caseStudy ? caseStudyHref(p.slug) : p.repo;
        setTimeout(() => (p.caseStudy ? (location.href = href) : window.open(href, '_blank', 'noopener')), 250);
        return `opening ${acc(p.name)}…`;
      },
    },
    play: {
      desc: 'play snake · 2048 · ttt',
      run: ([name]) => {
        const g = name?.toLowerCase();
        if (!g || !apps[g]) return `usage: play ${Object.keys(apps).map(acc).join(' | ')}`;
        void runApp(g);
      },
    },
    sudo: {
      desc: 'try sudo hire-me',
      hidden: true,
      run: ([what]) => {
        if (what !== 'hire-me') return `sudo: ${esc(what ?? '')}: command not found · try ${acc('sudo hire-me')}`;
        askSecret('[sudo] password for recruiter: ', () =>
          print(
            `<span class="term-ok">✓</span> Permission granted. Opening a calm conversation…\n→ ${mail}`,
          ),
        );
      },
    },
    rm: {
      desc: 'rm -rf boredom',
      hidden: true,
      run: (args) =>
        args.join(' ') === '-rf boredom'
          ? `removed 'boredom' · try ${acc('play snake')}, ${acc('play 2048')} or ${acc('play ttt')}`
          : `rm: refusing to remove anything here. Try ${acc('rm -rf boredom')}.`,
    },
    'reset-progress': {
      desc: 'forget stones, badges and scores',
      hidden: true,
      run: ([flag]) => {
        if (flag !== '--yes') return `This forgets stones, badges and scores in this browser. Run ${acc('reset-progress --yes')} to confirm.`;
        resetProgress();
        return 'progress reset.';
      },
    },
    clear: { desc: 'clear the screen', run: () => void (log.innerHTML = '') },
    exit: { desc: 'close the terminal', run: () => void close() },
  };

  function run(line: string) {
    const trimmed = line.trim();
    print(`<span class="term-ok">~</span> <span class="term-acc">$</span> ${esc(trimmed)}`, 'term-cmd');
    if (!trimmed) return;
    history.push(trimmed);
    hIndex = history.length;
    const [name, ...args] = trimmed.split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    if (!cmd) {
      print(`command not found: ${esc(name)} · type ${acc('help')}`);
      return;
    }
    const out = cmd.run(args);
    if (out) print(out);
  }

  const scrollEnd = () => requestAnimationFrame(() => (body.scrollTop = body.scrollHeight));

  async function runApp(name: string) {
    const host = document.createElement('div');
    host.className = 'term-app';
    host.tabIndex = -1;
    log.append(host);
    inputRow.hidden = true;
    const { start } = await apps[name]();
    const exit = (msg?: string) => {
      if (app?.host !== host) return;
      app.run.stop();
      app = null;
      host.querySelector('.term-pad')?.remove();
      host.classList.add('term-app-done');
      host.removeAttribute('tabindex');
      inputRow.hidden = false;
      if (msg) print(msg);
      if (isOpen()) input.focus();
      scrollEnd();
    };
    const run = start(host, exit);
    app = { run, host, exit };
    // On-screen keys for touch screens; swipes work on the board too.
    const pad = document.createElement('div');
    pad.className = 'term-pad';
    pad.innerHTML = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', ...(run.touch ?? []), 'q']
      .map((k) => `<button type="button" data-key="${k}" aria-label="${k === 'q' ? 'quit' : k}">${PAD[k] ?? k}</button>`)
      .join('');
    host.append(pad);
    host.focus();
    scrollEnd();
  }

  function askSecret(prompt: string, done: () => void) {
    secret = { n: 0, done };
    promptEl.textContent = prompt;
    input.setAttribute('aria-label', 'Password (any text works, nothing is stored)');
  }

  function endSecret() {
    if (!secret) return;
    const { n, done } = secret;
    secret = null;
    input.value = '';
    print(`${esc(promptEl.textContent ?? '')}${'*'.repeat(n)}`, 'term-cmd');
    promptEl.innerHTML = promptHtml;
    input.removeAttribute('aria-label');
    done();
  }

  function complete() {
    const v = input.value;
    const [first, second] = v.split(/\s+/);
    if (second !== undefined && first === 'play') {
      const hits = Object.keys(apps).filter((g) => g.startsWith(second.toLowerCase()));
      if (hits.length === 1) input.value = `play ${hits[0]}`;
      else if (hits.length > 1) print(hits.join('  '));
      return;
    }
    const pool = second !== undefined && first === 'open' ? projects.map((p) => p.slug) : Object.keys(commands);
    const stem = second !== undefined ? second : first;
    const hits = pool.filter((c) => c.startsWith(stem.toLowerCase()));
    if (hits.length === 1) input.value = second !== undefined ? `${first} ${hits[0]} ` : `${hits[0]} `;
    else if (hits.length > 1) {
      print(`<span class="term-ok">~</span> <span class="term-acc">$</span> ${esc(v)}`, 'term-cmd');
      print(hits.join('  '));
    }
  }

  // The password prompt only counts keystrokes; the input itself stays empty.
  input.addEventListener('beforeinput', (e) => {
    if (!secret) return;
    e.preventDefault();
    if (e.inputType.startsWith('insert') && e.data) secret.n += e.data.length;
    else if (e.inputType.startsWith('delete')) secret.n = Math.max(0, secret.n - 1);
  });

  input.addEventListener('keydown', (e) => {
    if (secret) {
      if (e.key === 'Enter') endSecret();
      else if (e.key === 'c' && e.ctrlKey) {
        secret = null;
        promptEl.innerHTML = promptHtml;
        print('^C', 'term-dim');
      }
      return;
    }
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] ?? '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      log.innerHTML = '';
    } else return;
    requestAnimationFrame(() => (body.scrollTop = body.scrollHeight));
  });

  const isOpen = () => root.classList.contains('open');

  function open() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.classList.add('open');
    document.body.style.overflow = 'hidden';
    award('terminal');
    if (!greeted) {
      greeted = true;
      print(`Welcome. Type ${acc('help')} to see what you can do here.`, 'term-dim');
    }
    input.focus();
  }

  function close() {
    if (!isOpen()) return;
    app?.exit();
    root.classList.remove('open');
    document.body.style.overflow = '';
    (lastFocus as HTMLElement | null)?.focus?.();
  }

  const toggle = () => (isOpen() ? close() : open());

  root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
  body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const padKey = t.closest<HTMLElement>('[data-key]')?.dataset.key;
    if (padKey && app) {
      app.run.key(padKey);
      app.host.focus();
      return;
    }
    if (!t.closest('a') && !getSelection()?.toString()) (app ? app.host : input).focus();
  });

  // Games take the keyboard while they run.
  log.addEventListener('keydown', (e) => {
    if (!app || e.target !== app.host || e.metaKey || e.ctrlKey || e.altKey) return;
    if (app.run.key(e.key)) e.preventDefault();
  });

  // Swipes on a game board become arrow keys.
  let swipe: { x: number; y: number } | null = null;
  log.addEventListener('pointerdown', (e) => {
    if (app && e.pointerType !== 'mouse' && app.host.contains(e.target as Node)) swipe = { x: e.clientX, y: e.clientY };
  });
  log.addEventListener('pointerup', (e) => {
    if (!swipe || !app) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    app.run.key(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : dy > 0 ? 'ArrowDown' : 'ArrowUp');
  });

  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    const typing = t !== input && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '~' || (e.key === '`' && !isOpen())) {
      e.preventDefault();
      toggle();
    } else if (e.key === 'Escape' && isOpen()) {
      close();
    } else if (e.key === 'Tab' && isOpen()) {
      // keep focus inside the dialog
      e.preventDefault();
      (app ? app.host : input).focus();
    }
  });

  document.querySelectorAll('[data-terminal]').forEach((b) => b.addEventListener('click', open));

  return { open, close, toggle };
}
