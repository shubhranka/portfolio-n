import * as THREE from 'three';
import { env, onReducedMotionChange, pixelRatio } from '../lib/env';
import { onThemeChange } from '../lib/theme';

export interface StageOptions {
  host: HTMLElement;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  /** Skip the offscreen check (e.g. a fixed full-viewport canvas). */
  alwaysOnScreen?: boolean;
  /** Time used for the single frame drawn under prefers-reduced-motion. */
  stillTime?: number;
  onResize?: (w: number, h: number) => void;
  onFrame: (t: number, dt: number) => void;
  onTheme?: () => void;
}

export interface Stage {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  /** Draw one frame now — used for still frames and after state changes while paused. */
  invalidate: () => void;
  readonly size: { w: number; h: number };
}

/**
 * Shared plumbing for every scene: sizing, DPR caps, pausing when offscreen or
 * in a hidden tab, and single still frames under prefers-reduced-motion.
 * Returns null when WebGL is unavailable so callers can fall back silently.
 */
export function createStage(o: StageOptions): Stage | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !env.lite, powerPreference: 'default' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(pixelRatio());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  o.host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const size = { w: 1, h: 1 };
  let last = 0;
  let onScreen = !!o.alwaysOnScreen;
  let raf = 0;
  let elapsed = o.stillTime ?? 0;

  const shouldRun = () => onScreen && !document.hidden && !env.reducedMotion;

  const draw = (t: number, dt: number) => {
    o.onFrame(t, dt);
    renderer.render(scene, o.camera);
  };

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    elapsed += dt;
    draw(elapsed, dt);
  };

  const sync = () => {
    if (shouldRun()) {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const invalidate = () => {
    if (!raf) draw(env.reducedMotion ? (o.stillTime ?? 0) : elapsed, 0);
  };

  const resize = () => {
    const w = Math.max(1, o.host.clientWidth);
    const h = Math.max(1, o.host.clientHeight);
    if (w === size.w && h === size.h) return;
    size.w = w;
    size.h = h;
    renderer.setSize(w, h, false);
    const cam = o.camera;
    if (cam instanceof THREE.PerspectiveCamera) cam.aspect = w / h;
    cam.updateProjectionMatrix();
    o.onResize?.(w, h);
    invalidate();
  };

  new ResizeObserver(resize).observe(o.host);
  resize();

  if (!o.alwaysOnScreen) {
    new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        sync();
      },
      { rootMargin: '120px 0px' },
    ).observe(o.host);
  }
  document.addEventListener('visibilitychange', sync);
  onReducedMotionChange(() => {
    sync();
    invalidate();
  });
  onThemeChange(() => {
    o.onTheme?.();
    invalidate();
  });

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  });

  invalidate();
  sync();

  return { scene, renderer, invalidate, size };
}

/** Pointer position in viewport pixels, shared by all scenes. */
export const pointer = { x: -9999, y: -9999, active: false };
window.addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  },
  { passive: true },
);
document.documentElement.addEventListener('pointerleave', () => (pointer.active = false));

export const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

export const color = (css: string) => new THREE.Color(css || '#ffffff');
