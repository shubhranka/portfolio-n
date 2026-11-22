import * as THREE from 'three';
import { env, pixelRatio } from '../lib/env';
import { cssVar } from '../lib/theme';
import { color, createStage, damp, pointer } from './stage';

const vertex = /* glsl */ `
attribute float aSeed;
attribute float aSize;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uTime;
uniform float uScroll;
uniform float uRadius;
uniform float uDpr;
varying float vAlpha;

void main() {
  float depth = fract(aSeed * 7.13);           // 0 far … 1 near
  vec2 p = position.xy * (uRes + 80.0) - 40.0;

  // Slow drift.
  p += vec2(sin(uTime * 0.07 + aSeed * 40.0) * 14.0, cos(uTime * 0.05 + aSeed * 23.0) * 10.0);

  // Parallax with scroll; near particles move more. Wrap vertically.
  float span = uRes.y + 80.0;
  p.y = mod(p.y - uScroll * (0.04 + depth * 0.16) + 40.0, span) - 40.0;

  // Part around the cursor.
  vec2 d = p - uMouse;
  float dist = length(d);
  float push = smoothstep(uRadius, 0.0, dist);
  p += (d / max(dist, 0.001)) * push * push * uRadius * 0.55;

  vec2 clip = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = aSize * (0.6 + depth * 0.8) * uDpr;
  vAlpha = (0.12 + depth * 0.32) * (1.0 - push * 0.4);
}
`;

const fragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, d) * vAlpha * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/** Faint field of points behind the whole page that parts around the cursor. */
export function initParticles(host: HTMLElement) {
  const count = env.lite ? 260 : 720;
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random();
    pos[i * 3 + 1] = Math.random();
    seed[i] = Math.random();
    size[i] = 1.5 + Math.random() * 2.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const uniforms = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uRadius: { value: 140 },
    uDpr: { value: pixelRatio() },
    uColor: { value: color(cssVar('--text')) },
    uOpacity: { value: 1 },
  };
  const applyTheme = () => {
    uniforms.uColor.value = color(cssVar('--text'));
    uniforms.uOpacity.value = document.documentElement.dataset.theme === 'light' ? 1.1 : 1;
  };
  applyTheme();

  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false }),
  );
  points.frustumCulled = false;

  const mouse = { x: -9999, y: -9999 };

  const stage = createStage({
    host,
    camera: new THREE.OrthographicCamera(),
    alwaysOnScreen: true,
    stillTime: 3,
    onResize: (w, h) => uniforms.uRes.value.set(w, h),
    onTheme: applyTheme,
    onFrame: (t, dt) => {
      uniforms.uTime.value = t;
      uniforms.uScroll.value = window.scrollY;
      if (pointer.active) {
        // Jump on first contact, then ease.
        const first = mouse.x < -999;
        mouse.x = first ? pointer.x : damp(mouse.x, pointer.x, 5, dt);
        mouse.y = first ? pointer.y : damp(mouse.y, pointer.y, 5, dt);
      } else {
        mouse.x = mouse.y = -9999;
      }
      uniforms.uMouse.value.set(mouse.x, mouse.y);
    },
  });
  stage?.scene.add(points);
  return stage;
}
