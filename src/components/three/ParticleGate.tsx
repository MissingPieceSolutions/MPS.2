'use client';

import { useRef, useEffect } from 'react';
import { useGpuTier } from './useGpuTier';

/**
 * Homepage particle logo — particles converge into the MPS logo shape.
 * Renders as position:absolute behind the hero content.
 * Falls back to a static CSS gradient glow on tier 3.
 */
export default function ParticleGate() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ destroy: () => void } | null>(null);
  const { tier, loading, particleCount } = useGpuTier('gate');

  useEffect(() => {
    if (loading || !containerRef.current) return;
    if (tier === 3 || particleCount === 0) return;

    let cancelled = false;

    import('@/scripts/particle-gate').then(async ({ initParticleGate }) => {
      if (cancelled || !containerRef.current) return;
      const controls = await initParticleGate(containerRef.current, { particleCount });
      if (cancelled) {
        controls.destroy();
        return;
      }
      controlsRef.current = controls;
    });

    return () => {
      cancelled = true;
      controlsRef.current?.destroy();
      controlsRef.current = null;
    };
  }, [tier, loading, particleCount]);

  // Tier 3: static CSS fallback
  if (!loading && tier === 3) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div
          className="w-64 h-64 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, #6366f1 40%, transparent 70%)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
