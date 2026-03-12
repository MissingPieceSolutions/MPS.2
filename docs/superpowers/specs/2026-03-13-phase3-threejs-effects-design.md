# Phase 3: Three.js Interactive Effects — Design Spec

## Goal

Add two interactive Three.js particle systems to the MPS site: a particle logo convergence on the homepage hero and a scroll-driven "technology evolution" experience on the `/experience` page. Effects prioritize brand impression (technical sophistication), storytelling (data → connections → intelligence), and engagement.

## Architecture

Vanilla Three.js wrapped in React client components via `useRef` + `useEffect`. No React Three Fiber — keeps the bundle small and reuses existing shader code from `src/scripts/`. Three.js is dynamically imported (code-split) so it only loads on pages that need it.

## Tech Stack

- Three.js (vanilla, new dependency)
- Next.js 15 `dynamic()` with `ssr: false`
- Existing custom GLSL vertex/fragment shaders
- CSS fallbacks for static tier

---

## Component Structure

```
src/
  components/three/
    ParticleGate.tsx          — Homepage hero particle logo
    ParticleExperience.tsx    — /experience scroll-driven system
    useReducedMotion.ts       — prefers-reduced-motion hook
    useGpuTier.ts             — device capability detection hook
  lib/three/
    gpu-detect.ts             — pure GPU tier detection function
  scripts/
    particle-gate.ts          — (existing, modified) Three.js particle gate system
    particle-experience.ts    — (existing, modified) Three.js experience system
```

---

## Homepage: Particle Logo Convergence

### Behavior

1. **Page load** — particles appear scattered/drifting across the viewport
2. **Convergence** — particles assemble into the MPS logo shape (~3 second animation, staggered)
3. **Resting state** — logo shape persists with subtle ambient drift (particles oscillate ~2-3px around their logo positions via sine-based offset). Mouse parallax shifts the entire field slightly.
4. **Scrolling** — logo remains in place as content scrolls over it. No scatter on scroll.

### Integration

- Homepage `page.tsx` stays a server component
- `ParticleGate` imported via `dynamic(() => import(...), { ssr: false })`
- Renders as `position: absolute; inset: 0; z-index: 0` behind the hero
- `HeroSection` gets `position: relative; z-index: 1`
- Rest of the page scrolls naturally over the particle logo

### Script Modifications (`particle-gate.ts`)

- Remove scatter/exit animation — logo is the permanent resting state
- Add ambient drift (sine-based oscillation around logo positions)
- Accept `particleCount` parameter for tier-based scaling
- Simplified export: `initParticleGate(container, options?) → { destroy }`
- Keep mouse parallax (existing behavior)
- Image sampling from `/logo/mps-icon-512.png` (existing behavior)

---

## Experience Page: Scroll-Driven Technology Evolution

### Narrative

"From data to intelligence" — particles morph through three stages representing the technology evolution that MPS delivers:

| Scroll Position | Morph Stage | Label | Sublabel |
|---|---|---|---|
| 0–33% | Particle cloud | **"Raw Data"** | scattered, unstructured, potential |
| 33–66% | Neural network grid | **"Connected"** | patterns emerge, systems form |
| 66–100% | Coherent sphere | **"Intelligent"** | deployed, autonomous, evolving |

### Behavior

- `ParticleExperience` renders as `position: fixed` full-viewport canvas
- Text labels are `position: relative` sections that scroll over the fixed canvas
- Each section is full viewport height with label centered
- Labels use `font-mono text-accent/50` (eyebrow style), sublabel in `text-text-muted`
- Labels fade in/out using existing `data-reveal="fade"` system from ScrollRevealInit
- Scroll position drives morph stages via exponential smoothing (lerp factor 0.04, existing)
- Color palette: `#8b5cf6` → `#7c3aed` → `#f8f8fc` (matches design tokens)

### Footer Section

After the three morph stages, a final section with the MPS brand name and CTA linking to `/contact`.

### Page Architecture

- Becomes a client component (needs scroll tracking)
- `revalidate` export removed (fully client-rendered)
- Content hardcoded in component (labels too short to justify Supabase fetch)
- `ExperiencePageContent` Supabase type can be simplified or removed
- ScrollProgress dots (existing) work alongside — they detect `section[id]` elements

### Script Modifications (`particle-experience.ts`)

- Rename morph stages to match narrative: particle cloud → neural network → coherent sphere
- Accept `particleCount` parameter for tier-based scaling
- Keep scroll normalization and exponential smoothing (existing)
- Keep color transition logic (existing, update palette to design tokens)

---

## Performance Tiers & Fallbacks

### Detection

**`gpu-detect.ts`** (pure function):
- Check WebGL availability via `WebGLRenderingContext`
- Render small test scene, measure FPS for ~10 frames
- If no WebGL → Tier 3
- If < 30fps → Tier 2
- Otherwise → Tier 1
- Cache result in `sessionStorage` (detection runs once per session)

**`useReducedMotion.ts`** (React hook):
- `matchMedia('(prefers-reduced-motion: reduce)')`
- If true → force Tier 3 regardless of GPU capability

**`useGpuTier.ts`** (React hook):
- Calls `gpu-detect.ts`, combines with `useReducedMotion`
- Returns `{ tier: 1 | 2 | 3, particleCount: number }`

### Tier Definitions

| Tier | Target | ParticleGate | ParticleExperience |
|---|---|---|---|
| 1 (Full) | Desktop, good GPU | 7000 particles, full shaders, mouse parallax | 5000 particles, all morph stages, full color transitions |
| 2 (Reduced) | Weak GPU, mobile | 2000 particles, simplified shaders, no parallax | 1500 particles, same morph stages, lower fidelity |
| 3 (Static) | No WebGL, reduced-motion, old devices | Static MPS logo with CSS radial gradient glow. No canvas. | Static sections with gradient backgrounds per stage. No canvas. |

### Loading Strategy

- `three` (~150KB gzipped) loaded only on pages that use it via dynamic import
- No Three.js in the main bundle — code-split into ParticleGate and ParticleExperience chunks
- While loading: hero shows static CSS fallback (gradient glow + text), particles fade in once ready

---

## Files Changed

### New Files
- `src/components/three/ParticleGate.tsx`
- `src/components/three/ParticleExperience.tsx`
- `src/components/three/useReducedMotion.ts`
- `src/components/three/useGpuTier.ts`
- `src/lib/three/gpu-detect.ts`

### Modified Files
- `src/scripts/particle-gate.ts` — remove scatter, add ambient drift, accept particleCount
- `src/scripts/particle-experience.ts` — rename stages, accept particleCount, update colors
- `src/app/(public)/page.tsx` — add ParticleGate behind hero
- `src/app/(public)/experience/page.tsx` — rewrite as client component with ParticleExperience
- `package.json` — add `three` dependency

### Potentially Removed
- `src/types/content.ts` — simplify/remove `ExperiencePageContent` (no longer fetched from Supabase)

---

## Out of Scope

- Three.js on any page other than homepage and `/experience`
- React Three Fiber or Drei
- WebGPU renderer (future consideration)
- Audio/sound effects
- Touch gesture interactions beyond scroll
