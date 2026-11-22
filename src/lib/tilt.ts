import { env } from './env';

/**
 * Perspective tilt + a moving glare on `.tile` elements.
 * Pure CSS custom properties; the transform itself lives in styles.css.
 */
export function initTilt(root: ParentNode = document) {
  if (!env.finePointer) return;

  root.querySelectorAll<HTMLElement>('.tile').forEach((el) => {
    let frame = 0;
    const max = el.classList.contains('tile-feature') ? 4 : 7;

    el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
    el.addEventListener('pointermove', (e) => {
      if (env.reducedMotion) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
        el.style.setProperty('--lift', '-4px');
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        el.style.setProperty('--go', '1');
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.classList.remove('is-tilting');
      for (const p of ['--rx', '--ry', '--lift', '--go']) el.style.removeProperty(p);
    });
  });
}

/** Adds `.in-view` once an element scrolls into view. */
export function initReveal(root: ParentNode = document) {
  const els = root.querySelectorAll('.reveal, .shot-hero');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}
