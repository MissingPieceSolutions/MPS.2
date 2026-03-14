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
