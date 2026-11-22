import * as THREE from 'three';
import { env } from '../lib/env';
import { getTheme } from '../lib/theme';
import { createStage, damp, pointer } from './stage';

const vertex = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uPresence;
varying float vFade;
varying float vLift;

void main() {
  vec3 p = position;
  float z = sin(p.x * 0.55 + uTime * 0.45) * 0.16
          + sin(p.y * 0.85 + p.x * 0.18 + uTime * 0.32) * 0.12;

  // Ripple rings spreading out from the cursor.
  float d = distance(p.xy, uMouse);
  float ripple = sin(d * 3.4 - uTime * 2.6) * exp(-d * 0.75) * 0.32;
  float bump = exp(-d * d * 1.6) * 0.28;
  z += (ripple + bump) * uPresence;
  p.z = z;

  vLift = clamp(z * 2.0, -1.0, 1.0);
  vFade = smoothstep(0.0, 0.35, uv.y) * smoothstep(1.0, 0.55, uv.y)
        * smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const fragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
varying float vLift;
void main() {
  float a = uOpacity * vFade * (0.55 + vLift * 0.45);
  gl_FragColor = vec4(uColor, a);
}
`;

/** Wireframe wave plane behind the contact section; ripples under the cursor. */
export function initWave(host: HTMLElement) {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 1.6, 6.2);
  camera.lookAt(0, -0.6, 0);

  const [sx, sy] = env.lite ? [40, 22] : [72, 40];
  const geo = new THREE.PlaneGeometry(18, 10, sx, sy);
  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, -20) },
    uPresence: { value: 0 },
    uColor: { value: new THREE.Color(0xf5a524) },
    uOpacity: { value: 0.42 },
  };
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      wireframe: true,
      transparent: true,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2 + 0.28;
  mesh.position.set(0, -1.3, -1.5);
  mesh.updateMatrixWorld();

  const applyTheme = () => {
    const light = getTheme() === 'light';
    uniforms.uColor.value.set(light ? 0xc27a0a : 0xf5a524);
    uniforms.uOpacity.value = light ? 0.3 : 0.4;
  };
  applyTheme();

  // Project the cursor onto the plane analytically — cheaper than raycasting triangles.
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const target = new THREE.Vector2(0, -20);
  plane.setFromNormalAndCoplanarPoint(
    new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion),
    mesh.position,
  );

  const stage = createStage({
    host,
    camera,
    stillTime: 2,
    onResize: (w, h) => {
      camera.fov = w / h < 1 ? 60 : 45;
      camera.updateProjectionMatrix();
    },
    onTheme: applyTheme,
    onFrame: (t, dt) => {
      uniforms.uTime.value = t;
      const r = host.getBoundingClientRect();
      const inside =
        pointer.active && pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
      if (inside) {
        ndc.set(((pointer.x - r.left) / r.width) * 2 - 1, -((pointer.y - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectPlane(plane, hit)) {
          mesh.worldToLocal(hit);
          target.set(hit.x, hit.y);
        }
      }
      const m = uniforms.uMouse.value;
      m.set(damp(m.x, target.x, 4, dt), damp(m.y, target.y, 4, dt));
      uniforms.uPresence.value = damp(uniforms.uPresence.value, inside ? 1 : 0, 2, dt);
    },
  });
  stage?.scene.add(mesh);
  return stage;
}
