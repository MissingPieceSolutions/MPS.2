/**
 * Particle Experience — Scroll-Driven Three.js Particle Morphing
 *
 * A full-screen particle system that transitions between three shapes
 * as the user scrolls through the experience page:
 *   Phase 1 (0–0.5): Flowing wave/stream → Network/grid transition
 *   Phase 2 (0.5–1.0): Network/grid → Globe with orbital ring transition
 *
 * Scroll position is normalised to 0–1 and lerped smoothly (factor 0.04)
 * to drive a uScroll uniform in the vertex shader.
 *
 * Exports `initParticleExperience(container)` returning `{ destroy }`.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 5000;
const BASE_POINT_SIZE = 3.5;

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  attribute float aIndex;    // normalised 0–1 index per particle
  attribute float aRandom;   // random seed per particle

  uniform float uTime;
  uniform float uScroll;     // smoothed scroll 0–1
  uniform float uPixelRatio;

  varying vec3  vColor;
  varying float vAlpha;

  // -----------------------------------------------------------------------
  // Shape functions — each returns a vec3 position for a particle
  // -----------------------------------------------------------------------

  // Phase 1: flowing sine wave stream
  vec3 waveShape(float idx, float rnd, float time) {
    float x = (idx - 0.5) * 14.0;
    float y = sin(x * 0.8 + time * 0.6 + rnd * 6.28) * 2.0 + (rnd - 0.5) * 1.5;
    float z = cos(x * 0.5 + time * 0.4 + rnd * 3.14) * 1.5 + (rnd - 0.5) * 1.0;
    return vec3(x, y, z);
  }

  // Phase 2: 3D network grid
  vec3 networkShape(float idx, float rnd) {
    float gridSize = 6.0;
    float spacing = 3.0;
    float total = gridSize * gridSize * gridSize;
    float i = mod(floor(idx * ${PARTICLE_COUNT}.0), total);
    float z = floor(i / (gridSize * gridSize));
    float rem = i - z * gridSize * gridSize;
    float y = floor(rem / gridSize);
    float x = rem - y * gridSize;
    vec3 pos = (vec3(x, y, z) - vec3(gridSize * 0.5 - 0.5)) * (spacing / gridSize) * 3.0;
    // Add slight jitter
    pos += (rnd - 0.5) * 0.3;
    return pos;
  }

  // Phase 3: globe with orbital ring
  vec3 globeShape(float idx, float rnd) {
    float radius = 3.0;
    // 80% sphere, 20% ring
    if (rnd > 0.8) {
      // Orbital ring
      float angle = idx * 6.28318 * 5.0 + rnd * 6.28;
      float ringR = radius * 1.3;
      // Tilted orbital ring (~30 degrees) in Y-up scene
      float tilt = 0.5236; // ~30 degrees
      float cx = cos(angle) * ringR;
      float cz = sin(angle) * ringR;
      return vec3(cx, cz * sin(tilt), cz * cos(tilt));
    }
    // Sphere via fibonacci distribution
    float phi = acos(1.0 - 2.0 * idx);
    float theta = acos(-1.0) * (1.0 + sqrt(5.0)) * idx * 100.0;
    return vec3(
      sin(phi) * cos(theta) * radius,
      sin(phi) * sin(theta) * radius,
      cos(phi) * radius
    );
  }

  // -----------------------------------------------------------------------
  // Colour functions per phase
  // -----------------------------------------------------------------------

  // Phase 1: blues and teals
  vec3 colorPhase1(float rnd) {
    vec3 blue = vec3(0.3, 0.6, 1.0);
    vec3 teal = vec3(0.1, 0.85, 0.8);
    return mix(blue, teal, rnd);
  }

  // Phase 2: shifting to purple
  vec3 colorPhase2(float rnd) {
    vec3 purple = vec3(0.545, 0.361, 0.965);
    vec3 violet = vec3(0.6, 0.3, 0.9);
    return mix(purple, violet, rnd);
  }

  // Phase 3: purple with white highlights
  vec3 colorPhase3(float rnd) {
    vec3 purple = vec3(0.545, 0.361, 0.965);
    vec3 white = vec3(0.95, 0.95, 1.0);
    return mix(purple, white, smoothstep(0.7, 1.0, rnd));
  }

  void main() {
    float phase = uScroll * 2.0; // 0–2 (two transitions across full scroll)

    // Compute positions for all three shapes
    vec3 p1 = waveShape(aIndex, aRandom, uTime);
    vec3 p2 = networkShape(aIndex, aRandom);
    vec3 p3 = globeShape(aIndex, aRandom);

    // Compute colours for all three phases
    vec3 c1 = colorPhase1(aRandom);
    vec3 c2 = colorPhase2(aRandom);
    vec3 c3 = colorPhase3(aRandom);

    // Interpolate based on phase
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

    // Add gentle ambient drift
    float drift = sin(uTime * 0.8 + aIndex * 6.28) * 0.05;
    pos += vec3(drift, drift * 0.7, drift * 0.5);

    vColor = col;
    vAlpha = mix(0.6, 0.9, aRandom);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mvPosition;

    float size = ${BASE_POINT_SIZE.toFixed(1)} * uPixelRatio;
    gl_PointSize = size * (300.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Soft glowing disc — same as particle-gate.ts
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, d);

    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

export interface ParticleExperienceControls {
  /** Full cleanup — remove canvas, dispose GPU resources, unbind listeners */
  destroy: () => void;
}

export function initParticleExperience(container: HTMLElement): ParticleExperienceControls {
  // --- Renderer -----------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // --- Scene & Camera -----------------------------------------------------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.z = 10;

  // --- Build particle geometry --------------------------------------------
  const indices = new Float32Array(PARTICLE_COUNT);
  const randoms = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    indices[i] = i / PARTICLE_COUNT;
    randoms[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  // Position attribute is required but we compute positions in the shader
  const dummyPositions = new Float32Array(PARTICLE_COUNT * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(dummyPositions, 3));
  geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  // --- Shader material ----------------------------------------------------
  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // --- Scroll handling (slap-apps pattern) --------------------------------
  let scrollTarget = 0;
  let smoothScroll = 0;

  function onScroll(): void {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Initialise in case page is already scrolled
  onScroll();

  // --- Resize handling ----------------------------------------------------
  function onResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  window.addEventListener('resize', onResize, { passive: true });

  // --- Animation loop -----------------------------------------------------
  let destroyed = false;
  let animationFrameId = 0;
  const clock = new THREE.Clock();

  function animate(): void {
    if (destroyed) return;
    animationFrameId = requestAnimationFrame(animate);

    uniforms.uTime.value = clock.getElapsedTime();

    // Smooth lerp scroll — same factor as slap-apps (0.04)
    smoothScroll += (scrollTarget - smoothScroll) * 0.04;
    uniforms.uScroll.value = smoothScroll;

    renderer.render(scene, camera);
  }

  animate();

  // --- Cleanup ------------------------------------------------------------
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
