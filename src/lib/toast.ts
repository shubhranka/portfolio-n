import { esc } from './dom';

const SHOW_MS = 4000;
const MAX = 3;
let stack: HTMLElement | null = null;

/**
 * Small notes in the bottom-right corner. They stack, leave after four
 * seconds, and ignore the pointer so they never get in the way.
 */
export function toast(o: { icon: string; label: string; title: string; body?: string }) {
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toasts';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.append(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${esc(o.icon)}</span>
    <div><span class="toast-label">${esc(o.label)}</span><b>${esc(o.title)}</b>${o.body ? `<span>${esc(o.body)}</span>` : ''}</div>`;
  stack.append(el);
  while (stack.children.length > MAX) stack.firstElementChild!.remove();
  window.setTimeout(() => {
    el.classList.add('out');
    window.setTimeout(() => el.remove(), 400);
  }, SHOW_MS);
}
