import { liveColors, liveCopy as t } from '../extras';
import { $$, esc } from '../lib/dom';
import { env } from '../lib/env';
import { load, save } from '../lib/store';
import { supabase } from './client';

const SEND_MS = 160; // ~6 updates a second, only while the pointer moves
const STALE_MS = 10_000;

type Cursor = { id: string; page: string; x: number; y: number; label: string; color: string };

async function city() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch('/api/geo/', { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok ? ((await res.json()) as { city?: string }).city ?? '' : '';
  } catch {
    return '';
  }
}

/** "N here now" in the header, plus other visitors' cursors on the same page. */
export async function initPresence() {
  const id = crypto.randomUUID();
  const color = liveColors[parseInt(id.slice(0, 2), 16) % liveColors.length];
  const where = await city();
  const label = where ? `${t.visitor} · ${where}` : t.visitor;
  const page = location.pathname;
  let show = load('cursors', true);

  const layer = document.createElement('div');
  layer.className = 'cursors';
  layer.setAttribute('aria-hidden', 'true');
  layer.hidden = !show;
  document.body.append(layer);
  const others = new Map<string, { el: HTMLElement; seen: number }>();

  const pills = $$<HTMLButtonElement>('[data-live]');
  const paintPill = (n: number) =>
    pills.forEach((p) => {
      p.hidden = false;
      p.innerHTML = `<i aria-hidden="true"></i><span class="live-n">${n}</span><span class="live-label"> here now</span>`;
      p.setAttribute('aria-label', `${t.here(n)}. ${show ? t.cursorsOn : t.cursorsOff}`);
      p.setAttribute('aria-pressed', String(show));
    });
  let count = 1;
  pills.forEach((p) =>
    p.addEventListener('click', () => {
      show = !show;
      save('cursors', show);
      layer.hidden = !show;
      paintPill(count);
    }),
  );

  const channel = supabase().channel('site', { config: { presence: { key: id }, broadcast: { self: false } } });

  channel.on('presence', { event: 'sync' }, () => {
    count = Math.max(1, Object.keys(channel.presenceState()).length);
    paintPill(count);
  });
  channel.on('presence', { event: 'leave' }, ({ key }) => {
    others.get(key)?.el.remove();
    others.delete(key);
  });
  channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
    const c = payload as Cursor;
    if (c.page !== page || c.id === id) return;
    let o = others.get(c.id);
    if (!o) {
      const el = document.createElement('div');
      el.className = 'cursor';
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="${esc(c.color)}"><path d="M4 3l16 7-7 2-2 7z"/></svg><span style="background:${esc(c.color)}">${esc(c.label)}</span>`;
      layer.append(el);
      o = { el, seen: 0 };
      others.set(c.id, o);
    }
    o.seen = Date.now();
    const h = document.documentElement.scrollHeight;
    o.el.style.transform = `translate(${Math.round(c.x * innerWidth)}px, ${Math.round(c.y * h)}px)`;
  });

  await new Promise<void>((resolve) =>
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({ page, label, color });
        resolve();
      }
    }),
  );

  // Forget cursors that went quiet.
  setInterval(() => {
    const now = Date.now();
    for (const [k, o] of others) if (now - o.seen > STALE_MS) (o.el.remove(), others.delete(k));
  }, 3000);

  // Only mouse/trackpad users broadcast a cursor; throttled, and never from a hidden tab.
  if (!env.finePointer) return;
  let last = 0;
  let timer = 0;
  let pending: PointerEvent | null = null;
  const send = () => {
    timer = 0;
    if (!pending || document.hidden) return;
    const e = pending;
    pending = null;
    last = performance.now();
    void channel.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { id, page, x: e.clientX / innerWidth, y: e.pageY / document.documentElement.scrollHeight, label, color } satisfies Cursor,
    });
  };
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pending = e;
      const wait = SEND_MS - (performance.now() - last);
      if (wait <= 0) send();
      else if (!timer) timer = window.setTimeout(send, wait);
    },
    { passive: true },
  );
}
