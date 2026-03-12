'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollProgress() {
  const [sections, setSections] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const sectionEls = document.querySelectorAll('section[id]');
    const ids = Array.from(sectionEls).map((el) => el.id);
    setSections(ids);

    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = ids.indexOf(entry.target.id);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]); // re-run on route change

  if (sections.length === 0) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
      {sections.map((id, i) => (
        <button
          key={id}
          onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === activeIndex
              ? 'bg-accent scale-150'
              : 'bg-text-muted/30 hover:bg-text-muted/60'
          }`}
          aria-label={`Scroll to ${id}`}
        />
      ))}
    </div>
  );
}
