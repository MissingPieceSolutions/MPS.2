# Phase 2: Public Pages — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 10 public pages and their UI components from Astro to Next.js React components, with content fetched from Supabase via ISR.

**Architecture:** Server Components fetch data from Supabase at build/request time with `revalidate: 60`. A `(public)` route group wraps all pages with Nav, Footer, and ScrollProgress. UI primitives (Button, Badge, GlassCard, SectionHeading) are shared React components. Contact form uses a Next.js API route writing to Supabase `contact_submissions`. Three.js (homepage particle gate, experience page) is deferred to Phase 3 — placeholders are created here.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, @supabase/ssr

**Spec:** `docs/superpowers/specs/2026-03-12-nextjs-supabase-migration-design.md`

**Scope:** Spec sections 3 (components), 5 (rendering strategy), 6.4 (experience data model). Excludes: Three.js (Phase 3), admin panel (Phase 4), API routes except contact (Phase 5).

**Prerequisites:** Phase 1 complete. Supabase project created, migration SQL applied, `.env.local` configured, seed script run.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/content.ts` | Supabase content fetching helpers |
| Create | `src/components/ui/Button.tsx` | Button (primary/ghost, link or button) |
| Create | `src/components/ui/Badge.tsx` | Badge (accent/muted variants) |
| Create | `src/components/ui/GlassCard.tsx` | Glassmorphism card wrapper |
| Create | `src/components/ui/SectionHeading.tsx` | Eyebrow + heading + subheading |
| Create | `src/components/layout/Nav.tsx` | Fixed navbar with mobile menu |
| Create | `src/components/layout/Footer.tsx` | Site footer |
| Create | `src/components/layout/ScrollProgress.tsx` | Scroll position sidebar |
| Create | `src/components/layout/ScrollRevealInit.tsx` | Client script for scroll reveal |
| Create | `src/app/(public)/layout.tsx` | Public pages layout (Nav + Footer) |
| Create | `src/components/sections/HeroSection.tsx` | Hero with headline + CTAs |
| Create | `src/components/sections/CtaBanner.tsx` | CTA banner section |
| Create | `src/components/sections/TrustBar.tsx` | Tech partner logos bar |
| Create | `src/components/sections/FounderCard.tsx` | Team member card |
| Create | `src/components/sections/StatCallout.tsx` | Stat value + label card |
| Create | `src/components/sections/PortfolioList.tsx` | Portfolio list view |
| Create | `src/components/sections/PortfolioGrid.tsx` | Portfolio grid view |
| Create | `src/app/(public)/services/page.tsx` | Services page |
| Create | `src/app/(public)/pricing/page.tsx` | Pricing page |
| Create | `src/app/(public)/about/page.tsx` | About page |
| Create | `src/app/(public)/contact/page.tsx` | Contact page (client form) |
| Create | `src/app/(public)/contact/ContactForm.tsx` | Client-side contact form component |
| Create | `src/app/api/contact/route.ts` | Contact form API route |
| Create | `src/app/(public)/portfolio/page.tsx` | Portfolio listing |
| Create | `src/app/(public)/blog/page.tsx` | Blog listing |
| Create | `src/app/(public)/blog/[slug]/page.tsx` | Blog post detail |
| Create | `src/app/(public)/resources/page.tsx` | Resources listing |
| Create | `src/app/(public)/resources/[slug]/page.tsx` | Resource detail |
| Create | `src/app/(public)/privacy/page.tsx` | Privacy policy |
| Create | `src/app/(public)/showcase/page.tsx` | Component showcase |
| Create | `src/app/(public)/page.tsx` | Homepage (placeholder for Phase 3 particle gate) |
| Create | `src/app/(public)/experience/page.tsx` | Experience (placeholder for Phase 3) |
| Create | `src/app/not-found.tsx` | Custom 404 page |
| Create | `src/app/error.tsx` | Global error boundary |
| Delete | `src/app/page.tsx` | Remove Phase 1 test homepage (replaced by (public)/page.tsx) |

---

## Chunk 1: Foundation — Content Helper, UI Primitives, Layout

### Task 1: Content fetching helper

**Files:**
- Create: `src/lib/content.ts`

- [ ] **Step 1: Create content fetching module**

```typescript
// src/lib/content.ts
import { createServerSupabase } from '@/lib/supabase/server';
import type { Page, Service, PricingTier, BlogPost, CaseStudy, Resource } from '@/types/database';

// ── Page content ─────────────────────────────────────────────
export async function getPage(slug: string): Promise<Page | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return data;
}

// ── Services ─────────────────────────────────────────────────
export async function getServices(): Promise<Service[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order');
  if (error) throw new Error(`Failed to fetch services: ${error.message}`);
  return data ?? [];
}

// ── Pricing ──────────────────────────────────────────────────
export async function getPricingTiers(): Promise<PricingTier[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('pricing_tiers')
    .select('*')
    .order('sort_order');
  if (error) throw new Error(`Failed to fetch pricing tiers: ${error.message}`);
  return data ?? [];
}

// ── Blog ─────────────────────────────────────────────────────
export async function getBlogPosts(): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch blog posts: ${error.message}`);
  return data ?? [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch blog post: ${error.message}`);
  return data;
}

