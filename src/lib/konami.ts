import { secretsCopy } from '../extras';
import { award } from './progress';
import { toast } from './toast';

const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const FONT = 'https://fonts.googleapis.com/css2?family=VT323&display=swap';

function setCrt(on: boolean) {
  const root = document.documentElement;
  if (on && !document.querySelector(`link[href="${FONT}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT;
    document.head.append(link);
  }
  if (on) root.dataset.crt = '';
  else delete root.dataset.crt;
}

/** ↑↑↓↓←→←→BA turns the site into an amber CRT until Esc. */
export function initKonami() {
  let at = 0;
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || document.querySelector('.term-root.open')) return;
    if (e.key === 'Escape' && 'crt' in document.documentElement.dataset) {
      setCrt(false);
      return;
    }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    // A third ↑ still leaves you two ↑ into the code.
    at = k === CODE[at] ? at + 1 : k === CODE[0] ? (at === 2 ? 2 : 1) : 0;
    if (at === CODE.length) {
      at = 0;
      setCrt(true);
      toast({ icon: '▚', label: 'Konami', title: secretsCopy.crtHint });
      award('retro');
    }
  });
}
