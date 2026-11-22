import { glossary } from '../extras';
import { esc } from '../lib/dom';

const norm = (s: string) =>
  s
    .trim()
    .replace(/^[\s"'“”‘’`(\[]+|[\s"'“”‘’`)\].,:;!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const lookup = new Map<string, (typeof glossary)[number]>();
for (const g of glossary) for (const k of [g.term, ...(g.also ?? [])]) lookup.set(norm(k), g);

/** Find the entry for a selection, allowing a trailing plural "s". */
export function explain(text: string) {
  const k = norm(text);
  if (!k || k.length > 40) return null;
  return lookup.get(k) ?? (k.endsWith('s') ? lookup.get(k.slice(0, -1)) : undefined) ?? null;
}

type Listener = (text: string, range: Range) => void;
const listeners: Listener[] = [];
/** Other features (e.g. hidden stones) can react to what the visitor highlights. */
export const onHighlight = (fn: Listener) => listeners.push(fn);

/**
 * Selecting a glossary word inside `root` shows a small explanation card
 * next to the selection. Dismissed by clicking elsewhere or pressing Esc.
 */
export function initGlossary(root: HTMLElement) {
  const card = document.createElement('div');
  card.className = 'gloss';
  card.setAttribute('role', 'status');
  card.hidden = true;
  document.body.append(card);

  let timer = 0;
  const hide = () => (card.hidden = true);

  function show(range: Range, entry: (typeof glossary)[number]) {
    card.innerHTML = `
      <div class="gloss-head"><b>${esc(entry.term)}</b><span>· in this page</span>
        <button type="button" class="gloss-x" aria-label="Close explanation">×</button></div>
      <p>${esc(entry.text)}</p>`;
    card.hidden = false;
    const r = range.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const left = Math.min(Math.max(16, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 16);
    const below = r.bottom + 10 + h < window.innerHeight || r.top < h + 10;
    card.style.left = `${left + scrollX}px`;
    card.style.top = `${(below ? r.bottom + 10 : r.top - h - 10) + scrollY}px`;
  }

  document.addEventListener('selectionchange', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const sel = getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer) || card.contains(range.commonAncestorContainer)) return;
      const text = sel.toString();
      listeners.forEach((fn) => fn(text, range));
      const entry = explain(text);
      if (entry) show(range, entry);
    }, 250);
  });

  card.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.gloss-x')) hide();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!card.hidden && !card.contains(e.target as Node)) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !card.hidden) hide();
  });
}
