# Phase 3: Three.js Interactive Effects — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add particle logo convergence to the homepage hero and scroll-driven morphing experience to `/experience`, with tiered performance fallbacks.

**Architecture:** Vanilla Three.js scripts wrapped in React client components via `useRef` + `useEffect`. Dynamic imports (`ssr: false`) keep Three.js out of the main bundle. GPU tier detection drives particle counts and static fallbacks.

**Tech Stack:** Three.js, Next.js 15 dynamic imports, custom GLSL shaders, CSS fallbacks

---

## File Map

### New Files
| File | Responsibility |
|---|---|
| `src/lib/three/gpu-detect.ts` | Pure function: WebGL check + FPS benchmark → tier 1/2/3 |
| `src/components/three/useReducedMotion.ts` | React hook: `prefers-reduced-motion` media query |
| `src/components/three/useGpuTier.ts` | React hook: combines gpu-detect + reduced motion → `{ tier, loading, particleCount }` |
| `src/components/three/ParticleGate.tsx` | Client component: homepage particle logo (wraps `initParticleGate`) |
| `src/components/three/ParticleExperience.tsx` | Client component: experience page scroll particles (wraps `initParticleExperience`) |

### Modified Files
| File | Changes |
|---|---|
| `package.json` | Add `three` + `@types/three` dependencies |
| `src/scripts/particle-gate.ts` | Remove gates/starfield/scatter, add ambient drift, accept `particleCount` option |
| `src/scripts/particle-experience.ts` | Replace wave with cloud shape, accept `particleCount`, update colors, clamp scroll to morph sections |
| `src/app/(public)/page.tsx` | Add ParticleGate behind hero with positioning wrapper |
| `src/app/(public)/experience/page.tsx` | Rewrite as client component with ParticleExperience + hardcoded labels |
| `src/types/content.ts` | Remove `ExperiencePageContent` interface |

---

## Chunk 1: Infrastructure + Particle Gate + Homepage

### Task 1: Install Three.js dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install three and its types**

```bash
npm install three && npm install -D @types/three
```

- [ ] **Step 2: Verify installation**

```bash
grep '"three"' package.json && echo "three OK"
```

Expected: `three OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three.js dependency"
```

---

### Task 2: GPU detection utility

**Files:**
- Create: `src/lib/three/gpu-detect.ts`

- [ ] **Step 1: Create the GPU detection function**

```typescript
// src/lib/three/gpu-detect.ts

export type GpuTier = 1 | 2 | 3;

const CACHE_KEY = 'mps-gpu-tier';

/**
 * Detect GPU capability by running a small WebGL FPS test.
 * Returns tier 1 (full), 2 (reduced), or 3 (no WebGL).
 * Result is cached in sessionStorage.
 */
export async function detectGpuTier(): Promise<GpuTier> {
  // Check cache first
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached === '1' || cached === '2' || cached === '3') {
      return Number(cached) as GpuTier;
    }
  }

  // Check WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    cacheTier(3);
    return 3;
  }

  // FPS benchmark: render a simple scene for ~10 frames
  const tier = await runFpsBenchmark(gl as WebGLRenderingContext, canvas);
  cacheTier(tier);
  return tier;
}

function cacheTier(tier: GpuTier): void {
  try {
    sessionStorage.setItem(CACHE_KEY, String(tier));
  } catch {
    // sessionStorage unavailable (e.g., private browsing quota)
  }
}

function runFpsBenchmark(gl: WebGLRenderingContext, canvas: HTMLCanvasElement): Promise<GpuTier> {
  return new Promise((resolve) => {
    canvas.width = 256;
    canvas.height = 256;

    let frames = 0;
    const startTime = performance.now();
    const targetFrames = 10;

    function tick() {
      // Draw something simple to exercise the GPU
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      frames++;

      if (frames >= targetFrames) {
        const elapsed = performance.now() - startTime;
        const fps = (frames / elapsed) * 1000;
        // Clean up the test context
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
        resolve(fps >= 30 ? 1 : 2);
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit src/lib/three/gpu-detect.ts 2>&1 || echo "Check errors above"
```

Expected: No errors (or only module resolution warnings in isolation — full build check at end)

