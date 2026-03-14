'use client';

import { useEffect, useState } from 'react';
import { detectGpuTier, type GpuTier } from '@/lib/three/gpu-detect';
import { useReducedMotion } from './useReducedMotion';

interface GpuTierResult {
  tier: GpuTier | null;
  loading: boolean;
  particleCount: number;
}

const PARTICLE_COUNTS: Record<GpuTier, number> = {
  1: 7000,  // Full
  2: 2000,  // Reduced
  3: 0,     // Static fallback
};

export function useGpuTier(context: 'gate' | 'experience' = 'gate'): GpuTierResult {
  const reducedMotion = useReducedMotion();
  const [tier, setTier] = useState<GpuTier | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setTier(3);
      return;
    }

    let cancelled = false;
    detectGpuTier().then((detected) => {
      if (!cancelled) setTier(detected);
    });
    return () => { cancelled = true; };
  }, [reducedMotion]);

  const effectiveTier = tier;

  let particleCount = 0;
  if (effectiveTier !== null) {
    if (context === 'experience') {
      particleCount = effectiveTier === 1 ? 5000 : effectiveTier === 2 ? 1500 : 0;
    } else {
      particleCount = PARTICLE_COUNTS[effectiveTier];
    }
  }

  return {
    tier: effectiveTier,
    loading: effectiveTier === null,
    particleCount,
  };
}
