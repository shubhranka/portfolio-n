import { caseStudyHref, profile, projects } from '../data';
import { esc, plain } from './dom';
import { getTheme, toggleTheme } from './theme';

type Cmd = { desc: string; run: (args: string[]) => string | void };

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
          `${pad('email', 10)}${mail}`,
          `${pad('github', 10)}<a href="${profile.github}" target="_blank" rel="noopener">${profile.github.replace('https://', '')}</a>`,
          `${pad('linkedin', 10)}<a href="${esc(profile.linkedin.href)}">${profile.linkedin.placeholder ? '[add your LinkedIn]' : esc(profile.linkedin.href)}</a>`,
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
      desc: 'open a project — open zusk',
      run: ([name]) => {
        const p = projects.find((x) => x.slug === name?.toLowerCase());
        if (!p) return `usage: open &lt;name&gt; — try ${acc('projects')}`;
        const href = p.caseStudy ? caseStudyHref(p.slug) : p.repo;
        setTimeout(() => (p.caseStudy ? (location.href = href) : window.open(href, '_blank', 'noopener')), 250);
        return `opening ${acc(p.name)}…`;
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
      print(`command not found: ${esc(name)} — type ${acc('help')}`);
      return;
    }
    const out = cmd.run(args);
    if (out) print(out);
  }

  function complete() {
    const v = input.value;
    const [first, second] = v.split(/\s+/);
    const pool = second !== undefined && first === 'open' ? projects.map((p) => p.slug) : Object.keys(commands);
    const stem = second !== undefined ? second : first;
    const hits = pool.filter((c) => c.startsWith(stem.toLowerCase()));
    if (hits.length === 1) input.value = second !== undefined ? `${first} ${hits[0]} ` : `${hits[0]} `;
    else if (hits.length > 1) {
      print(`<span class="term-ok">~</span> <span class="term-acc">$</span> ${esc(v)}`, 'term-cmd');
      print(hits.join('  '));
    }
  }

  input.addEventListener('keydown', (e) => {
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
    if (!greeted) {
      greeted = true;
      print(`Welcome. Type ${acc('help')} to see what you can do here.`, 'term-dim');
    }
    input.focus();
  }

  function close() {
    if (!isOpen()) return;
    root.classList.remove('open');
    document.body.style.overflow = '';
    (lastFocus as HTMLElement | null)?.focus?.();
  }

  const toggle = () => (isOpen() ? close() : open());

  root.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', close));
  body.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('a') && !getSelection()?.toString()) input.focus();
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
      input.focus();
    }
  });

  document.querySelectorAll('[data-terminal]').forEach((b) => b.addEventListener('click', open));

  return { open, close, toggle };
}