// ── Case Studies ─────────────────────────────────────────────
export async function getCaseStudies(): Promise<CaseStudy[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch case studies: ${error.message}`);
  return data ?? [];
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('case_studies')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch case study: ${error.message}`);
  return data;
}

// ── Resources ────────────────────────────────────────────────
export async function getResources(): Promise<Resource[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch resources: ${error.message}`);
  return data ?? [];
}

export async function getResource(slug: string): Promise<Resource | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch resource: ${error.message}`);
  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/content.ts
git commit -m "feat: add Supabase content fetching helpers"
```

---

### Task 2: UI primitives (Button, Badge, GlassCard, SectionHeading)

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/GlassCard.tsx`
- Create: `src/components/ui/SectionHeading.tsx`

- [ ] **Step 1: Create Button component**

```tsx
// src/components/ui/Button.tsx
import Link from 'next/link';

interface ButtonProps {
  variant?: 'primary' | 'ghost';
  size?: 'default' | 'sm';
  href?: string;
  className?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'default',
  href,
  className = '',
  children,
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base motion-safe:hover:scale-[1.04] motion-safe:active:scale-[0.98]';

  const variants = {
    primary:
      'bg-accent text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]',
    ghost:
      'bg-transparent text-accent ring-1 ring-accent/40 hover:ring-accent hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]',
  };

  const sizes = {
    default: 'px-6 py-3',
    sm: 'px-4 py-2 text-sm',
  };

  const classes = `${base} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create Badge component**

```tsx
// src/components/ui/Badge.tsx
interface BadgeProps {
  variant?: 'accent' | 'muted';
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'accent', className = '', children }: BadgeProps) {
  const variants = {
    accent: 'bg-accent/10 text-accent border-accent/20',
    muted: 'bg-surface-elevated text-text-muted border-white/5',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-mono ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create GlassCard component**

```tsx
// src/components/ui/GlassCard.tsx
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function GlassCard({ hover = false, className = '', children, ...rest }: GlassCardProps) {
  const base = 'bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 shadow-lg p-6';
  const hoverStyles = hover
    ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] hover:ring-accent/30'
    : '';

  return <div className={`${base} ${hoverStyles} ${className}`} {...rest}>{children}</div>;
}
```

- [ ] **Step 4: Create SectionHeading component**

```tsx
// src/components/ui/SectionHeading.tsx
interface SectionHeadingProps {
  eyebrow: string;
  heading: string;
  subheading?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center items-center' : 'items-start';

  return (
    <div className={`flex flex-col gap-3 ${alignment} ${className}`}>
      <span className="text-xs uppercase tracking-widest text-accent font-mono">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">{heading}</h2>
      {subheading && (
        <p className="text-lg text-text-muted max-w-2xl">{subheading}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI primitives (Button, Badge, GlassCard, SectionHeading)"
```

---

### Task 3: Layout components (Nav, Footer, ScrollProgress, ScrollRevealInit)

**Files:**
- Create: `src/components/layout/Nav.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/ScrollProgress.tsx`
- Create: `src/components/layout/ScrollRevealInit.tsx`

- [ ] **Step 1: Create Nav component**

```tsx
// src/components/layout/Nav.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/about', label: 'About' },
];

const SCROLL_THRESHOLD = 80;

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setHidden(y > SCROLL_THRESHOLD && y > lastScrollY.current);
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKey);
      };
    }
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <nav className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-text-primary">
            MPS
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all"
            >
              Contact
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-text-primary p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div id="mobile-menu" className="fixed inset-0 z-40 bg-bg-base/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 lg:hidden">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-2xl font-bold text-text-primary hover:text-accent transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-4 px-6 py-3 bg-accent text-white font-medium rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </Link>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Create Footer component**

```tsx
// src/components/layout/Footer.tsx
import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col items-center gap-8">
        <Link href="/" className="text-xl font-bold text-text-primary">
          MPS
        </Link>
        <p className="text-sm text-text-muted text-center max-w-md">
          AI systems that close the gap between ambition and outcome.
        </p>

        <div className="flex gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-muted hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-4">
          <a
            href="https://www.linkedin.com/company/missingpiecesolutions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition-colors"
            aria-label="LinkedIn"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a
            href="https://github.com/MissingPieceSolutions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>

        <p className="text-xs text-text-muted/60">
          &copy; {new Date().getFullYear()} Missing Piece Solutions. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create ScrollRevealInit component**

```tsx
// src/components/layout/ScrollRevealInit.tsx
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
```

- [ ] **Step 4: Create ScrollProgress component**

```tsx
// src/components/layout/ScrollProgress.tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add layout components (Nav, Footer, ScrollProgress, ScrollRevealInit)"
```

---

### Task 4: Public layout + error pages

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`
- Delete: `src/app/page.tsx` (Phase 1 test page — will be replaced by `(public)/page.tsx`)

- [ ] **Step 1: Create public layout**

