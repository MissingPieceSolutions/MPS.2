'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    // Mark HTML as reveal-ready so CSS transitions activate
    document.documentElement.setAttribute('data-reveal-ready', '');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -15% 0px' },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]); // re-run on route change

  return null;
}
