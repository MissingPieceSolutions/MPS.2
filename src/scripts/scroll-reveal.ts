/**
 * Scroll Reveal System
 *
 * IntersectionObserver-based scroll reveal that watches elements with
 * `data-reveal` attribute. Adds `.revealed` class on enter, removes on
 * leave so animations replay on re-scroll.
 *
 * Uses `astro:page-load` for View Transition compatibility.
 * Side-effect module — no exports.
 */

let observer: IntersectionObserver | null = null;

function initScrollReveal(): void {
  // Disconnect previous observer (View Transition cleanup)
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');

  if (revealElements.length === 0) {
    // Still mark ready so no content stays hidden
    document.documentElement.setAttribute('data-reveal-ready', '');
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        } else {
          // Remove so animation replays on re-scroll
          entry.target.classList.remove('revealed');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => {
    observer!.observe(el);
  });

  // Mark HTML so CSS knows JS is ready (prevents flash of invisible content)
  document.documentElement.setAttribute('data-reveal-ready', '');
}

// Initialize on page load (View Transition compatible)
document.addEventListener('astro:page-load', initScrollReveal);

// Cleanup on View Transition navigation to prevent memory leaks
document.addEventListener('astro:before-preparation', () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
