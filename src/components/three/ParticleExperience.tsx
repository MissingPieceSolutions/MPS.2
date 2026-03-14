'use client';

import { useRef, useEffect } from 'react';
import { useGpuTier } from './useGpuTier';

/**
 * Experience page scroll-driven particle system.
 * Renders as position:fixed full-viewport canvas.
 * Falls back to static gradient backgrounds on tier 3.
 */
export default function ParticleExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ destroy: () => void } | null>(null);
  const { tier, loading, particleCount } = useGpuTier('experience');

  useEffect(() => {
    if (loading || !containerRef.current) return;
    if (tier === 3 || particleCount === 0) return;

    let cancelled = false;

    import('@/scripts/particle-experience').then(({ initParticleExperience }) => {
      if (cancelled || !containerRef.current) return;
      const controls = initParticleExperience(containerRef.current, {
        particleCount,
        scrollEndSelector: '[data-morph-end]',
      });
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

  // Tier 3: static gradient fallback
  if (!loading && tier === 3) {
    return (
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, #1e1e37 0%, #1a1a2e 100%)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