- [ ] **Step 3: Commit**

```bash
git add src/lib/three/gpu-detect.ts
git commit -m "feat: add GPU tier detection utility"
```

---

### Task 3: React hooks (useReducedMotion + useGpuTier)

**Files:**
- Create: `src/components/three/useReducedMotion.ts`
- Create: `src/components/three/useGpuTier.ts`

- [ ] **Step 1: Create useReducedMotion hook**

```typescript
// src/components/three/useReducedMotion.ts
'use client';

import { useEffect, useState } from 'react';

/** Returns true if the user prefers reduced motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    function onChange(e: MediaQueryListEvent) {
      setReduced(e.matches);
    }

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 2: Create useGpuTier hook**

```typescript
// src/components/three/useGpuTier.ts
'use client';

import { useEffect, useState } from 'react';
import { detectGpuTier, type GpuTier } from '@/lib/three/gpu-detect';
import { useReducedMotion } from './useReducedMotion';

interface GpuTierResult {
  tier: GpuTier | null;
  loading: boolean;
  particleCount: number;
}

/**
 * Combines GPU detection with reduced-motion preference.
 * While loading, tier is null and components should render the static fallback.
 */
export function useGpuTier(context: 'gate' | 'experience'): GpuTierResult {
  const reducedMotion = useReducedMotion();
  const [tier, setTier] = useState<GpuTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reducedMotion) {
      setTier(3);
      setLoading(false);
      return;
    }

    detectGpuTier().then((detected) => {
      setTier(detected);
      setLoading(false);
    });
  }, [reducedMotion]);

  const counts: Record<GpuTier, number> = context === 'gate'
    ? { 1: 7000, 2: 2000, 3: 0 }
    : { 1: 5000, 2: 1500, 3: 0 };

  const effectiveTier = tier ?? 3; // fallback to static while loading
  return {
    tier,
    loading,
    particleCount: counts[effectiveTier],
  };
}
```

- [ ] **Step 3: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/three/useReducedMotion.ts src/components/three/useGpuTier.ts
git commit -m "feat: add useReducedMotion and useGpuTier hooks"
```

---

### Task 4: Modify particle-gate.ts

**Files:**
- Modify: `src/scripts/particle-gate.ts`

This is the largest task. The existing script has 556 lines. Key changes:
1. Remove gate portal generation (`generateGatePortal` function, `GATE_COUNT`, `GATE_L_X`, `GATE_R_X`)
2. Remove starfield generation (`generateStarfield` function, `STAR_COUNT`)
3. Remove `scatter()` and `fadeOut()` exports
4. Remove all gate/star-related GLSL branches (`aType > 0.5`, etc.)
5. Accept `particleCount` option (default 7000)
6. Add stronger ambient drift in resting state (sine-based, ~2-3px)
7. Simplify `TOTAL` to just `particleCount`
8. Remove `uScatter` uniform and related GLSL code

- [ ] **Step 1: Replace the full particle-gate.ts with simplified version**

Replace the entire file content with:

