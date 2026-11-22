import * as THREE from 'three';
import { env } from '../lib/env';
import { getTheme } from '../lib/theme';
import { simplex3 } from './noise.glsl';
import { createStage, damp, pointer } from './stage';

const vertex = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDisp;
${simplex3}

float field(vec3 p) {
  float t = uTime * 0.12;
  return snoise(p * 0.72 + vec3(t, t * 0.7, -t)) * uAmp
       + snoise(p * 1.6 - vec3(t * 1.1)) * uAmp * 0.12;
}

vec3 displace(vec3 p) {
  return p + normalize(p) * field(p);
}

void main() {
  vec3 p = displace(position);

  // Normal from two displaced neighbours on the tangent plane.
  vec3 n = normalize(normal);
  vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 bitangent = cross(n, tangent);
  float e = 0.01;
  vec3 pt = displace(position + tangent * e);
  vec3 pb = displace(position + bitangent * e);
  vec3 dn = normalize(cross(pt - p, pb - p));

  vDisp = field(position);
  vNormal = normalize(normalMatrix * dn);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
uniform float uLight;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDisp;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 2.4);

  vec3 L = normalize(vec3(-0.55, 0.75, 0.6));
  float diff = dot(N, L) * 0.5 + 0.5;
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 60.0);
  float spec2 = pow(max(dot(reflect(-normalize(vec3(0.6, -0.5, 0.5)), N), V), 0.0), 18.0);

  vec3 deep  = mix(vec3(0.09, 0.045, 0.015), vec3(0.55, 0.27, 0.05), uLight);
  vec3 amber = vec3(0.96, 0.62, 0.13);
  vec3 cream = vec3(1.0, 0.93, 0.80);

  vec3 col = mix(deep, amber, smoothstep(0.15, 0.95, diff));
  col = mix(col, cream, fres * 0.75);
  col += spec * vec3(1.0, 0.97, 0.92) * 1.1;
  col += spec2 * vec3(0.47, 0.67, 1.0) * 0.22;          // cool bounce, lower right
  col += 0.025 * sin(vDisp * 10.0 + vec3(0.0, 2.1, 4.2)); // faint iridescence

  float alpha = mix(0.86, 1.0, fres) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}
`;

function ring(radius: number, dashed: boolean, color: THREE.ColorRepresentation, opacity: number) {
  const pts = new THREE.EllipseCurve(0, 0, radius, radius).getPoints(160);
  const geo = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)));
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.06, gapSize: 0.05 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.LineLoop(geo, mat);
  if (dashed) line.computeLineDistances();
  return line;
}

export function initHero(host: HTMLElement) {
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.24 },
    uLight: { value: getTheme() === 'light' ? 1 : 0 },
    uOpacity: { value: 1 },
  };

  const root = new THREE.Group();
  const lean = new THREE.Group();
  root.add(lean);

  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, env.lite ? 28 : 64),
    new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true }),
  );
  lean.add(blob);

  // Orbit rings with small spheres riding them.
  const ringA = new THREE.Group();
  ringA.rotation.x = THREE.MathUtils.degToRad(74);
  const spinA = new THREE.Group();
  ringA.add(spinA);
  const lineA = ring(1.72, false, 0xf5a524, 0.32);
  spinA.add(lineA);

  const ringB = new THREE.Group();
  ringB.rotation.set(THREE.MathUtils.degToRad(64), THREE.MathUtils.degToRad(22), 0);
  const spinB = new THREE.Group();
  ringB.add(spinB);
  const lineB = ring(1.46, true, 0xf2eee8, 0.16);
  spinB.add(lineB);
  root.add(ringA, ringB);

  const ball = (r: number, c: number, emissive: number) =>
    new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshStandardMaterial({ color: c, emissive, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.1 }),
    );
  const moonA = ball(0.07, 0xf5a524, 0x6b3d0a);
  moonA.position.set(0, 1.72, 0);
  spinA.add(moonA);
  const moonB = ball(0.09, 0xe9e3da, 0x3a3631);
  moonB.position.set(-1.46, 0, 0);
  spinB.add(moonB);

  const floatA = ball(0.16, 0xf5a524, 0x5c3208);
  floatA.position.set(1.6, 1.05, -0.4);
  const floatB = ball(0.095, 0xd9d2c8, 0x2a2622);
  floatB.position.set(-1.5, -0.95, 0.2);
  root.add(floatA, floatB);

  const lights = [new THREE.AmbientLight(0xfff1dc, 0.9), new THREE.DirectionalLight(0xffffff, 2.4)];
  lights[1].position.set(-3, 4, 5);

  const applyTheme = () => {
    const light = getTheme() === 'light';
    uniforms.uLight.value = light ? 1 : 0;
    (lineB.material as THREE.LineDashedMaterial).color.set(light ? 0x6b5d4c : 0xf2eee8);
    (lineB.material as THREE.LineDashedMaterial).opacity = light ? 0.28 : 0.16;
    (lineA.material as THREE.LineBasicMaterial).opacity = light ? 0.5 : 0.32;
  };
  applyTheme();

  const state = { rx: 0, ry: 0, px: 0, py: 0, scroll: 0 };

  const stage = createStage({
    host,
    camera,
    stillTime: 6,
    onResize: (w, h) => {
      // Keep the composition inside narrow stages.
      const aspect = w / h;
      camera.position.z = aspect < 1 ? 6.4 / Math.max(aspect, 0.62) : 6.4;
    },
    onTheme: applyTheme,
    onFrame: (t, dt) => {
      uniforms.uTime.value = t;

      // Lean toward the cursor.
      const r = host.getBoundingClientRect();
      let tx = 0;
      let ty = 0;
      if (pointer.active && !env.reducedMotion) {
        tx = THREE.MathUtils.clamp((pointer.x - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
        ty = THREE.MathUtils.clamp((pointer.y - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);
      }
      state.ry = damp(state.ry, tx * 0.5, 2.5, dt);
      state.rx = damp(state.rx, ty * 0.35, 2.5, dt);
      state.px = damp(state.px, tx * 0.22, 2, dt);
      state.py = damp(state.py, -ty * 0.16, 2, dt);
      lean.rotation.set(state.rx, state.ry + t * 0.05, 0);
      lean.position.set(state.px, state.py + Math.sin(t * 0.9) * 0.06, 0);

      // Shrink away as the hero scrolls out.
      const p = THREE.MathUtils.clamp(-r.top / (r.height * 0.9), 0, 1);
      state.scroll = env.reducedMotion ? p : damp(state.scroll, p, 6, dt);
      const s = 1 - state.scroll * 0.45;
      root.scale.setScalar(s);
      root.position.y = state.scroll * 0.6;
      uniforms.uOpacity.value = 1 - state.scroll * 0.55;

      spinA.rotation.z = t * ((Math.PI * 2) / 26);
      spinB.rotation.z = -t * ((Math.PI * 2) / 38);
      floatA.position.y = 1.05 + Math.sin(t * 1.2) * 0.12;
      floatB.position.y = -0.95 + Math.sin(t * 1.0 + 1.5) * 0.1;
    },
  });
  if (!stage) return null;

  stage.scene.add(root, ...lights);
  stage.invalidate();

  // While paused under reduced motion, still follow scroll so the still frame isn't stale.
  if (env.reducedMotion) window.addEventListener('scroll', () => stage.invalidate(), { passive: true });
  return stage;
}
