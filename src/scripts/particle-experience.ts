/**
 * Particle Experience — Scroll-Driven Three.js Particle Morphing
 *
 * Three stages driven by scroll:
 *   Stage 1 (0–33%): Scattered particle cloud — "Raw Data"
 *   Stage 2 (33–66%): 3D network grid — "Connected"
 *   Stage 3 (66–100%): Globe with orbital ring — "Intelligent"
 *
 * Scroll is clamped to morph sections only (footer excluded).
 *
 * Exports `initParticleExperience(container, options?)` returning `{ destroy }`.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PARTICLE_COUNT = 5000;
const BASE_POINT_SIZE = 3.5;

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

function buildVertexShader(particleCount: number): string {
  return /* glsl */ `
  attribute float aIndex;
  attribute float aRandom;

  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;

  varying vec3  vColor;
  varying float vAlpha;

  // Stage 1: Scattered particle cloud
  vec3 cloudShape(float idx, float rnd, float time) {
    float angle = idx * 6.28318 * 13.0 + rnd * 6.28;
    float radius = 2.0 + rnd * 4.0;
    float x = cos(angle + time * 0.1 * (rnd - 0.5)) * radius;
    float y = sin(angle * 0.7 + time * 0.15 * rnd) * radius * 0.6 + (rnd - 0.5) * 3.0;
    float z = sin(angle * 1.3 + time * 0.08) * radius * 0.4 + (rnd - 0.5) * 2.0;
    return vec3(x, y, z);
  }

  // Stage 2: 3D network grid
  vec3 networkShape(float idx, float rnd) {
    float gridSize = 6.0;
    float total = gridSize * gridSize * gridSize;
    float i = mod(floor(idx * ${particleCount}.0), total);
    float z = floor(i / (gridSize * gridSize));
    float rem = i - z * gridSize * gridSize;
    float y = floor(rem / gridSize);
    float x = rem - y * gridSize;
    vec3 pos = (vec3(x, y, z) - vec3(gridSize * 0.5 - 0.5)) * (3.0 / gridSize) * 3.0;
    pos += (rnd - 0.5) * 0.3;
    return pos;
  }

  // Stage 3: Globe with orbital ring
  vec3 globeShape(float idx, float rnd) {
    float radius = 3.0;
    if (rnd > 0.8) {
      float angle = idx * 6.28318 * 5.0 + rnd * 6.28;
      float ringR = radius * 1.3;
      float tilt = 0.5236;
      float cx = cos(angle) * ringR;
      float cz = sin(angle) * ringR;
      return vec3(cx, cz * sin(tilt), cz * cos(tilt));
    }
    float phi = acos(1.0 - 2.0 * idx);
    float theta = acos(-1.0) * (1.0 + sqrt(5.0)) * idx * 100.0;
    return vec3(
      sin(phi) * cos(theta) * radius,
      sin(phi) * sin(theta) * radius,
      cos(phi) * radius
    );
  }

  // Colors per stage
  vec3 colorStage1(float rnd) {
    vec3 blue = vec3(0.231, 0.510, 0.965);
    vec3 teal = vec3(0.024, 0.714, 0.831);
    return mix(blue, teal, rnd);
  }

  vec3 colorStage2(float rnd) {
    vec3 purple = vec3(0.545, 0.361, 0.965);
    vec3 violet = vec3(0.486, 0.228, 0.929);
    return mix(purple, violet, rnd);
  }

  vec3 colorStage3(float rnd) {
    vec3 lavender = vec3(0.769, 0.710, 0.992);
    vec3 white = vec3(0.973, 0.973, 0.988);
    return mix(lavender, white, smoothstep(0.6, 1.0, rnd));
  }

  void main() {
    float phase = uScroll * 2.0;

    vec3 p1 = cloudShape(aIndex, aRandom, uTime);
    vec3 p2 = networkShape(aIndex, aRandom);
    vec3 p3 = globeShape(aIndex, aRandom);

    vec3 c1 = colorStage1(aRandom);
    vec3 c2 = colorStage2(aRandom);
    vec3 c3 = colorStage3(aRandom);

    vec3 pos;
    vec3 col;

    if (phase < 1.0) {
      pos = mix(p1, p2, smoothstep(0.0, 1.0, phase));
      col = mix(c1, c2, smoothstep(0.0, 1.0, phase));
    } else if (phase < 2.0) {
      float t = phase - 1.0;
      pos = mix(p2, p3, smoothstep(0.0, 1.0, t));
      col = mix(c2, c3, smoothstep(0.0, 1.0, t));
    } else {
      pos = p3;
      col = c3;
    }

    // Ambient drift
    float drift = sin(uTime * 0.8 + aIndex * 6.28) * 0.05;
    pos += vec3(drift, drift * 0.7, drift * 0.5);

    vColor = col;
    vAlpha = mix(0.6, 0.9, aRandom);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float size = ${BASE_POINT_SIZE.toFixed(1)} * uPixelRatio;
    gl_PointSize = size * (300.0 / -mvPosition.z);
  }
`;
}

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ParticleExperienceControls {
  destroy: () => void;
}

export interface ParticleExperienceOptions {
  particleCount?: number;
  /** CSS selector for the last morph section (scroll clamped to its bottom) */
  scrollEndSelector?: string;
}

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

export function initParticleExperience(
  container: HTMLElement,
  options?: ParticleExperienceOptions,
): ParticleExperienceControls {
  const count = options?.particleCount ?? DEFAULT_PARTICLE_COUNT;
  const scrollEndSelector = options?.scrollEndSelector ?? '[data-morph-end]';

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // --- Scene & Camera ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.z = 10;

  // --- Geometry ---
  const indices = new Float32Array(count);
  const randoms = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    indices[i] = i / count;
    randoms[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  const dummyPositions = new Float32Array(count * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3));
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  // --- Shader material ---
  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: buildVertexShader(count),
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // --- Scroll handling (clamped to morph sections) ---
  let scrollTarget = 0;
  let smoothScroll = 0;

  function onScroll(): void {
    const endEl = document.querySelector(scrollEndSelector);
    const scrollEnd = endEl
      ? endEl.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = scrollEnd > 0 ? Math.min(window.scrollY / scrollEnd, 1.0) : 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Resize ---
  function onResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  window.addEventListener('resize', onResize, { passive: true });

  // --- Animation loop ---
  let destroyed = false;
  let animationFrameId = 0;
  const clock = new THREE.Clock();

  function animate(): void {
    if (destroyed) return;
    animationFrameId = requestAnimationFrame(animate);

    uniforms.uTime.value = clock.getElapsedTime();
    smoothScroll += (scrollTarget - smoothScroll) * 0.04;
    uniforms.uScroll.value = smoothScroll;

    renderer.render(scene, camera);
  }

  animate();

  // --- Cleanup ---
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;

    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);

    geometry.dispose();
    material.dispose();
    renderer.forceContextLoss();
    renderer.dispose();

    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  return { destroy };
}