```tsx
// src/app/(public)/layout.tsx
import { Nav } from '@/components/layout/Nav';
import { Footer } from '@/components/layout/Footer';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { ScrollRevealInit } from '@/components/layout/ScrollRevealInit';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <ScrollProgress />
      <ScrollRevealInit />
      <main className="pt-20">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create 404 page**

```tsx
// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-accent animate-pulse">404</h1>
        <p className="text-xl text-text-muted">
          Looks like this page is a missing piece...
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create error boundary**

```tsx
// src/app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-text-primary">Something went wrong</h1>
        <p className="text-text-muted">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Delete Phase 1 test homepage**

Delete `src/app/page.tsx` (the test page with "Next.js scaffold working" text).

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds. The `(public)` route group activates. 404 and error pages included.

- [ ] **Step 6: Commit**

```bash
git add src/app/
git commit -m "feat: add public layout, 404 page, and error boundary"
```

---

## Chunk 2: Section Components + Core Pages

### Task 5: Section components

**Files:**
- Create: `src/components/sections/HeroSection.tsx`
- Create: `src/components/sections/CtaBanner.tsx`
- Create: `src/components/sections/TrustBar.tsx`
- Create: `src/components/sections/FounderCard.tsx`
- Create: `src/components/sections/StatCallout.tsx`

- [ ] **Step 1: Create HeroSection**

```tsx
// src/components/sections/HeroSection.tsx
import { Button } from '@/components/ui/Button';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