```typescript
// src/scripts/particle-gate.ts
/**
 * Particle Gate — Image-Sampled Logo Convergence
 *
 * Particles scatter on load, converge into the MPS logo (~3s),
 * then hold with subtle ambient drift. Mouse parallax on scene.
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
// Image Sampling — extract particle positions + colours from logo PNG
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

      // Collect bright pixels with positions and colours
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
              r: r / 255, g: g / 255, b: b / 255,
              brightness,
            });
          }
        }
      }

      if (pixels.length === 0) {
        reject(new Error('No bright pixels found in logo image'));
        return;
      }

      // Weighted sampling toward brighter pixels
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
// GLSL Shaders (logo particles only — no gates, no stars)
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

  varying vec3  vColor;
  varying float vAlpha;

  float easeOutCubic(float t) {
    float inv = 1.0 - t;
    return 1.0 - inv * inv * inv;
  }

  void main() {
    // Per-particle staggered convergence
    float pStart = aDelay * 0.5;
    float raw    = clamp((uProgress - pStart) / (1.0 - pStart), 0.0, 1.0);
    float p      = easeOutCubic(raw);

    // Position: scattered → target logo position
    vec3 pos = mix(aScattered, aTarget, p);

    // Ambient drift — sine-based oscillation around logo position (~2-3px)
    float driftX = sin(uTime * 0.8 + aDelay * 6.2831) * 0.04 * p;
    float driftY = cos(uTime * 0.6 + aDelay * 4.7124) * 0.03 * p;
    pos.x += driftX;
    pos.y += driftY;

    // Logo pulse (subtle breathing)
    float pulse = sin(uTime * 0.6 + length(aTarget.xy) * 2.0) * 0.02 * p;
    vec3 pDir = length(aTarget) > 0.001 ? normalize(aTarget) : vec3(0.0, 1.0, 0.0);
    pos += pDir * pulse;

    // Mouse parallax
    float parallax = mix(0.3, 0.05, p);
    pos.x += uMouse.x * parallax;
    pos.y += uMouse.y * parallax;

    // Colour: initial blue-white → sampled logo colour
    vColor = mix(aInitColor, aTargetColor, p);
    vAlpha = mix(0.5, 1.0, p);

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

    // Glow intensification near center
    vec3 glow = vColor * (1.0 + (0.5 - d) * 0.3);
    gl_FragColor = vec4(glow, alpha * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ParticleGateOptions {
  particleCount?: number;
  enableParallax?: boolean;
}

export interface ParticleGateControls {
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

export async function initParticleGate(
  container: HTMLElement,
  options: ParticleGateOptions = {},
): Promise<ParticleGateControls> {
  const count = options.particleCount ?? DEFAULT_PARTICLE_COUNT;
  const enableParallax = options.enableParallax ?? true;

  const logo = await sampleLogoImage('/logo/mps-icon-512.png', count);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.z = 8;

  // Build geometry — logo particles only
  const allTargets   = new Float32Array(count * 3);
  const allScattered = new Float32Array(count * 3);
  const allTargetCol = new Float32Array(count * 3);
  const allInitCol   = new Float32Array(count * 3);
  const allDelays    = new Float32Array(count);
  const dummyPos     = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Target position (logo)
    allTargets[i3]     = logo.positions[i3];
    allTargets[i3 + 1] = logo.positions[i3 + 1];
    allTargets[i3 + 2] = logo.positions[i3 + 2];

    // Target colour (logo)
    allTargetCol[i3]     = logo.colors[i3];
    allTargetCol[i3 + 1] = logo.colors[i3 + 1];
    allTargetCol[i3 + 2] = logo.colors[i3 + 2];

    // Scattered position (random in volume)
    allScattered[i3]     = (Math.random() - 0.5) * SCATTER_RANGE * 2;
    allScattered[i3 + 1] = (Math.random() - 0.5) * SCATTER_RANGE * 2;
    allScattered[i3 + 2] = (Math.random() - 0.5) * SCATTER_RANGE;

    // Initial colour: blue-white
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

  // Shader material
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

  // State
  let destroyed = false;
  let animationFrameId = 0;
  const clock = new THREE.Clock();
  const mouse = { x: 0, y: 0 };

  // Mouse tracking
  function onMouseMove(e: MouseEvent): void {
    if (!enableParallax) return;
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // Resize
  function onResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  window.addEventListener('resize', onResize, { passive: true });

  // Animation loop
  function animate(): void {
    if (destroyed) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;
    uniforms.uProgress.value = Math.min(elapsed / CONVERGE_DURATION, 1.0);

    // Smooth mouse
    uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * 0.05;
    uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * 0.05;

    renderer.render(scene, camera);
  }

  animate();

  // Cleanup
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
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors related to `particle-gate.ts`

- [ ] **Step 3: Commit**

```bash
git add src/scripts/particle-gate.ts
git commit -m "refactor: simplify particle-gate to logo-only with ambient drift"
```

---

### Task 5: ParticleGate React component

**Files:**
- Create: `src/components/three/ParticleGate.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/three/ParticleGate.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useGpuTier } from './useGpuTier';
import type { ParticleGateControls } from '@/scripts/particle-gate';

