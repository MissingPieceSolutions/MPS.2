'use client';

import dynamic from 'next/dynamic';

const ParticleGate = dynamic(() => import('./ParticleGate'), { ssr: false });

export function ParticleGateLoader() {
  return <ParticleGate />;
}