export function HeroSection({ headline, subheadline, ctaPrimary, ctaSecondary }: HeroSectionProps) {
  return (
    <section id="hero" className="relative py-24 sm:py-32 px-6">
      <div className="mx-auto max-w-4xl text-center space-y-8" data-reveal="fade-up">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
          {headline}
        </h1>
        <p className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto">
          {subheadline}
        </p>
        {(ctaPrimary || ctaSecondary) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {ctaPrimary && (
              <Button href={ctaPrimary.href}>{ctaPrimary.label}</Button>
            )}
            {ctaSecondary && (
              <Button href={ctaSecondary.href} variant="ghost">
                {ctaSecondary.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create CtaBanner**

```tsx
// src/components/sections/CtaBanner.tsx
import { Button } from '@/components/ui/Button';

interface CtaBannerProps {
  heading: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
}

export function CtaBanner({ heading, subtext, ctaLabel, ctaHref }: CtaBannerProps) {
  return (
    <section className="py-20 px-6" data-reveal="scale">
      <div className="mx-auto max-w-3xl text-center space-y-6 bg-accent/5 rounded-2xl p-12 ring-1 ring-accent/10">
        <h2 className="text-3xl font-bold text-text-primary">{heading}</h2>
        <p className="text-text-muted">{subtext}</p>
        <Button href={ctaHref}>{ctaLabel}</Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create TrustBar**

```tsx
// src/components/sections/TrustBar.tsx
const PARTNERS = [
  'OpenAI', 'Anthropic', 'Gemini', 'n8n', 'Zapier',
  'Make', 'Python', 'TypeScript', 'Supabase', 'Cloudflare',
];

export function TrustBar() {
  return (
    <section className="py-8 overflow-x-auto">
      <div className="flex gap-8 px-6 justify-center flex-wrap">
        {PARTNERS.map((name) => (
          <span
            key={name}
            className="text-xs font-mono uppercase tracking-widest text-accent/70 whitespace-nowrap"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create FounderCard**

```tsx
// src/components/sections/FounderCard.tsx
import Image from 'next/image';
import { GlassCard } from '@/components/ui/GlassCard';

interface FounderCardProps {
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  initials: string;
  photo?: string | null;
}

export function FounderCard({ name, role, bio, linkedin, initials, photo }: FounderCardProps) {
  return (
    <GlassCard hover className="flex flex-col items-center text-center gap-4">
      {photo ? (
        <Image src={photo} alt={name} width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xl font-bold">
          {initials}
        </div>
      )}
      <div>
        <h3 className="text-lg font-bold text-text-primary">{name}</h3>
        <p className="text-sm text-accent">{role}</p>
      </div>
      <p className="text-sm text-text-muted">{bio}</p>
      <a
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-accent hover:underline"
      >
        LinkedIn &rarr;
      </a>
    </GlassCard>
  );
}
```

- [ ] **Step 5: Create StatCallout**

```tsx
// src/components/sections/StatCallout.tsx
import { GlassCard } from '@/components/ui/GlassCard';

interface StatCalloutProps {
  value: string;
  label: string;
}

export function StatCallout({ value, label }: StatCalloutProps) {
  return (
    <GlassCard hover className="text-center">
      <p className="text-3xl font-bold text-accent">{value}</p>
      <p className="text-sm text-text-muted mt-2">{label}</p>
    </GlassCard>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/
git commit -m "feat: add section components (HeroSection, CtaBanner, TrustBar, FounderCard, StatCallout)"
```

---

### Task 6: Portfolio components

**Files:**
- Create: `src/components/sections/PortfolioList.tsx`
- Create: `src/components/sections/PortfolioGrid.tsx`

- [ ] **Step 1: Create PortfolioList**

```tsx
// src/components/sections/PortfolioList.tsx
import Link from 'next/link';
import type { CaseStudy } from '@/types/database';

interface PortfolioListProps {
  projects: CaseStudy[];
}

export function PortfolioList({ projects }: PortfolioListProps) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/portfolio/${project.slug}`}
          className="block group"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl ring-1 ring-white/5 hover:ring-accent/30 hover:bg-surface/40 transition-all">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-lg shrink-0">
              {project.industry?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                {project.title}
              </h3>
              <p className="text-sm text-text-muted truncate">
                {project.client || project.industry}
              </p>
            </div>
            <span className="text-xs text-text-muted/60 font-mono shrink-0">
              {project.published_at ? new Date(project.published_at).getFullYear() : ''}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create PortfolioGrid**

```tsx
// src/components/sections/PortfolioGrid.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { CaseStudy } from '@/types/database';

interface PortfolioGridProps {
  projects: CaseStudy[];
}

export function PortfolioGrid({ projects }: PortfolioGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/portfolio/${project.slug}`}
          className="group relative overflow-hidden rounded-xl ring-1 ring-white/10 hover:ring-accent/30 transition-all"
        >
          <div className="aspect-[4/3] bg-surface flex items-center justify-center">
            {project.cover_image ? (
              <Image
                src={project.cover_image}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <span className="text-4xl text-accent/30 font-bold">
                {project.title.charAt(0)}
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg-base/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <div>
              <h3 className="font-bold text-text-primary">{project.title}</h3>
              <p className="text-sm text-text-muted">{project.client || project.industry}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/PortfolioList.tsx src/components/sections/PortfolioGrid.tsx
git commit -m "feat: add portfolio list and grid components"
```

---

### Task 7: Services page

**Files:**
- Create: `src/app/(public)/services/page.tsx`

- [ ] **Step 1: Create services page**

```tsx
// src/app/(public)/services/page.tsx
import type { Metadata } from 'next';
import { getPage, getServices } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CtaBanner } from '@/components/sections/CtaBanner';
import type { ServicesPageContent } from '@/types/content';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('services');
  return {
    title: page?.title || 'Services',
    description: page?.description || undefined,
  };
}

const ICON_MAP: Record<string, string> = {
  phone: '📞', chat: '💬', refresh: '🔄', star: '⭐', calendar: '📅',
};

export default async function ServicesPage() {
  const [page, services] = await Promise.all([getPage('services'), getServices()]);
  const content = page?.content as unknown as ServicesPageContent | undefined;

  return (
    <div className="space-y-24 pb-12">
      {/* Packaged Products */}
      <section id="packaged" className="px-6 pt-12">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={content?.packaged_products?.eyebrow || 'Our Services'}
            heading={content?.packaged_products?.heading || 'Ready-to-Deploy AI'}
            subheading={content?.packaged_products?.subheading}
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <GlassCard key={service.id} hover className="flex flex-col gap-4" >
                <div className="text-3xl" data-reveal="fade-up" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
                  {ICON_MAP[service.icon || ''] || '🤖'}
                </div>
                <h3 className="text-lg font-bold text-text-primary">{service.name}</h3>
                {service.tagline && <p className="text-sm text-accent">{service.tagline}</p>}
                {service.description && <p className="text-sm text-text-muted">{service.description}</p>}
                {service.deliverables.length > 0 && (
                  <ul className="text-sm text-text-muted space-y-1 mt-auto">
                    {service.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span> {d}
                      </li>
                    ))}
                  </ul>
                )}
                {service.metric && <Badge>{service.metric}</Badge>}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Development */}
      {content?.custom && (
        <section id="custom" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow={content.custom.eyebrow}
              heading={content.custom.heading}
              subheading={content.custom.tagline}
            />
            <GlassCard className="mt-8 grid md:grid-cols-2 gap-8" data-reveal="fade-up">
              <div className="space-y-4">
                <p className="text-text-muted">{content.custom.description}</p>
                <ul className="space-y-2 text-sm text-text-muted">
                  {content.custom.services.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <Badge variant="muted">{content.custom.pricing}</Badge>
              </div>
            </GlassCard>
          </div>
        </section>
      )}

      {/* Retainer */}
      {content?.retainer && (
        <section id="retainer" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow={content.retainer.eyebrow}
              heading={content.retainer.heading}
              subheading={content.retainer.tagline}
            />
            <GlassCard className="mt-8 grid md:grid-cols-2 gap-8" data-reveal="fade-up">
              <div className="space-y-4">
                <p className="text-text-muted">{content.retainer.description}</p>
                <ul className="space-y-2 text-sm text-text-muted">
                  {content.retainer.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <Badge variant="muted">{content.retainer.pricing}</Badge>
              </div>
            </GlassCard>
          </div>
        </section>
      )}

      {/* CTA */}
      {content?.cta && (
        <CtaBanner
          heading={content.cta.heading}
          subtext={content.cta.text}
          ctaLabel={content.cta.label}
          ctaHref={content.cta.href}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(public\)/services/
git commit -m "feat: add services page with ISR"
```

---

### Task 8: Pricing page

**Files:**
- Create: `src/app/(public)/pricing/page.tsx`

- [ ] **Step 1: Create pricing page**

```tsx
// src/app/(public)/pricing/page.tsx
import type { Metadata } from 'next';
import { getPage, getPricingTiers } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { CtaBanner } from '@/components/sections/CtaBanner';
import type { PricingPageContent } from '@/types/content';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('pricing');
  return { title: page?.title || 'Pricing', description: page?.description || undefined };
}

export default async function PricingPage() {
  const [page, tiers] = await Promise.all([getPage('pricing'), getPricingTiers()]);
  const content = page?.content as unknown as PricingPageContent | undefined;

  const packaged = tiers.filter((t) => t.tier_type === 'packaged');
  const custom = tiers.filter((t) => t.tier_type !== 'packaged');

  return (
    <div className="space-y-24 pb-12">
      {/* Hero */}
      <section id="pricing-hero" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl text-center" data-reveal="fade-up">
          <SectionHeading
            eyebrow="Pricing"
            heading={content?.hero?.heading || 'Pay for Results, Not Promises'}
            subheading={content?.hero?.subheading}
            align="center"
          />
        </div>
      </section>

      {/* Packaged product cards */}
      <section id="products" className="px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Packaged Products"
            heading={content?.products_section?.heading || 'Packaged Products'}
            subheading={content?.products_section?.subheading}
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packaged.map((tier) => (
              <GlassCard key={tier.id} hover className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-accent">{tier.price}</span>
                </div>
                <Badge variant="muted">{tier.metric}</Badge>
                {tier.retainer_alt && (
                  <p className="text-xs text-text-muted/60">
                    Or retainer: {tier.retainer_alt}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      {content?.how_it_works && (
        <section id="how-it-works" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="Process" heading={content.how_it_works.heading} />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.how_it_works.steps.map((step) => (
                <GlassCard key={step.number} className="flex gap-4" data-reveal="fade-up">
                  <span className="text-2xl font-bold text-accent/30 font-mono shrink-0">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-bold text-text-primary">{step.title}</h3>
                    <p className="text-sm text-text-muted mt-1">{step.description}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom & retainer */}
      {custom.length > 0 && (
        <section id="custom-pricing" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Enterprise"
              heading={content?.custom_pricing?.heading || 'Custom & Retainer'}
            />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {custom.map((tier) => (
                <GlassCard key={tier.id} hover className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
                  <p className="text-sm text-text-muted">{tier.description}</p>
                  <span className="text-xl font-bold text-accent">{tier.price}</span>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {content?.cta && (
        <CtaBanner
          heading={content.cta.heading}
          subtext={content.cta.text}
          ctaLabel={content.cta.label}
          ctaHref={content.cta.href}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(public\)/pricing/
git commit -m "feat: add pricing page with ISR"
```

---

### Task 9: About page

**Files:**
- Create: `src/app/(public)/about/page.tsx`

- [ ] **Step 1: Create about page**

```tsx
// src/app/(public)/about/page.tsx
import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FounderCard } from '@/components/sections/FounderCard';
import { CtaBanner } from '@/components/sections/CtaBanner';
import type { AboutPageContent } from '@/types/content';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return { title: page?.title || 'About', description: page?.description || undefined };
}

export default async function AboutPage() {
  const page = await getPage('about');
  const content = page?.content as unknown as AboutPageContent | undefined;

  return (
    <div className="space-y-24 pb-12">
      {/* Header */}
      <section id="about-hero" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="About" heading={page?.title || 'About MPS'} />
        </div>
      </section>

      {/* Story */}
      {content?.story && (
        <section id="story" className="px-6">
          <div className="mx-auto max-w-4xl space-y-4" data-reveal="fade-up">
            <h3 className="text-2xl font-bold text-text-primary">{content.story.heading}</h3>
            <p className="text-text-muted leading-relaxed">{content.story.text}</p>
          </div>
        </section>
      )}

      {/* Founders */}
      {content?.founders && (
        <section id="team" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="Team" heading="Meet the Founders" align="center" />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.founders.map((founder, i) => (
                <div key={founder.name} data-reveal="fade-up" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
                  <FounderCard {...founder} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {content?.cta && (
        <CtaBanner
          heading={content.cta.heading}
          subtext={content.cta.text}
          ctaLabel={content.cta.label}
          ctaHref={content.cta.href}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(public\)/about/
git commit -m "feat: add about page with ISR"
```

---

### Task 10: Contact page + API route

**Files:**
- Create: `src/app/(public)/contact/page.tsx`
- Create: `src/app/(public)/contact/ContactForm.tsx`
- Create: `src/app/api/contact/route.ts`

- [ ] **Step 1: Create contact form API route**

```typescript
// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, company, project_type, message } = body as Record<string, string>;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }

  if (typeof name !== 'string' || name.length > 200) {
    return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.length > 5000) {
    return NextResponse.json({ error: 'Message too long.' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    company: typeof company === 'string' ? company : null,
    project_type: typeof project_type === 'string' ? project_type : null,
    message,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create contact page**

```tsx
// src/app/(public)/contact/page.tsx
import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ContactForm } from './ContactForm';
import type { ContactPageContent } from '@/types/content';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('contact');
  return { title: page?.title || 'Contact', description: page?.description || undefined };
}

export default async function ContactPage() {
  const page = await getPage('contact');
  const content = page?.content as unknown as ContactPageContent | undefined;

  return (
    <div className="pb-12">
      <section id="contact" className="px-6 pt-12">
        <div className="mx-auto max-w-2xl space-y-8">
          <SectionHeading
            eyebrow="Contact"
            heading={content?.intro?.heading || 'Get in Touch'}
            subheading={content?.intro?.text}
          />
          <ContactForm
            fields={content?.form_fields || []}
            submitLabel={content?.form_submit_label || 'Send Message'}
            successMessage={content?.form_success_message || 'Thanks! We\'ll be in touch.'}
            errorMessage={content?.form_error_message || 'Something went wrong.'}
            privacyNote={content?.privacy_note || ''}
          />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create ContactForm client component**

```tsx
// src/app/(public)/contact/ContactForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  options?: string[];
}

interface ContactFormProps {
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
  privacyNote: string;
}

export function ContactForm({ fields, submitLabel, successMessage, errorMessage, privacyNote }: ContactFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({});
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <GlassCard className="text-center space-y-4">
        <div className="text-4xl">✓</div>
        <p className="text-text-primary font-medium">{successMessage}</p>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GlassCard className="space-y-6">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm text-text-muted">
              {field.label} {field.required && <span className="text-accent">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                required={field.required}
                placeholder={field.placeholder}
                rows={5}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">{field.placeholder}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
          </div>
        ))}

        {status === 'error' && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending...' : submitLabel}
        </button>
      </GlassCard>

      {privacyNote && (
        <p className="text-xs text-text-muted/60 text-center">
          Your information is handled according to our{' '}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/contact/ src/app/api/contact/
git commit -m "feat: add contact page with form + API route"
```

---

## Chunk 3: Content Pages, Remaining Pages, Homepage Placeholder

### Task 11: Portfolio page

**Files:**
- Create: `src/app/(public)/portfolio/page.tsx`

- [ ] **Step 1: Create portfolio page**

```tsx
// src/app/(public)/portfolio/page.tsx
import type { Metadata } from 'next';
import { getCaseStudies } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PortfolioList } from '@/components/sections/PortfolioList';
import { CtaBanner } from '@/components/sections/CtaBanner';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Portfolio', description: 'Our work — AI automation case studies.' };

export default async function PortfolioPage() {
  const projects = await getCaseStudies();

  return (
    <div className="space-y-24 pb-12">
      <section id="portfolio" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Portfolio" heading="Our Work" subheading="Case studies from real client engagements." />
          <div className="mt-12">
            <PortfolioList projects={projects} />
          </div>
        </div>
      </section>

      <CtaBanner
        heading="Got a Process Worth Automating?"
        subtext="Tell us what you're working on — we'll tell you what's possible."
        ctaLabel="Start a Conversation"
        ctaHref="/contact"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(public\)/portfolio/
git commit -m "feat: add portfolio page with ISR"
```

---

### Task 12: Blog listing + detail pages

**Files:**
- Create: `src/app/(public)/blog/page.tsx`
- Create: `src/app/(public)/blog/[slug]/page.tsx`

- [ ] **Step 1: Create blog listing page**

```tsx
// src/app/(public)/blog/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Blog', description: 'Insights on AI automation, strategy, and delivery.' };

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="pb-12">
      <section id="blog" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Blog" heading="Insights" subheading="Practical takes on AI automation." />
          <div className="mt-12 space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <GlassCard hover className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="text-sm text-text-muted">{post.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs text-text-muted/60">
                    {post.published_at && <span>{new Date(post.published_at).toLocaleDateString()}</span>}
                    {post.read_time && <span>{post.read_time}</span>}
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {post.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
                    </div>
                  )}
                </GlassCard>
              </Link>
            ))}
            {posts.length === 0 && <p className="text-text-muted">No posts yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create blog detail page**

```tsx
// src/app/(public)/blog/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost, getBlogPosts } from '@/lib/content';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  return { title: post?.title, description: post?.excerpt || undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="px-6 pt-12 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-accent hover:underline">&larr; Back to Blog</Link>

        <header className="mt-6 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            {post.published_at && <time>{new Date(post.published_at).toLocaleDateString()}</time>}
            {post.read_time && <span>{post.read_time}</span>}
          </div>
          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          )}
        </header>

        {post.body && (
          <div className="mt-12 prose prose-invert prose-accent max-w-none whitespace-pre-wrap">
            {post.body}
          </div>
        )}
      </div>
    </article>
  );
}
```

**Note:** Blog body is stored as raw text (not HTML) from the seed script. We render it as plain text with `whitespace-pre-wrap`. If markdown rendering is needed later, add a markdown-to-HTML library (e.g., `react-markdown`) and sanitize output with `DOMPurify` — this can be refined when content is managed through the admin panel (Phase 4).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/blog/
git commit -m "feat: add blog listing and detail pages with ISR"
```

---

### Task 13: Resources listing + detail pages

**Files:**
- Create: `src/app/(public)/resources/page.tsx`
- Create: `src/app/(public)/resources/[slug]/page.tsx`

- [ ] **Step 1: Create resources listing page**

```tsx
// src/app/(public)/resources/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getResources } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Resources', description: 'Guides and templates for AI automation.' };

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="pb-12">
      <section id="resources" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Resources" heading="Guides & Templates" subheading="Practical resources for your AI journey." />
          <div className="mt-12 space-y-6">
            {resources.map((r) => (
              <Link key={r.id} href={`/resources/${r.slug}`} className="block group">
                <GlassCard hover className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                    {r.title}
                  </h3>
                  {r.excerpt && <p className="text-sm text-text-muted">{r.excerpt}</p>}
                  {r.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {r.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
                    </div>
                  )}
                </GlassCard>
              </Link>
            ))}
            {resources.length === 0 && <p className="text-text-muted">No resources yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create resource detail page**

```tsx
// src/app/(public)/resources/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getResource, getResources } from '@/lib/content';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;

export async function generateStaticParams() {
  const resources = await getResources();
  return resources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  return { title: resource?.title, description: resource?.excerpt || undefined };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) notFound();

  return (
    <article className="px-6 pt-12 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/resources" className="text-sm text-accent hover:underline">&larr; Back to Resources</Link>

        <header className="mt-6 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{resource.title}</h1>
          {resource.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {resource.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          )}
        </header>

        {resource.body && (
          <div className="mt-12 prose prose-invert prose-accent max-w-none whitespace-pre-wrap">
            {resource.body}
          </div>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/resources/
git commit -m "feat: add resources listing and detail pages with ISR"
```

---

### Task 14: Privacy + Showcase pages

**Files:**
- Create: `src/app/(public)/privacy/page.tsx`
- Create: `src/app/(public)/showcase/page.tsx`

- [ ] **Step 1: Create privacy page**

```tsx
// src/app/(public)/privacy/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };
export const revalidate = 300;

export default function PrivacyPage() {
  return (
    <article className="px-6 pt-12 pb-24">
      <div className="mx-auto max-w-3xl prose prose-invert prose-accent">
        <h1>Privacy Policy</h1>
        <p className="text-text-muted"><em>Last updated: March 2026</em></p>

        <h2>What We Collect</h2>
        <p>When you use our contact form, we collect your name, email address, company name (optional), project type (optional), and message. This information is stored securely in our database.</p>

        <h2>How We Use It</h2>
        <p>We use your information solely to respond to your inquiry and discuss potential collaboration. We do not sell, share, or distribute your personal information to third parties.</p>

        <h2>Third-Party Services</h2>
        <p>This site is hosted on a VPS and uses Supabase for data storage. These services may process data according to their own privacy policies.</p>

        <h2>Data Retention</h2>
        <p>We retain your contact information for as long as necessary to maintain our business relationship. You may request deletion at any time.</p>

        <h2>Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:hello@missingpiecesolutions.com">hello@missingpiecesolutions.com</a> to exercise these rights.</p>

        <h2>Cookies</h2>
        <p>We use essential cookies for authentication. We do not use tracking or advertising cookies.</p>

        <h2>Contact</h2>
        <p>For privacy-related questions, email <a href="mailto:hello@missingpiecesolutions.com">hello@missingpiecesolutions.com</a>.</p>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Create showcase page**

```tsx
// src/app/(public)/showcase/page.tsx
import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';

export const metadata: Metadata = { title: 'Showcase', description: 'Component showcase and design system preview.' };

export default function ShowcasePage() {
  return (
    <div className="px-6 pt-12 pb-24 space-y-24">
      <div className="mx-auto max-w-4xl space-y-20">
        {/* Buttons */}
        <section id="buttons">
          <SectionHeading eyebrow="Primitives" heading="Buttons" />
          <div className="mt-8 flex flex-wrap gap-4">
            <Button>Primary Default</Button>
            <Button size="sm">Primary Small</Button>
            <Button variant="ghost">Ghost Default</Button>
            <Button variant="ghost" size="sm">Ghost Small</Button>
          </div>
        </section>

        {/* Badges */}
        <section id="badges">
          <SectionHeading eyebrow="Primitives" heading="Badges" />
          <div className="mt-8 flex flex-wrap gap-4">
            <Badge>Accent Badge</Badge>
            <Badge variant="muted">Muted Badge</Badge>
          </div>
        </section>

        {/* Section Headings */}
        <section id="headings">
          <SectionHeading eyebrow="Primitives" heading="Section Headings" />
          <div className="mt-8 space-y-8">
            <SectionHeading eyebrow="Left Aligned" heading="With Subheading" subheading="This is the subheading text." />
            <SectionHeading eyebrow="Centered" heading="Center Aligned" subheading="Also with a subheading." align="center" />
          </div>
        </section>

        {/* Glass Cards */}
        <section id="cards">
          <SectionHeading eyebrow="Primitives" heading="Glass Cards" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <h3 className="font-bold text-text-primary">Standard</h3>
              <p className="text-sm text-text-muted mt-2">No hover effect.</p>
            </GlassCard>
            <GlassCard hover>
              <h3 className="font-bold text-text-primary">With Hover</h3>
              <p className="text-sm text-text-muted mt-2">Hover to see the glow.</p>
            </GlassCard>
            <GlassCard hover>
              <h3 className="font-bold text-text-primary">With Content</h3>
              <p className="text-sm text-text-muted mt-2">Cards can contain anything.</p>
              <Button size="sm" className="mt-4">Action</Button>
            </GlassCard>
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/privacy/ src/app/\(public\)/showcase/
git commit -m "feat: add privacy and showcase pages"
```

---

### Task 15: Homepage + Experience placeholders

**Files:**
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/experience/page.tsx`

These pages have Three.js particle animations (Phase 3). For now, create functional placeholders that show the page content without particles.

- [ ] **Step 1: Create homepage placeholder**

```tsx
// src/app/(public)/page.tsx
import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import { HeroSection } from '@/components/sections/HeroSection';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { CtaBanner } from '@/components/sections/CtaBanner';
import { TrustBar } from '@/components/sections/TrustBar';
import { Button } from '@/components/ui/Button';
import type { HomePageContent } from '@/types/content';

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
      {/* Hero — Phase 3 will add particle gate behind this */}
      {content?.hero && (
        <HeroSection
          headline={content.hero.headline}
          subheadline={content.hero.subheadline}
          ctaPrimary={{ label: content.hero.cta_primary?.label || 'See Our Work', href: content.hero.cta_primary?.href || '/portfolio' }}
          ctaSecondary={{ label: content.hero.cta_secondary?.label || 'Talk to Us', href: content.hero.cta_secondary?.href || '/contact' }}
        />
      )}

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

- [ ] **Step 2: Create experience placeholder**

```tsx
// src/app/(public)/experience/page.tsx
import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import type { ExperiencePageContent } from '@/types/content';
import Link from 'next/link';

export const revalidate = 60; // Phase 3: remove revalidate when page becomes fully client-rendered with Three.js
export const metadata: Metadata = { title: 'Experience', description: 'Interactive scroll-driven experience.' };

export default async function ExperiencePage() {
  const page = await getPage('experience');
  const content = page?.content as unknown as ExperiencePageContent | undefined;
  const sections = content?.sections || [];
  const footerNav = content?.footerNav || [];

  return (
    <div className="min-h-screen">
      {/* Phase 3 will add particle canvas background */}
      <div className="relative z-10">
        {sections.map((section, i) => (
          <section
            key={section.label || i}
            className="min-h-screen flex items-center px-6"
            data-reveal="fade-up"
          >
            <div className={`mx-auto max-w-4xl w-full ${i % 2 === 1 ? 'text-right' : ''}`}>
              <span className="text-xs font-mono text-accent/50">{section.label}</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mt-2">
                {section.content.heading}
              </h2>
              <p className="text-text-muted mt-4 max-w-lg">{section.content.body}</p>
            </div>
          </section>
        ))}

        {/* Brand section */}
        <section className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-6xl sm:text-8xl font-bold text-text-primary leading-none">
              MISSING<br />
              <span className="text-accent">PIECE</span><br />
              SOLUTIONS
            </h2>
          </div>
        </section>

        {/* Footer nav */}
        <footer className="py-12 px-6 text-center space-y-6">
          <p className="text-sm text-text-muted">AI systems that close the gap between ambition and outcome.</p>
          <div className="flex justify-center gap-6">
            {footerNav.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-text-muted hover:text-accent transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/page.tsx src/app/\(public\)/experience/
git commit -m "feat: add homepage and experience page placeholders"
```

---

### Task 16: Final build verification

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: Build succeeds. All pages generated:
- `/` (homepage)
- `/services`, `/pricing`, `/about`, `/contact`
- `/portfolio`
- `/blog`, `/blog/[slug]`
- `/resources`, `/resources/[slug]`
- `/experience`
- `/privacy`, `/showcase`
- `/login`, `/register`
- 404 and error pages

- [ ] **Step 2: Fix any build errors**

If Supabase connection fails during build (no `.env.local`), the ISR pages will fail. Ensure `.env.local` is configured or add error handling to content fetchers.

- [ ] **Step 3: Final commit (only if there are fixes)**

```bash
git add src/
git commit -m "fix: resolve build issues from Phase 2 integration"
```

---

## Completion Checklist

- [ ] Content fetching helper works with Supabase ISR
- [ ] All 4 UI primitives render correctly
- [ ] Nav with mobile menu, Footer, ScrollProgress, ScrollRevealInit work
- [ ] Public layout wraps all pages with Nav + Footer
- [ ] Services, Pricing, About pages render content from Supabase
- [ ] Contact form submits to API route → Supabase
- [ ] Blog listing + detail pages with generateStaticParams
- [ ] Resources listing + detail pages with generateStaticParams
- [ ] Portfolio page lists case studies
- [ ] Homepage shows all sections (particle gate deferred to Phase 3)
- [ ] Experience page shows sections (particles deferred to Phase 3)
- [ ] Privacy and Showcase pages render
- [ ] 404 and error boundary work
- [ ] Build passes with all routes

## Next Plans

- **Phase 3:** Three.js — ParticleGate and ParticleExperience as @react-three/fiber components
- **Phase 4:** Admin panel — Dashboard, content editors, media library, draft/publish
- **Phase 5:** API routes, ISR revalidation, remaining CRUD endpoints
- **Phase 6:** Deployment — Dockerfile, VPS setup, DNS
