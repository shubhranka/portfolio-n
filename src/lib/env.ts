const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const env = {
  get reducedMotion() {
    return reducedQuery.matches;
  },
  /** Phones and small tablets get lighter scenes. */
  lite:
    window.matchMedia('(max-width: 760px)').matches ||
    (window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820) ||
    (navigator.hardwareConcurrency ?? 8) <= 4,
  finePointer: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
};

export const onReducedMotionChange = (fn: () => void) => reducedQuery.addEventListener('change', fn);

/** Cap device pixel ratio: the biggest single win for GPU cost on phones. */
export const pixelRatio = () => Math.min(window.devicePixelRatio || 1, env.lite ? 1.5 : 2);

/** Live features (presence, guestbook, global boards) need the flag and both Supabase keys. */
export const live =
  import.meta.env.VITE_LIVE === 'true' && !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
