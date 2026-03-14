/**
 * Particle Gate — Image-Sampled Three.js Logo Convergence
 *
 * Particles converge from scattered positions into the MPS logo shape,
 * then rest with subtle ambient drift. Mouse parallax shifts the field.
 *
 * Exports `initParticleGate(container, options?)` returning `{ destroy }`.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PARTICLE_COUNT = 7000;
const CONVERGE_DURATION = 3.0;
const SCATTER_RANGE = 8.0;
const BASE_POINT_SIZE = 3.0;

// ---------------------------------------------------------------------------
// Image Sampling
// ---------------------------------------------------------------------------

interface SampledData {
  positions: Float32Array;
  colors: Float32Array;
}

async function sampleLogoImage(src: string, count: number): Promise<SampledData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sampleSize = 200;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      const pixels: { x: number; y: number; r: number; g: number; b: number; brightness: number }[] = [];
      for (let py = 0; py < sampleSize; py++) {
        for (let px = 0; px < sampleSize; px++) {
          const i = (py * sampleSize + px) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          const brightness = (r + g + b) / 3;
          if (brightness > 20 && a > 60) {
            pixels.push({
              x: (px / sampleSize - 0.5),
              y: -(py / sampleSize - 0.5),
              r: r / 255,
              g: g / 255,
              b: b / 255,
              brightness,
            });
          }
        }
      }

      if (pixels.length === 0) {
        reject(new Error('No bright pixels found in logo image'));
        return;
      }

      const weights = pixels.map(p => p.brightness);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const cumulative = new Float64Array(pixels.length);
      cumulative[0] = weights[0] / totalWeight;
      for (let i = 1; i < pixels.length; i++) {
        cumulative[i] = cumulative[i - 1] + weights[i] / totalWeight;
      }

      function weightedSample(): number {
        const r = Math.random();
        let lo = 0, hi = cumulative.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (cumulative[mid] < r) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      }

      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const scale = 5.5;

      for (let i = 0; i < count; i++) {
        const idx = weightedSample();
        const pixel = pixels[idx];
        const jitter = 0.003;
        positions[i * 3]     = pixel.x * scale + (Math.random() - 0.5) * jitter * scale;
        positions[i * 3 + 1] = pixel.y * scale + (Math.random() - 0.5) * jitter * scale;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        colors[i * 3]     = pixel.r;
        colors[i * 3 + 1] = pixel.g;
        colors[i * 3 + 2] = pixel.b;
      }

      resolve({ positions, colors });
    };
    img.onerror = () => reject(new Error(`Failed to load logo image: ${src}`));
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  attribute vec3  aTarget;
  attribute vec3  aScattered;
  attribute vec3  aTargetColor;
  attribute vec3  aInitColor;
  attribute float aDelay;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2  uMouse;
  uniform float uPixelRatio;
  uniform float uGlobalAlpha;

  varying vec3  vColor;
  varying float vAlpha;

  float easeOutCubic(float t) {
    float inv = 1.0 - t;
    return 1.0 - inv * inv * inv;
  }

  void main() {
    float pStart = aDelay * 0.5;
    float raw    = clamp((uProgress - pStart) / (1.0 - pStart), 0.0, 1.0);
    float p      = easeOutCubic(raw);

    vec3 target = aTarget;
    vec3 pos = mix(aScattered, target, p);

    // Ambient drift (sine-based oscillation around logo positions)
    float drift = sin(uTime * 0.8 + aDelay * 6.2831) * 0.03 * p;
    vec3 driftDir = length(target) > 0.001 ? normalize(target) : vec3(0.0, 1.0, 0.0);
    pos += driftDir * drift;

    // Logo pulse
    float pulse = sin(uTime * 0.6 + length(target.xy) * 2.0) * 0.02 * p;
    pos += driftDir * pulse;

    // Mouse parallax
    float parallaxStrength = mix(0.3, 0.05, p);
    pos.x += uMouse.x * parallaxStrength;
    pos.y += uMouse.y * parallaxStrength;

    vColor = mix(aInitColor, aTargetColor, p);
    vAlpha = mix(0.5, 1.0, p) * uGlobalAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float size = ${BASE_POINT_SIZE.toFixed(1)} * uPixelRatio;
    gl_PointSize = size * (300.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, d);
    vec3 glow = vColor * (1.0 + (0.5 - d) * 0.3);
    gl_FragColor = vec4(glow, alpha * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ParticleGateControls {
  destroy: () => void;
}

export interface ParticleGateOptions {
  particleCount?: number;
}

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

export async function initParticleGate(
  container: HTMLElement,
  options?: ParticleGateOptions,
): Promise<ParticleGateControls> {
  const count = options?.particleCount ?? DEFAULT_PARTICLE_COUNT;

  const logo = await sampleLogoImage('/logo/mps-icon-512.png', count);

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
  camera.position.z = 8;

  // --- Build geometry ---
  const allTargets    = new Float32Array(count * 3);
  const allScattered  = new Float32Array(count * 3);
  const allTargetCol  = new Float32Array(count * 3);
  const allInitCol    = new Float32Array(count * 3);
  const allDelays     = new Float32Array(count);
  const dummyPos      = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    allTargets[i3]     = logo.positions[i3];
    allTargets[i3 + 1] = logo.positions[i3 + 1];
    allTargets[i3 + 2] = logo.positions[i3 + 2];

    allTargetCol[i3]     = logo.colors[i3];
    allTargetCol[i3 + 1] = logo.colors[i3 + 1];
    allTargetCol[i3 + 2] = logo.colors[i3 + 2];

    allScattered[i3]     = (Math.random() - 0.5) * SCATTER_RANGE * 2;
    allScattered[i3 + 1] = (Math.random() - 0.5) * SCATTER_RANGE * 2;
    allScattered[i3 + 2] = (Math.random() - 0.5) * SCATTER_RANGE;

    const w = 0.6 + Math.random() * 0.4;
    allInitCol[i3]     = w * 0.4;
    allInitCol[i3 + 1] = w * 0.6;
    allInitCol[i3 + 2] = w;

    allDelays[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',     new THREE.BufferAttribute(dummyPos, 3));
  geometry.setAttribute('aTarget',      new THREE.BufferAttribute(allTargets, 3));
  geometry.setAttribute('aScattered',   new THREE.BufferAttribute(allScattered, 3));
  geometry.setAttribute('aTargetColor', new THREE.BufferAttribute(allTargetCol, 3));
  geometry.setAttribute('aInitColor',   new THREE.BufferAttribute(allInitCol, 3));
  geometry.setAttribute('aDelay',       new THREE.BufferAttribute(allDelays, 1));

  // --- Shader material ---
  const uniforms = {
    uTime:        { value: 0 },
    uProgress:    { value: 0 },
    uMouse:       { value: new THREE.Vector2(0, 0) },
    uPixelRatio:  { value: Math.min(window.devicePixelRatio, 2) },
    uGlobalAlpha: { value: 1.0 },
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

  // --- State ---
  let destroyed = false;
  let animationFrameId = 0;
  const clock = new THREE.Clock();

  // --- Mouse tracking ---
  const mouse = { x: 0, y: 0 };

  function onMouseMove(e: MouseEvent): void {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

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
  function animate(): void {
    if (destroyed) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    uniforms.uProgress.value = Math.min(elapsed / CONVERGE_DURATION, 1.0);

    uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * 0.05;

    renderer.render(scene, camera);
  }

  animate();

  // --- Cleanup ---
  function destroy(): void {
    if (destroyed) return;
    destroyed = true;

    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('mousemove', onMouseMove);
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
