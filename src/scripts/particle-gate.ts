/**
 * Particle Gate — Three.js Energy Ring Entrance
 *
 * The hero visual for the MPS homepage. ~4000 particles begin scattered
 * across a black void in blues, teals, and whites, then converge over
 * ~3 seconds into the MPS energy ring logo shape. During convergence
 * colours shift to brand purple (#8b5cf6). After forming, particles
 * gently drift and pulse. Mouse position adds subtle parallax.
 *
 * Exports `initParticleGate(container)` which returns:
 *   - destroy()       — full cleanup (renderer, geometry, material, listeners, canvas)
 *   - setProgress(p)  — manually override convergence (0 = scattered, 1 = formed)
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total particle count — balances visual density with performance */
const PARTICLE_COUNT = 4000;

/** Radius of the energy ring (world units) */
const RING_RADIUS = 2.5;

/** Thickness of the ring band — particles distribute within ±RING_THICKNESS of RING_RADIUS */
const RING_THICKNESS = 0.4;

/** Convergence duration in seconds */
const CONVERGE_DURATION = 3.0;

/** Max scatter distance from origin for the initial random positions */
const SCATTER_RANGE = 6.0;

/** Base point size in the vertex shader */
const BASE_POINT_SIZE = 4.0;

/** Brand purple as a normalised RGB vec3 string for GLSL */
const BRAND_PURPLE = 'vec3(0.545, 0.361, 0.965)'; // #8b5cf6

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  // Per-particle attributes
  attribute vec3 aTarget;       // converged ring position
  attribute vec3 aRandom;       // initial scattered position
  attribute float aDelay;       // stagger delay (0–1) for convergence
  attribute vec3 aInitColor;    // initial multi-colour (blues/teals/whites)

  // Uniforms
  uniform float uTime;          // elapsed time in seconds
  uniform float uProgress;      // convergence progress 0→1
  uniform vec2  uMouse;         // normalised mouse position (-1 to 1)
  uniform float uPixelRatio;    // devicePixelRatio (capped at 2)

  // Varyings → fragment shader
  varying vec3  vColor;
  varying float vAlpha;

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Attempt a smooth-start ease that mirrors a power curve.
   * p is clamped per-particle based on its stagger delay.
   */
  float easeOutCubic(float t) {
    float inv = 1.0 - t;
    return 1.0 - inv * inv * inv;
  }

  void main() {
    // --- Per-particle staggered progress ---
    // Each particle's delay stretches the window it starts moving in.
    // A particle with aDelay=0.3 won't start until uProgress reaches 0.3,
    // then ramps 0→1 over the remaining 70 % of the timeline.
    float pStart = aDelay * 0.5;                     // delay window (0–0.5)
    float raw    = clamp((uProgress - pStart) / (1.0 - pStart), 0.0, 1.0);
    float p      = easeOutCubic(raw);

    // --- Position: lerp from scattered → target with ambient drift ---
    vec3 pos = mix(aRandom, aTarget, p);

    // Ambient drift — small oscillation after convergence
    float drift = sin(uTime * 1.2 + aDelay * 6.2831) * 0.04 * p;
    pos += normalize(aTarget) * drift;

    // Gentle radial pulse on the formed ring
    float pulse = sin(uTime * 0.8) * 0.02 * p;
    pos += normalize(aTarget) * pulse;

    // --- Mouse parallax (stronger on scattered particles) ---
    float parallaxStrength = mix(0.35, 0.06, p);
    pos.x += uMouse.x * parallaxStrength;
    pos.y += uMouse.y * parallaxStrength;

    // --- Colour: multi-colour → brand purple ---
    vec3 brandPurple = ${BRAND_PURPLE};
    vColor = mix(aInitColor, brandPurple, p);

    // Alpha: scattered particles are softer, formed ones glow brighter
    vAlpha = mix(0.6, 1.0, p);

    // --- GL position & point size ---
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mvPosition;

    // Perspective-attenuated point size
    float size = ${BASE_POINT_SIZE.toFixed(1)} * uPixelRatio;
    gl_PointSize = size * (300.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Soft glowing disc — no texture required
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, d);

    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * Generate a random point on / near the energy ring.
 * ~80 % of particles sit tightly on the ring; ~20 % are scattered nearby
 * to create an "energy field" halo.
 */
function ringTarget(i: number, count: number): [number, number, number] {
  const angle = (i / count) * Math.PI * 2 + Math.random() * 0.05;

  // Decide if this particle is a tight-ring or halo particle
  const isHalo = Math.random() < 0.2;
  const radiusOffset = isHalo
    ? (Math.random() - 0.5) * RING_THICKNESS * 3 // wider scatter for halo
    : (Math.random() - 0.5) * RING_THICKNESS;     // tight band

  const r = RING_RADIUS + radiusOffset;

  // Slight z-scatter for depth
  const z = (Math.random() - 0.5) * (isHalo ? 0.6 : 0.15);

  return [Math.cos(angle) * r, Math.sin(angle) * r, z];
}

/**
 * Random scattered position in the initial void.
 */
function scatteredPosition(): [number, number, number] {
  return [
    (Math.random() - 0.5) * SCATTER_RANGE * 2,
    (Math.random() - 0.5) * SCATTER_RANGE * 2,
    (Math.random() - 0.5) * SCATTER_RANGE,
  ];
}

/**
 * Pick a random initial colour from the blue / teal / white palette.
 */
function initialColor(): [number, number, number] {
  const palette: [number, number, number][] = [
    [0.3, 0.6, 1.0],   // soft blue
    [0.2, 0.8, 0.9],   // teal
    [0.4, 0.5, 1.0],   // periwinkle
    [0.85, 0.9, 1.0],  // near-white blue
    [0.1, 0.9, 0.8],   // cyan-teal
    [0.95, 0.95, 1.0],  // white
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

export interface ParticleGateControls {
  /** Full cleanup — remove canvas, dispose GPU resources, unbind listeners */
  destroy: () => void;
  /** Manually override convergence (0 = scattered, 1 = ring formed) */
  setProgress: (p: number) => void;
}

export function initParticleGate(container: HTMLElement): ParticleGateControls {
  // --- Renderer -----------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // --- Scene & Camera -----------------------------------------------------
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.z = 7;

  // --- Build particle geometry --------------------------------------------
  const positions  = new Float32Array(PARTICLE_COUNT * 3);
  const targets    = new Float32Array(PARTICLE_COUNT * 3);
  const randoms    = new Float32Array(PARTICLE_COUNT * 3);
  const delays     = new Float32Array(PARTICLE_COUNT);
  const initColors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const [tx, ty, tz] = ringTarget(i, PARTICLE_COUNT);
    targets[i * 3]     = tx;
    targets[i * 3 + 1] = ty;
    targets[i * 3 + 2] = tz;

    const [rx, ry, rz] = scatteredPosition();
    randoms[i * 3]     = rx;
    randoms[i * 3 + 1] = ry;
    randoms[i * 3 + 2] = rz;

    // Initial draw position = scattered
    positions[i * 3]     = rx;
    positions[i * 3 + 1] = ry;
    positions[i * 3 + 2] = rz;

    // Per-particle stagger delay (0–1)
    delays[i] = Math.random();

    const [cr, cg, cb] = initialColor();
    initColors[i * 3]     = cr;
    initColors[i * 3 + 1] = cg;
    initColors[i * 3 + 2] = cb;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',   new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTarget',    new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute('aRandom',    new THREE.BufferAttribute(randoms, 3));
  geometry.setAttribute('aDelay',     new THREE.BufferAttribute(delays, 1));
  geometry.setAttribute('aInitColor', new THREE.BufferAttribute(initColors, 3));

  // --- Shader material ----------------------------------------------------
  const uniforms = {
    uTime:       { value: 0 },
    uProgress:   { value: 0 },
    uMouse:      { value: new THREE.Vector2(0, 0) },
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

  // --- State --------------------------------------------------------------
  let destroyed = false;
  let animationFrameId = 0;
  let manualProgress: number | null = null; // when non-null, overrides auto
  const clock = new THREE.Clock();

  // --- Mouse tracking -----------------------------------------------------
  const mouse = { x: 0, y: 0 };

  function onMouseMove(e: MouseEvent): void {
    // Normalise to -1…1 relative to container
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

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
  function animate(): void {
    if (destroyed) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    // Auto-convergence: ramp 0→1 over CONVERGE_DURATION seconds
    if (manualProgress !== null) {
      uniforms.uProgress.value = manualProgress;
    } else {
      uniforms.uProgress.value = Math.min(elapsed / CONVERGE_DURATION, 1.0);
    }

    // Smooth mouse lerp for fluid parallax
    uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * 0.05;

    renderer.render(scene, camera);
  }

  animate();

  // --- Public API ---------------------------------------------------------
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;

    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);

    geometry.dispose();
    material.dispose();
    renderer.dispose();

    // Remove canvas from DOM
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  function setProgress(p: number): void {
    manualProgress = Math.max(0, Math.min(1, p));
  }

  return { destroy, setProgress };
}
