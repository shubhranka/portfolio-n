import * as THREE from 'three';
import { cssVar } from '../lib/theme';
import { color, createStage, damp } from './stage';

const R = 1.6;
const FONT_PX = 30;
const BASE_SPIN = (Math.PI * 2) / 30; // one turn every 30s, like the design

function makeLabel(text: string) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  const font = `500 ${FONT_PX}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 16;
  const h = FONT_PX + 16;
  c.width = w * 2;
  c.height = h * 2;
  ctx.scale(2, 2);
  ctx.font = font;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 8, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect: w / h };
}

export interface SphereOptions {
  /** This tag gets a small ◆ and always shows in the accent colour. */
  marked?: string;
  /** Called when a tag is clicked, tapped, or picked with Enter. */
  onPick?: (name: string) => void;
}

/** Rotating, draggable sphere of skill names. */
export async function initTagSphere(host: HTMLElement, names: string[], opts: SphereOptions = {}) {
  try {
    await document.fonts.load(`500 ${FONT_PX}px "JetBrains Mono"`);
  } catch {
    /* fall back to whatever monospace is available */
  }

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.z = 6;
  const group = new THREE.Group();

  const n = names.length;
  const sprites = names.map((name, k) => {
    // Fibonacci sphere distribution.
    const y = 1 - (k / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = k * 2.39996;
    const { tex, aspect } = makeLabel(name === opts.marked ? `${name} ◆` : name);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const s = new THREE.Sprite(mat);
    const h = 0.2;
    s.scale.set(h * aspect, h, 1);
    s.position.set(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
    s.userData = { name, accent: k % 4 === 0 || name === opts.marked, base: s.scale.clone() };
    group.add(s);
    return s;
  });

  let highlighted: string | null = null;
  const palette = { text: new THREE.Color(), accent: new THREE.Color() };
  const applyTheme = () => {
    palette.text = color(cssVar('--soft'));
    palette.accent = color(cssVar('--accent-text'));
  };
  applyTheme();

  const v = new THREE.Vector3();
  const spin = { x: 0, y: BASE_SPIN };
  const drag = { on: false, x: 0, y: 0, t: 0 };
  const axisX = new THREE.Vector3(1, 0, 0);
  const axisY = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  group.rotation.x = -0.2;

  const rotate = (ax: number, ay: number) => {
    group.quaternion.premultiply(q.setFromAxisAngle(axisY, ay));
    group.quaternion.premultiply(q.setFromAxisAngle(axisX, ax));
  };

  const stage = createStage({
    host,
    camera,
    stillTime: 0,
    onResize: (w, h) => {
      const fitH = (R + 0.4) / Math.tan(THREE.MathUtils.degToRad(20));
      const fitW = (R + 0.9) / (Math.tan(THREE.MathUtils.degToRad(20)) * (w / h));
      camera.position.z = Math.max(fitH, fitW);
    },
    onTheme: applyTheme,
    onFrame: (_t, dt) => {
      if (!drag.on) {
        spin.x = damp(spin.x, 0, 1.2, dt);
        spin.y = damp(spin.y, BASE_SPIN, 1.2, dt);
        rotate(spin.x * dt, spin.y * dt);
      }
      for (const s of sprites) {
        s.getWorldPosition(v);
        const depth = (v.z / R + 1) / 2; // 0 back … 1 front
        const hot = highlighted === s.userData.name;
        const mat = s.material;
        mat.color.copy(hot || s.userData.accent ? palette.accent : palette.text);
        mat.opacity = hot ? 1 : 0.22 + depth * 0.78;
        const k = (0.8 + depth * 0.35) * (hot ? 1.3 : 1);
        s.scale.set(s.userData.base.x * k, s.userData.base.y * k, 1);
        s.renderOrder = Math.round(depth * 100);
      }
    },
  });
  if (!stage) return null;
  stage.scene.add(group);
  stage.invalidate();

  // Click or tap (without dragging) picks the nearest front-facing tag, within a
  // forgiving radius, since the labels are small and always moving.
  const PICK_PX = 28;
  let travel = 0;
  const pickAt = (x: number, y: number) => {
    const r = host.getBoundingClientRect();
    let best: THREE.Sprite | null = null;
    let bestD = PICK_PX;
    for (const s of sprites) {
      s.getWorldPosition(v);
      if (v.z < 0) continue;
      v.project(camera);
      const d = Math.hypot(((v.x + 1) / 2) * r.width + r.left - x, ((1 - v.y) / 2) * r.height + r.top - y);
      if (d < bestD) [best, bestD] = [s, d];
    }
    if (best) opts.onPick?.(best.userData.name);
  };

  // Keyboard: arrows spin, Enter or Space picks the tag nearest the front.
  host.tabIndex = 0;
  host.addEventListener('keydown', (e) => {
    const k = 0.35;
    const turn = { ArrowLeft: [0, -k], ArrowRight: [0, k], ArrowUp: [-k, 0], ArrowDown: [k, 0] }[e.key];
    if (turn) {
      e.preventDefault();
      rotate(turn[0], turn[1]);
      stage.invalidate();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const front = sprites.reduce((best, s) => (s.getWorldPosition(v).z > best.z ? { s, z: v.z } : best), { s: sprites[0], z: -Infinity });
      opts.onPick?.(front.s.userData.name);
    }
  });

  // Drag to spin, with inertia on release.
  const el = host;
  el.addEventListener('pointerdown', (e) => {
    travel = 0;
    drag.on = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = performance.now();
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag.on) return;
    const now = performance.now();
    const dt = Math.max((now - drag.t) / 1000, 1 / 120);
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    travel += Math.abs(dx) + Math.abs(dy);
    const k = 0.006;
    rotate(dy * k, dx * k);
    spin.x = (dy * k) / dt;
    spin.y = (dx * k) / dt;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.t = now;
    stage.invalidate();
  });
  const end = () => {
    drag.on = false;
    el.classList.remove('dragging');
    const cap = 4;
    spin.x = THREE.MathUtils.clamp(spin.x, -cap, cap);
    spin.y = THREE.MathUtils.clamp(spin.y, -cap, cap);
  };
  el.addEventListener('pointerup', (e) => {
    end();
    if (travel < 6) pickAt(e.clientX, e.clientY);
  });
  el.addEventListener('pointercancel', end);

  return {
    highlight(name: string | null) {
      highlighted = name;
      stage.invalidate();
    },
  };
}