export function ParticleGate() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ParticleGateControls | null>(null);
  const { tier, loading, particleCount } = useGpuTier('gate');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading || tier === 3 || tier === null) return;

    let cancelled = false;

    import('@/scripts/particle-gate').then(({ initParticleGate }) => {
      if (cancelled) return;
      initParticleGate(container, {
        particleCount,
        enableParallax: tier === 1,
      }).then((controls) => {
        if (cancelled) {
          controls.destroy();
          return;
        }
        controlsRef.current = controls;
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      controlsRef.current?.destroy();
      controlsRef.current = null;
      setReady(false);
    };
  }, [tier, loading, particleCount]);

  return (
    <div className="absolute inset-0 z-0">
      {/* Static fallback: shown while loading or on tier 3 */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-48 h-48">
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/mps-icon-512.png" alt="MPS" className="relative w-full h-full object-contain opacity-80" />
          </div>
        </div>
      )}

      {/* Three.js canvas mounts here */}
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/three/ParticleGate.tsx
git commit -m "feat: add ParticleGate React component with tier fallbacks"
```

---

### Task 6: Integrate ParticleGate into homepage

**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Add ParticleGate behind hero**

Replace the current `src/app/(public)/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getPage } from '@/lib/content';
import { HeroSection } from '@/components/sections/HeroSection';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { CtaBanner } from '@/components/sections/CtaBanner';
import { TrustBar } from '@/components/sections/TrustBar';
import { Button } from '@/components/ui/Button';
import type { HomePageContent } from '@/types/content';

const ParticleGate = dynamic(
  () => import('@/components/three/ParticleGate').then((m) => m.ParticleGate),
  { ssr: false },
);

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home');
  return { title: page?.title || 'MPS — From Strategy to Deployment', description: page?.description || undefined };
}

