/**
 * Particle Gate — Image-Sampled Three.js Entrance
 *
 * Faithful reproduction of slap-apps.de gate page:
 *   - Center: MPS logo formed from image-sampled particles (high detail)
 *   - Left / Right: Glowing portal arches that slowly rotate
 *   - Background: Star field
 *   - Mouse parallax on entire scene
 *   - Convergence animation: scattered → formed (~3s)
 *   - scatter() for exit transition
 *
 * The logo shape is created by sampling bright pixels from the MPS logo PNG,
 * producing thousands of particles that trace the exact energy ring shape
 * including all wisps and trails — far more detailed than a procedural ring.
 *
 * Exports `initParticleGate(container)` returning a Promise of controls.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOGO_COUNT = 7000;
const GATE_COUNT = 600;   // per gate
const STAR_COUNT = 1800;
const TOTAL = LOGO_COUNT + GATE_COUNT * 2 + STAR_COUNT;

const CONVERGE_DURATION = 3.0;
const SCATTER_RANGE = 8.0;
const BASE_POINT_SIZE = 3.0;

// Gate positions (world X coordinate for each gate center)
const GATE_L_X = -4.5;
const GATE_R_X = 4.5;

// ---------------------------------------------------------------------------
// Image Sampling — extract particle positions + colours from logo PNG
// ---------------------------------------------------------------------------

interface SampledData {
  positions: Float32Array; // [x,y,z] × count
  colors: Float32Array;    // [r,g,b] × count
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

      // Collect all bright pixels with their normalized positions and colours
      const pixels: { x: number; y: number; r: number; g: number; b: number; brightness: number }[] = [];
      for (let py = 0; py < sampleSize; py++) {
        for (let px = 0; px < sampleSize; px++) {
          const i = (py * sampleSize + px) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          const brightness = (r + g + b) / 3;
          if (brightness > 20 && a > 60) {
            pixels.push({
              x: (px / sampleSize - 0.5),
              y: -(py / sampleSize - 0.5), // flip Y
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

      // Weight sampling toward brighter pixels for denser core
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
      const scale = 5.5; // logo width in world units

      for (let i = 0; i < count; i++) {
        const idx = weightedSample();
        const pixel = pixels[idx];

        // Add sub-pixel jitter for smooth density
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
// Procedural Gate Portal — vertical elliptical arch
// ---------------------------------------------------------------------------

function generateGatePortal(
  centerX: number,
  count: number,
  color: [number, number, number],
): SampledData {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const height = 3.5;
  const width = 1.2;
  const tubeThickness = 0.15;

  for (let i = 0; i < count; i++) {
    // Distribute along the ellipse perimeter
    const t = Math.random() * Math.PI * 2;
    // Tube cross-section offset
    const tubeAngle = Math.random() * Math.PI * 2;
    const tubeR = Math.random() * tubeThickness;

    const ex = Math.cos(t) * (width * 0.5);
    const ey = Math.sin(t) * (height * 0.5);

    // Add tube thickness
    const nx = Math.cos(t); // normal direction
    const ny = Math.sin(t);
    const ox = nx * Math.cos(tubeAngle) * tubeR;
    const oy = ny * Math.cos(tubeAngle) * tubeR;
    const oz = Math.sin(tubeAngle) * tubeR;

    positions[i * 3]     = centerX + ex + ox;
    positions[i * 3 + 1] = ey + oy;
    positions[i * 3 + 2] = oz;

    // Color with slight variation
    colors[i * 3]     = Math.min(1, Math.max(0, color[0] + (Math.random() - 0.5) * 0.15));
    colors[i * 3 + 1] = Math.min(1, Math.max(0, color[1] + (Math.random() - 0.5) * 0.15));
    colors[i * 3 + 2] = Math.min(1, Math.max(0, color[2] + (Math.random() - 0.5) * 0.15));
  }

  return { positions, colors };
}

// ---------------------------------------------------------------------------
// Star field background
// ---------------------------------------------------------------------------

function generateStarfield(count: number): SampledData {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3; // pushed back

    // Blue-white tint
    const w = 0.7 + Math.random() * 0.3;
    colors[i * 3]     = w * 0.8;
    colors[i * 3 + 1] = w * 0.9;
    colors[i * 3 + 2] = w;
  }

  return { positions, colors };
}

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  // Per-particle attributes
  attribute vec3  aTarget;       // converged position
  attribute vec3  aScattered;    // initial scattered position
  attribute vec3  aTargetColor;  // final colour
  attribute vec3  aInitColor;    // initial colour (blue-white)
  attribute float aDelay;        // stagger delay 0–1
  attribute float aType;         // 0=logo, 1=gateL, 2=gateR, 3=star

  // Uniforms
  uniform float uTime;
  uniform float uProgress;       // convergence 0→1
  uniform float uScatter;        // scatter-out 0→1
  uniform vec2  uMouse;          // normalised mouse (-1 to 1)
  uniform float uPixelRatio;
  uniform float uGlobalAlpha;

  // Varyings
  varying vec3  vColor;
  varying float vAlpha;

  float easeOutCubic(float t) {
    float inv = 1.0 - t;
    return 1.0 - inv * inv * inv;
  }

  void main() {
    // --- Per-particle staggered progress ---
    float pStart = aDelay * 0.5;
    float raw    = clamp((uProgress - pStart) / (1.0 - pStart), 0.0, 1.0);
    float p      = easeOutCubic(raw);

    // --- Target position (with gate rotation) ---
    vec3 target = aTarget;

    // Gates rotate slowly around their Y axis
    if (aType > 0.5 && aType < 2.5) {
      float cx = aType < 1.5 ? ${GATE_L_X.toFixed(1)} : ${GATE_R_X.toFixed(1)};
      float rotSpeed = aType < 1.5 ? 0.3 : -0.3; // opposite directions
      float angle = uTime * rotSpeed;
      float localX = target.x - cx;
      float localZ = target.z;
      target.x = cx + localX * cos(angle) - localZ * sin(angle);
      target.z = localX * sin(angle) + localZ * cos(angle);
    }

    // --- Position: lerp from scattered → target ---
    vec3 pos = mix(aScattered, target, p);

    // Stars converge quickly (they're already near their final position)
    if (aType > 2.5) {
      pos = mix(aScattered, aTarget, min(p * 2.0, 1.0));
    }

    // --- Scatter outward when uScatter > 0 ---
    if (uScatter > 0.0) {
      vec3 dir = length(target) > 0.001 ? normalize(target) : normalize(aScattered);
      float scatterDist = 10.0 * uScatter * (0.5 + aDelay * 0.5);
      pos += dir * scatterDist;
    }

    // Ambient drift
    float drift = sin(uTime * 0.8 + aDelay * 6.2831) * 0.03 * p;
    vec3 driftDir = length(target) > 0.001 ? normalize(target) : vec3(0.0, 1.0, 0.0);
    pos += driftDir * drift;

    // Logo pulse (type 0 only)
    if (aType < 0.5) {
      float pulse = sin(uTime * 0.6 + length(target.xy) * 2.0) * 0.02 * p;
      pos += driftDir * pulse;
    }

    // Gate glow pulse
    if (aType > 0.5 && aType < 2.5) {
      float gatePulse = sin(uTime * 1.5 + aDelay * 6.28) * 0.06 * p;
      pos.y += gatePulse;
    }

    // --- Mouse parallax ---
    float parallaxStrength = mix(0.3, 0.05, p);
    // Stars get more parallax (depth effect)
    if (aType > 2.5) parallaxStrength = 0.15;
    pos.x += uMouse.x * parallaxStrength;
    pos.y += uMouse.y * parallaxStrength;

    // --- Colour ---
    vColor = mix(aInitColor, aTargetColor, p);

    // Alpha: logo particles brighter, stars dimmer
    float baseAlpha = aType < 0.5 ? mix(0.5, 1.0, p) :    // logo
                      aType < 2.5 ? mix(0.4, 0.9, p) :     // gates
                                    mix(0.2, 0.5, p);       // stars
    vAlpha = baseAlpha * uGlobalAlpha * (1.0 - uScatter * 0.8);

    // --- GL output ---
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size — logo particles slightly larger, stars smaller
    float sizeMult = aType < 0.5 ? 1.0 :
                     aType < 2.5 ? 1.3 :
                                   0.6;
    float size = ${BASE_POINT_SIZE.toFixed(1)} * sizeMult * uPixelRatio;
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

    // Slight glow intensification near center (like slap-apps)
    vec3 glow = vColor * (1.0 + (0.5 - d) * 0.3);

    gl_FragColor = vec4(glow, alpha * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ParticleGateControls {
  destroy: () => void;
  fadeOut: () => void;
  scatter: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Main initialiser (async — needs to load logo image)
// ---------------------------------------------------------------------------

export async function initParticleGate(container: HTMLElement): Promise<ParticleGateControls> {
  // --- Sample logo image for particle positions ---
  const logo = await sampleLogoImage('/logo/mps-icon-512.png', LOGO_COUNT);

  // --- Generate gate portals ---
  // Left gate: amber/gold (matching slap-apps left gate)
  const gateL = generateGatePortal(GATE_L_X, GATE_COUNT, [0.95, 0.75, 0.25]);
  // Right gate: fuchsia/pink (matching slap-apps right gate)
  const gateR = generateGatePortal(GATE_R_X, GATE_COUNT, [0.85, 0.30, 0.90]);

  // --- Background stars ---
  const stars = generateStarfield(STAR_COUNT);

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

  // --- Build combined geometry ---
  const allTargets    = new Float32Array(TOTAL * 3);
  const allScattered  = new Float32Array(TOTAL * 3);
  const allTargetCol  = new Float32Array(TOTAL * 3);
  const allInitCol    = new Float32Array(TOTAL * 3);
  const allDelays     = new Float32Array(TOTAL);
  const allTypes      = new Float32Array(TOTAL);
  const dummyPos      = new Float32Array(TOTAL * 3);

  let offset = 0;

  // Helper to write a segment
  function writeSegment(
    data: SampledData,
    type: number,
    start: number,
    count: number,
  ) {
    for (let i = 0; i < count; i++) {
      const idx = start + i;
      const i3 = idx * 3;
      const s3 = i * 3;

      // Target position
      allTargets[i3]     = data.positions[s3];
      allTargets[i3 + 1] = data.positions[s3 + 1];
      allTargets[i3 + 2] = data.positions[s3 + 2];

      // Target colour
      allTargetCol[i3]     = data.colors[s3];
      allTargetCol[i3 + 1] = data.colors[s3 + 1];
      allTargetCol[i3 + 2] = data.colors[s3 + 2];

      // Scattered position
      if (type === 3) {
        // Stars: scatter near their final position
        allScattered[i3]     = data.positions[s3] + (Math.random() - 0.5) * 3;
        allScattered[i3 + 1] = data.positions[s3 + 1] + (Math.random() - 0.5) * 3;
        allScattered[i3 + 2] = data.positions[s3 + 2] + (Math.random() - 0.5) * 2;
      } else {
        allScattered[i3]     = (Math.random() - 0.5) * SCATTER_RANGE * 2;
        allScattered[i3 + 1] = (Math.random() - 0.5) * SCATTER_RANGE * 2;
        allScattered[i3 + 2] = (Math.random() - 0.5) * SCATTER_RANGE;
      }

      // Initial colour: blue-white for all
      const w = 0.6 + Math.random() * 0.4;
      allInitCol[i3]     = w * 0.4;
      allInitCol[i3 + 1] = w * 0.6;
      allInitCol[i3 + 2] = w;

      // Delay and type
      allDelays[idx] = Math.random();
      allTypes[idx] = type;
    }
  }

  writeSegment(logo,  0, offset, LOGO_COUNT); offset += LOGO_COUNT;
  writeSegment(gateL, 1, offset, GATE_COUNT); offset += GATE_COUNT;
  writeSegment(gateR, 2, offset, GATE_COUNT); offset += GATE_COUNT;
  writeSegment(stars, 3, offset, STAR_COUNT);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',    new THREE.BufferAttribute(dummyPos, 3));
  geometry.setAttribute('aTarget',     new THREE.BufferAttribute(allTargets, 3));
  geometry.setAttribute('aScattered',  new THREE.BufferAttribute(allScattered, 3));
  geometry.setAttribute('aTargetColor',new THREE.BufferAttribute(allTargetCol, 3));
  geometry.setAttribute('aInitColor',  new THREE.BufferAttribute(allInitCol, 3));
  geometry.setAttribute('aDelay',      new THREE.BufferAttribute(allDelays, 1));
  geometry.setAttribute('aType',       new THREE.BufferAttribute(allTypes, 1));

  // --- Shader material ---
  const uniforms = {
    uTime:        { value: 0 },
    uProgress:    { value: 0 },
    uScatter:     { value: 0 },
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

  let scatterTarget = 0;
  let globalAlphaTarget = 1.0;

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

    // Auto-convergence
    uniforms.uProgress.value = Math.min(elapsed / CONVERGE_DURATION, 1.0);

    // Smooth lerp scatter and globalAlpha
    uniforms.uScatter.value += (scatterTarget - uniforms.uScatter.value) * 0.08;
    uniforms.uGlobalAlpha.value += (globalAlphaTarget - uniforms.uGlobalAlpha.value) * 0.06;

    // Stop rendering when fully transparent
    if (uniforms.uGlobalAlpha.value < 0.01 && globalAlphaTarget === 0.0) {
      return;
    }

    // Smooth mouse
    uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * 0.05;

    renderer.render(scene, camera);
  }

  animate();

  // --- Public API ---
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

  function fadeOut(): void {
    globalAlphaTarget = 0.3;
  }

  function scatter(): Promise<void> {
    scatterTarget = 1.0;
    globalAlphaTarget = 0.0;
    return new Promise((resolve) => {
      setTimeout(resolve, 900);
    });
  }

  return { destroy, fadeOut, scatter };
}