export default async function HomePage() {
  const page = await getPage('home');
  const content = page?.content as unknown as HomePageContent | undefined;

  return (
    <div className="space-y-24 pb-12">
      {/* Hero with particle background */}
      <div className="relative">
        <ParticleGate />
        <div className="relative z-10">
          {content?.hero && (
            <HeroSection
              headline={content.hero.headline}
              subheadline={content.hero.subheadline}
              ctaPrimary={{ label: content.hero.cta_primary?.label || 'See Our Work', href: content.hero.cta_primary?.href || '/portfolio' }}
              ctaSecondary={{ label: content.hero.cta_secondary?.label || 'Talk to Us', href: content.hero.cta_secondary?.href || '/contact' }}
            />
          )}
        </div>
      </div>

      <TrustBar />

      {/* Services preview */}
      {content?.services_preview && (
        <section id="services" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="What We Build" heading={content.services_preview.heading} />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.services_preview.items.map((item, i) => (
                <GlassCard key={item.name} hover data-reveal="fade-up" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
                  <h3 className="text-lg font-bold text-text-primary">{item.name}</h3>
                  <p className="text-sm text-text-muted mt-2">{item.blurb}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio teaser */}
      {content?.portfolio_teaser && (
        <section id="portfolio" className="px-6">
          <div className="mx-auto max-w-4xl" data-reveal="fade-up">
            <SectionHeading eyebrow="From the Field" heading={content.portfolio_teaser.heading} />
            <GlassCard className="mt-8 space-y-4">
              <h3 className="text-xl font-bold text-text-primary">{content.portfolio_teaser.project_name}</h3>
              <p className="text-accent font-mono text-sm">{content.portfolio_teaser.outcome}</p>
              <p className="text-text-muted">{content.portfolio_teaser.teaser_text}</p>
              <Button href={content.portfolio_teaser.cta?.href} size="sm">
                {content.portfolio_teaser.cta?.label}
              </Button>
            </GlassCard>
          </div>
        </section>
      )}

      {/* About preview */}
      {content?.about_preview && (
        <section id="about" className="px-6">
          <div className="mx-auto max-w-4xl" data-reveal="fade-up">
            <SectionHeading eyebrow="Who We Are" heading={content.about_preview.heading} />
            <p className="text-text-muted mt-4">{content.about_preview.text}</p>
            <Button href={content.about_preview.cta?.href} variant="ghost" className="mt-6">
              {content.about_preview.cta?.label}
            </Button>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      {content?.cta_banner && (
        <CtaBanner
          heading={content.cta_banner.heading}
          subtext={content.cta_banner.subtext}
          ctaLabel={content.cta_banner.cta_label}
          ctaHref={content.cta_banner.cta_href}
        />
      )}
    </div>
  );
}
```

The key changes: wrap the hero in `<div className="relative">` with `<ParticleGate />` (z-0) inside it, and wrap the `<HeroSection>` in `<div className="relative z-10">` to guarantee it stacks above the canvas.

- [ ] **Step 2: Verify build compiles**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build succeeds, `/` route shows in output

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/page.tsx"
git commit -m "feat: integrate ParticleGate into homepage hero"
```

---

## Chunk 2: Particle Experience + Experience Page + Cleanup

### Task 7: Modify particle-experience.ts

**Files:**
- Modify: `src/scripts/particle-experience.ts`

Changes:
1. Replace `waveShape` with `cloudShape` (scattered random positions)
2. Accept `particleCount` parameter (default 5000)
3. Update color palette: blue-teal → purple → near-white
4. Accept `scrollRangeElement` option for clamped scroll normalization

- [ ] **Step 1: Replace particle-experience.ts with updated version**

```typescript
// src/scripts/particle-experience.ts
/**
 * Particle Experience — Scroll-Driven Morphing
 *
 * "From data to intelligence" — particles morph through three stages:
 *   Stage 1 (0–33%): Scattered particle cloud (Raw Data)
 *   Stage 2 (33–66%): 3D network grid (Connected)
 *   Stage 3 (66–100%): Globe with orbital ring (Intelligent)
 *
 * Scroll is normalised to 0–1 based on the morph section range (not full page).
 * Lerped smoothly with factor 0.04.
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
  uniform float uScroll;     // smoothed 0–1 across morph sections
  uniform float uPixelRatio;

  varying vec3  vColor;
  varying float vAlpha;

  // Stage 1: scattered particle cloud (Raw Data)
  vec3 cloudShape(float idx, float rnd, float time) {
    // Deterministic random-looking positions based on index + seed
    float x = (sin(idx * 123.456 + rnd * 789.0) * 2.0 - 1.0) * 6.0;
    float y = (cos(idx * 456.789 + rnd * 321.0) * 2.0 - 1.0) * 4.0;
    float z = (sin(idx * 789.123 + rnd * 654.0) * 2.0 - 1.0) * 4.0;
    // Gentle drift over time
    x += sin(time * 0.3 + rnd * 6.28) * 0.5;
    y += cos(time * 0.2 + idx * 3.14) * 0.3;
    return vec3(x, y, z);
  }

  // Stage 2: 3D network grid (Connected)
  vec3 networkShape(float idx, float rnd) {
    float gridSize = 6.0;
    float spacing = 3.0;
    float total = gridSize * gridSize * gridSize;
    float i = mod(floor(idx * ${particleCount}.0), total);
    float z = floor(i / (gridSize * gridSize));
    float rem = i - z * gridSize * gridSize;
    float y = floor(rem / gridSize);
    float x = rem - y * gridSize;
    vec3 pos = (vec3(x, y, z) - vec3(gridSize * 0.5 - 0.5)) * (spacing / gridSize) * 3.0;
    pos += (rnd - 0.5) * 0.3;
    return pos;
  }

  // Stage 3: globe with orbital ring (Intelligent)
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

  // Stage 1: cool blue-teal
  vec3 colorStage1(float rnd) {
    vec3 blue = vec3(0.231, 0.510, 0.965); // #3b82f6
    vec3 teal = vec3(0.024, 0.714, 0.831); // #06b6d4
    return mix(blue, teal, rnd);
  }

  // Stage 2: purple
  vec3 colorStage2(float rnd) {
    vec3 purple1 = vec3(0.545, 0.361, 0.965); // #8b5cf6
    vec3 purple2 = vec3(0.486, 0.228, 0.929); // #7c3aed
    return mix(purple1, purple2, rnd);
  }

  // Stage 3: near-white with lavender
  vec3 colorStage3(float rnd) {
    vec3 lavender = vec3(0.769, 0.710, 0.992); // #c4b5fd
    vec3 white = vec3(0.973, 0.973, 0.988);     // #f8f8fc
    return mix(lavender, white, smoothstep(0.3, 1.0, rnd));
  }

  void main() {
    float phase = uScroll * 2.0; // 0–2 (two transitions)

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
    gl_Position  = projectionMatrix * mvPosition;

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

export interface ParticleExperienceOptions {
  particleCount?: number;
  /** Element whose bottom edge defines the end of the scroll range (for clamping). */
  scrollRangeEnd?: HTMLElement | null;
}

export interface ParticleExperienceControls {
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Main initialiser
// ---------------------------------------------------------------------------

export function initParticleExperience(
  container: HTMLElement,
  options: ParticleExperienceOptions = {},
): ParticleExperienceControls {
  const count = options.particleCount ?? DEFAULT_PARTICLE_COUNT;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.z = 10;

  // Particle geometry
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

  // Shader material
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

  // Scroll handling — clamped to morph sections
  let scrollTarget = 0;
  let smoothScroll = 0;

  function onScroll(): void {
    const rangeEnd = options.scrollRangeEnd;
    let maxScroll: number;

    if (rangeEnd) {
      // Clamp to the bottom of the last morph section
      const rect = rangeEnd.getBoundingClientRect();
      const endOffset = window.scrollY + rect.bottom - window.innerHeight;
      maxScroll = Math.max(endOffset, 1);
    } else {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    }

    scrollTarget = Math.min(window.scrollY / maxScroll, 1.0);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Resize
  function onResize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  window.addEventListener('resize', onResize, { passive: true });

  // Animation loop
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

  // Cleanup
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
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts/particle-experience.ts
git commit -m "refactor: update particle-experience with cloud shape, new colors, clamped scroll"
```

---

### Task 8: ParticleExperience React component

**Files:**
- Create: `src/components/three/ParticleExperience.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/three/ParticleExperience.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useGpuTier } from './useGpuTier';
import type { ParticleExperienceControls } from '@/scripts/particle-experience';

interface ParticleExperienceProps {
  /** Ref to the last morph section element — scroll is clamped to its bottom */
  scrollRangeEnd: HTMLElement | null;
}

export function ParticleExperience({ scrollRangeEnd }: ParticleExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ParticleExperienceControls | null>(null);
  const { tier, loading, particleCount } = useGpuTier('experience');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading || tier === 3 || tier === null) return;

    let cancelled = false;

    import('@/scripts/particle-experience').then(({ initParticleExperience }) => {
      if (cancelled) return;
      const controls = initParticleExperience(container, {
        particleCount,
        scrollRangeEnd,
      });
      if (cancelled) {
        controls.destroy();
        return;
      }
      controlsRef.current = controls;
      setReady(true);
    });

    return () => {
      cancelled = true;
      controlsRef.current?.destroy();
      controlsRef.current = null;
      setReady(false);
    };
  }, [tier, loading, particleCount, scrollRangeEnd]);

  // Tier 3 static fallback: gradient backgrounds handled by the page itself
  if (tier === 3 && !loading) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/three/ParticleExperience.tsx
git commit -m "feat: add ParticleExperience React component"
```

---

### Task 9: Rewrite experience page

**Files:**
- Modify: `src/app/(public)/experience/page.tsx`

- [ ] **Step 1: Replace experience page with client component**

```tsx
// src/app/(public)/experience/page.tsx
'use client';

import { useCallback, useState } from 'react';
import { ParticleExperience } from '@/components/three/ParticleExperience';
import { useGpuTier } from '@/components/three/useGpuTier';
import { Button } from '@/components/ui/Button';

const STAGES = [
  { id: 'raw-data', label: 'Raw Data', sublabel: 'scattered, unstructured, potential', gradient: 'from-blue-500/10 to-cyan-500/10' },
  { id: 'connected', label: 'Connected', sublabel: 'patterns emerge, systems form', gradient: 'from-violet-500/10 to-purple-500/10' },
  { id: 'intelligent', label: 'Intelligent', sublabel: 'deployed, autonomous, evolving', gradient: 'from-purple-300/10 to-white/5' },
] as const;

export default function ExperiencePage() {
  // Use callback ref instead of useRef so ParticleExperience re-renders when element mounts
  const [lastSection, setLastSection] = useState<HTMLElement | null>(null);
  const lastSectionRef = useCallback((el: HTMLElement | null) => setLastSection(el), []);
  const { tier } = useGpuTier('experience');
  const isStatic = tier === 3;

  return (
    <div className="relative">
      {/* Fixed particle canvas (behind everything) */}
      <ParticleExperience scrollRangeEnd={lastSection} />

      {/* Scrollable content on top */}
      <div className="relative z-10">
        {STAGES.map((stage, i) => (
          <section
            key={stage.id}
            id={stage.id}
            ref={i === STAGES.length - 1 ? lastSectionRef : undefined} /* callback ref triggers state update */
            className={`min-h-screen flex items-center justify-center ${isStatic ? `bg-gradient-to-br ${stage.gradient}` : ''}`}
          >
            <div className="text-center" data-reveal="fade">
              <span className="font-mono text-sm text-accent/50 tracking-widest uppercase">
                {stage.label}
              </span>
              <p className="text-text-muted text-sm mt-2">{stage.sublabel}</p>
            </div>
          </section>
        ))}

        {/* Brand + CTA footer */}
        <section className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center space-y-8" data-reveal="fade-up">
            <h2 className="text-5xl sm:text-7xl font-bold text-text-primary leading-none">
              MISSING<br />
              <span className="text-accent">PIECE</span><br />
              SOLUTIONS
            </h2>
            <p className="text-text-muted text-sm">
              AI systems that close the gap between ambition and outcome.
            </p>
            <Button href="/contact">Get in Touch</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
```

**Key design decisions:**
- `lastSectionRef` is attached to the third morph section — `ParticleExperience` uses it to clamp scroll range
- Static fallback uses Tailwind gradient backgrounds per stage
- Labels use `font-mono text-accent/50` consistent with site eyebrow style
- `data-reveal="fade"` integrates with existing ScrollRevealInit

- [ ] **Step 2: Verify build compiles**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build succeeds, `/experience` route shows in output

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/experience/page.tsx"
git commit -m "feat: rewrite experience page with scroll-driven particle morphing"
```

---

### Task 10: Remove ExperiencePageContent type

**Files:**
- Modify: `src/types/content.ts`

- [ ] **Step 1: Remove the ExperiencePageContent interface**

Delete the `ExperiencePageContent` interface from `src/types/content.ts`. The experience page no longer fetches content from Supabase.

The interface to remove:
```typescript
export interface ExperiencePageContent {
  particleConfig: {
    particleSize: number;
    scrollSpeed: number;
    colorPalette: string[];
  };
  sections: Array<{
    type: 'morph' | 'scatter' | 'converge';
    shape?: 'sphere' | 'grid' | 'ring';
    label?: string;
    content: { heading: string; body: string };
  }>;
  footerNav: Array<{ label: string; href: string }>;
}
```

- [ ] **Step 2: Verify no other files import ExperiencePageContent**

```bash
grep -r "ExperiencePageContent" src/ --include="*.ts" --include="*.tsx"
```

Expected: No results (the experience page no longer uses it)

- [ ] **Step 3: Commit**

```bash
git add src/types/content.ts
git commit -m "chore: remove unused ExperiencePageContent type"
```

---

### Task 11: Final build verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

```bash
npm run build 2>&1
```

Expected: Build succeeds. All routes compile. Key routes to verify in output:
- `/` (homepage with ParticleGate)
- `/experience` (client-rendered with ParticleExperience)
- All other existing routes still present

- [ ] **Step 2: Verify Three.js is code-split**

Check that `three` is NOT in the shared chunks — it should only appear in page-specific chunks:

```bash
npm run build 2>&1 | grep -i "three"
```

Expected: No `three` in shared chunks. It appears in route-specific chunks for `/` and `/experience`.

- [ ] **Step 3: Quick dev server smoke test**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -o "ParticleGate\|particle-gate" | head -1 || echo "Dynamic import - not in SSR HTML (expected)"
kill %1 2>/dev/null
```

Expected: "Dynamic import - not in SSR HTML (expected)" — confirms Three.js is client-only.

- [ ] **Step 4: Commit any remaining changes and verify clean state**

```bash
git status
```

Expected: Nothing to commit, working tree clean.
