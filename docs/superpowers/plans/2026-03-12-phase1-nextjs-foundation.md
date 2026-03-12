# Phase 1: Next.js Foundation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js 15 project, set up Supabase database schema with RLS, implement auth system, and migrate all content from markdown to Supabase — producing a buildable Next.js app with seeded database and working auth.

**Architecture:** Next.js 15 App Router with TypeScript, Tailwind CSS 4 (CSS-first config), Supabase client via `@supabase/ssr`. Database tables for all content types with Row Level Security. Supabase Auth with email/password and role-based middleware. Seed script parses existing markdown files into Supabase.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, @supabase/supabase-js, @supabase/ssr

**Spec:** `docs/superpowers/specs/2026-03-12-nextjs-supabase-migration-design.md`

**Scope:** This plan covers spec sections 2 (Tech Stack), 3 (Project Structure — scaffold only), 4 (Database Schema), 7 (Auth Flow), and 8 (Content Migration). Public pages, Three.js, and admin panel are separate plans.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `next.config.ts` | Next.js config (standalone output, image domains) |
| Create | `tailwind.config.ts` | Tailwind v4 config (if needed — may use CSS-only) |
| Create | `tsconfig.json` | TypeScript strict config for Next.js |
| Create | `package.json` | Dependencies and scripts |
| Create | `.env.local.example` | Template for environment variables |
| Create | `src/app/layout.tsx` | Root layout (fonts, metadata, Tailwind) |
| Create | `src/app/page.tsx` | Temporary homepage (confirms app works) |
| Create | `src/styles/globals.css` | Tailwind v4 @theme tokens (from current global.css) |
| Create | `src/lib/supabase/client.ts` | Browser Supabase client |
| Create | `src/lib/supabase/server.ts` | Server-side Supabase client (RSC / API routes) |
| Create | `src/lib/supabase/admin.ts` | Service-role Supabase client (admin ops) |
| Create | `src/lib/supabase/middleware.ts` | Supabase session refresh for middleware |
| Create | `src/types/database.ts` | TypeScript types for all database tables |
| Create | `src/types/content.ts` | Content-specific types (Page, BlogPost, etc.) |
| Create | `src/types/auth.ts` | Auth types (Profile, Role) |
| Create | `src/middleware.ts` | Next.js middleware (auth redirect for /admin) |
| Create | `src/app/(auth)/login/page.tsx` | Login page |
| Create | `src/app/(auth)/register/page.tsx` | Register page |
| Create | `src/app/(auth)/layout.tsx` | Auth pages layout (centered card) |
| Create | `src/app/api/auth/callback/route.ts` | Supabase auth callback |
| Create | `supabase/migrations/001_initial_schema.sql` | All tables + RLS policies |
| Create | `scripts/seed.ts` | Parse markdown → insert into Supabase |

---

## Chunk 1: Project Scaffold

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "mps-website",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "npx tsx scripts/seed.ts"
  },
  "dependencies": {
    "next": "^15.3.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@supabase/supabase-js": "^2.49.8",
    "@supabase/ssr": "^0.7.0",
    "@fontsource-variable/space-grotesk": "^5.2.10",
    "@fontsource-variable/jetbrains-mono": "^5.2.8",
    "tailwindcss": "^4.2.1",
    "@tailwindcss/postcss": "^4.2.1"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "@types/node": "^22.15.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "tsx": "^4.19.4",
    "gray-matter": "^4.0.3",
    "dotenv": "^16.5.0"
  }
}
```

- [ ] **Step 2: Create next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.next/
dist/
.env
.env.local
.env.production
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 6: Create .env.local.example**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Secrets
REVALIDATION_SECRET=generate-a-random-string
PREVIEW_JWT_SECRET=generate-a-random-string
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: Clean install, no errors

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs .gitignore .env.local.example
git commit -m "chore: scaffold Next.js 15 project with TypeScript and Supabase deps"
```

---

### Task 2: Set up Tailwind CSS 4 with design tokens

**Files:**
- Create: `src/styles/globals.css`

- [ ] **Step 1: Create globals.css with @theme tokens**

This is a verbatim copy of the current Astro project's `src/styles/global.css`, with two `@fontsource` imports added at the top (Astro loaded fonts via `<link>` tags; Next.js uses CSS imports). All tokens, selectors, and values must match exactly for visual parity.

```css
@import 'tailwindcss';
@import '@fontsource-variable/space-grotesk';
@import '@fontsource-variable/jetbrains-mono';

@theme {
  --color-bg-base: #1a1a2e;
  --color-surface: #1e1e37;
  --color-surface-elevated: #262644;
  --color-accent: #8b5cf6;
  --color-accent-muted: #7c3aed;
  --color-text-primary: #f8f8fc;
  --color-text-muted: #a0a0be;
  --color-border-default: #8b5cf6;

  --font-sans: 'Space Grotesk Variable', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  :root {
    background-color: var(--color-bg-base);
    color: var(--color-text-primary);
    font-family: var(--font-sans);
  }

  /* ── Scroll Reveal ─────────────────────────────────────────────────── */
  html[data-reveal-ready] [data-reveal] {
    opacity: 0;
    will-change: transform, opacity;
    transition-delay: var(--reveal-delay, 0ms);
  }

  html[data-reveal-ready] [data-reveal].revealed {
    opacity: 1;
  }

  @media (prefers-reduced-motion: no-preference) {
    [data-reveal="fade-up"] {
      transform: translateY(24px);
      transition: opacity 700ms ease-out, transform 700ms ease-out;
      transition-delay: var(--reveal-delay, 0ms);
    }
    [data-reveal="fade-up"].revealed {
      transform: translateY(0);
    }

    [data-reveal="fade"] {
      transition: opacity 700ms ease-out;
      transition-delay: var(--reveal-delay, 0ms);
    }

    [data-reveal="scale"] {
      transform: scale(0.9);
      transition: opacity 700ms ease-out, transform 700ms ease-out;
      transition-delay: var(--reveal-delay, 0ms);
    }
    [data-reveal="scale"].revealed {
      transform: scale(1);
    }

    [data-reveal="slide-left"] {
      transform: translateX(-30px);
      transition: opacity 700ms ease-out, transform 700ms ease-out;
      transition-delay: var(--reveal-delay, 0ms);
    }
    [data-reveal="slide-left"].revealed {
      transform: translateX(0);
    }

    [data-reveal="slide-right"] {
      transform: translateX(30px);
      transition: opacity 700ms ease-out, transform 700ms ease-out;
      transition-delay: var(--reveal-delay, 0ms);
    }
    [data-reveal="slide-right"].revealed {
      transform: translateX(0);
    }
  }

  /* Reduced motion: instant opacity only, no transforms */
  @media (prefers-reduced-motion: reduce) {
    [data-reveal] {
      transition: opacity 200ms ease-out !important;
      transform: none !important;
    }
  }

  /* ── Link Accent Utility ───────────────────────────────────────────── */
  .link-accent {
    position: relative;
    color: var(--color-text-muted);
    transition: color 200ms ease;
    text-decoration: none;
  }

  .link-accent:hover {
    color: var(--color-accent);
  }

  .link-accent::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 0;
    height: 1px;
    background-color: var(--color-accent);
    transition: width 300ms ease;
  }

  .link-accent:hover::after {
    width: 100%;
  }
}

/* ── Hero Entrance Keyframes ───────────────────────────────────────── */
@media (prefers-reduced-motion: no-preference) {
  @keyframes hero-bg {
    from { opacity: 0; scale: 1.1; }
    to { opacity: 0.2; scale: 1; }
  }

  @keyframes hero-headline {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes hero-cta {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

/* ── View Transition Keyframes ─────────────────────────────────────── */
@keyframes page-blur-out {
  from { opacity: 1; filter: blur(0); }
  to { opacity: 0; filter: blur(8px); }
}

@keyframes page-blur-in {
  from { opacity: 0; filter: blur(8px); }
  to { opacity: 1; filter: blur(0); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/globals.css
git commit -m "style: add Tailwind v4 globals with design tokens and animations"
```

---

### Task 3: Create root layout and test page

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create root layout**

```tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MPS | Missing Piece Solutions',
    template: '%s | MPS',
  },
  description:
    'AI systems that close the gap between ambition and outcome. Performance-based AI products for SMBs.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Missing Piece Solutions',
    images: ['/og/default.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-20">
      <body className="bg-bg-base text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create test homepage**

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">MPS</h1>
        <p className="text-text-muted">Next.js scaffold working.</p>
        <div className="flex gap-4 justify-center">
          <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-mono">
            Tailwind OK
          </span>
          <span className="px-3 py-1 rounded-full bg-surface text-text-muted text-sm font-mono">
            Tokens OK
          </span>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds, homepage renders at localhost:3000 with correct dark theme colors

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add root layout with fonts and test homepage"
```

---

### Task 4: Set up Supabase clients

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Create admin client (service role)**

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 4: Create middleware helper**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client helpers (browser, server, admin, middleware)"
```

---

### Task 5: Create TypeScript types

**Files:**
- Create: `src/types/database.ts`
- Create: `src/types/content.ts`
- Create: `src/types/auth.ts`

- [ ] **Step 1: Create database types**

```typescript
// src/types/database.ts
export interface Page {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: Record<string, unknown>;
  status: 'draft' | 'published';
  updated_at: string;
  updated_by: string | null;
}

export interface Service {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon: string | null;
  deliverables: string[];
  metric: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  id: string;
  name: string;
  tier_type: 'packaged' | 'custom' | 'retainer';
  price: string | null;
  metric: string | null;
  retainer_alt: string | null;
  description: string | null;
  features: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image: string | null;
  tags: string[];
  read_time: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  industry: string | null;
  summary: string | null;
  body: string | null;
  cover_image: string | null;
  tech_stack: string[];
  metrics: Record<string, string>;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  tags: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  url: string;
  filename: string;
  alt_text: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ContentRevision {
  id: string;
  table_name: string;
  record_id: string;
  snapshot: Record<string, unknown>;
  author_id: string | null;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}
```

- [ ] **Step 2: Create content types**

```typescript
// src/types/content.ts
// Page-specific JSONB content shapes

export interface HomePageContent {
  hero: {
    headline: string;
    subheadline: string;
    cta_primary: { label: string; href: string };
    cta_secondary: { label: string; href: string };
  };
  services_preview: {
    heading: string;
    items: Array<{ name: string; blurb: string }>;
  };
  portfolio_teaser: {
    heading: string;
    project_name: string;
    outcome: string;
    teaser_text: string;
    cta: { label: string; href: string };
  };
  about_preview: {
    heading: string;
    text: string;
    cta: { label: string; href: string };
  };
  cta_banner: {
    heading: string;
    subtext: string;
    cta_label: string;
    cta_href: string;
  };
}

export interface ExperiencePageContent {
  particleConfig: {
    particleSize: number;
    scrollSpeed: number;
    colorPalette: string[];
  };
  sections: Array<{
    type: 'morph' | 'scatter' | 'converge';
    shape?: 'sphere' | 'grid' | 'ring';
    label?: string;
    content: { heading: string; body: string };
  }>;
  footerNav: Array<{ label: string; href: string }>;
}

export interface ServicesPageContent {
  packaged_products: {
    eyebrow: string;
    heading: string;
    subheading: string;
  };
  custom: {
    eyebrow: string;
    heading: string;
    tagline: string;
    description: string;
    services: string[];
    pricing: string;
  };
  retainer: {
    eyebrow: string;
    heading: string;
    tagline: string;
    description: string;
    includes: string[];
    pricing: string;
  };
  cta: { heading: string; text: string; label: string; href: string };
}

export interface PricingPageContent {
  hero: { heading: string; subheading: string };
  how_it_works: {
    heading: string;
    steps: Array<{ number: string; title: string; description: string }>;
  };
  products_section: { heading: string; subheading: string };
  custom_pricing: {
    heading: string;
    items: Array<{ name: string; description: string; price: string }>;
  };
  cta: { heading: string; text: string; label: string; href: string };
}

export interface AboutPageContent {
  story: { heading: string; text: string };
  founders: Array<{
    name: string;
    role: string;
    bio: string;
    linkedin: string;
    initials: string;
    photo: string | null;
  }>;
  cta: { heading: string; text: string; label: string; href: string };
}

export interface ContactPageContent {
  intro: { heading: string; text: string };
  form_fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder: string;
    options?: string[];
  }>;
  form_submit_label: string;
  form_success_message: string;
  form_error_message: string;
  privacy_note: string;
}
```

- [ ] **Step 3: Create auth types**

```typescript
// src/types/auth.ts
export type Role = 'admin' | 'editor' | 'client';

export interface Profile {
  id: string;
  display_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript types for database, content, and auth"
```

---

### Task 6: Create Next.js middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all routes except static files, _next, and public assets
    '/((?!_next/static|_next/image|favicon.ico|logo/|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Next.js middleware for Supabase session management"
```

---

## Chunk 2: Database Schema & Seed

### Task 7: Create Supabase migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

```sql
-- ============================================================
-- MPS.2 Initial Schema
-- ============================================================

-- ── Pages (flexible JSONB content per page) ──────────────────
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ── Services ─────────────────────────────────────────────────
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  icon TEXT,
  deliverables TEXT[] DEFAULT '{}',
  metric TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Pricing Tiers ────────────────────────────────────────────
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tier_type TEXT NOT NULL CHECK (tier_type IN ('packaged', 'custom', 'retainer')),
  price TEXT,
  metric TEXT,
  retainer_alt TEXT,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Blog Posts ───────────────────────────────────────────────
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  read_time TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Case Studies ─────────────────────────────────────────────
CREATE TABLE case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  client TEXT,
  industry TEXT,
  summary TEXT,
  body TEXT,
  cover_image TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Resources ────────────────────────────────────────────────
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Media Library ────────────────────────────────────────────
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  alt_text TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Content Revisions ────────────────────────────────────────
CREATE TABLE content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  snapshot JSONB NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'editor', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Contact Submissions ──────────────────────────────────────
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  project_type TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ───────────────────────────────────────

-- Pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published pages"
  ON pages FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to pages"
  ON pages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Editors can read all pages"
  ON pages FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );
CREATE POLICY "Editors can update pages as draft only"
  ON pages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  ) WITH CHECK (status = 'draft');

-- Services (public read, admin/editor write)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read services" ON services FOR SELECT USING (true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Editors can manage services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
);

-- Pricing tiers (same pattern as services)
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read pricing" ON pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage pricing" ON pricing_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Editors can manage pricing" ON pricing_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
);

-- Blog posts (same draft/publish pattern as pages)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to posts"
  ON blog_posts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Editors can read all posts"
  ON blog_posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );
CREATE POLICY "Editors can insert draft posts"
  ON blog_posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
    AND status = 'draft'
  );
CREATE POLICY "Editors can update posts as draft"
  ON blog_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  ) WITH CHECK (status = 'draft');

-- Case studies (same pattern as blog)
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published studies"
  ON case_studies FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to studies"
  ON case_studies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Editors can read all studies"
  ON case_studies FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );
CREATE POLICY "Editors can insert draft studies"
  ON case_studies FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
    AND status = 'draft'
  );
CREATE POLICY "Editors can update studies as draft"
  ON case_studies FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  ) WITH CHECK (status = 'draft');

-- Resources (same pattern)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published resources"
  ON resources FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to resources"
  ON resources FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Editors can read all resources"
  ON resources FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );
CREATE POLICY "Editors can insert draft resources"
  ON resources FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
    AND status = 'draft'
  );
CREATE POLICY "Editors can update resources as draft"
  ON resources FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  ) WITH CHECK (status = 'draft');

-- Contact submissions
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read contacts"
  ON contact_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update contact status"
  ON contact_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read media" ON media FOR SELECT USING (true);
CREATE POLICY "Admins/editors can manage media" ON media FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Content revisions (admin/editor read, system write via service role)
ALTER TABLE content_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins/editors can read revisions" ON content_revisions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── Indexes (skip slug columns — already indexed via UNIQUE constraints) ─
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_case_studies_status ON case_studies(status);
CREATE INDEX idx_services_sort ON services(sort_order);
CREATE INDEX idx_pricing_sort ON pricing_tiers(sort_order);
CREATE INDEX idx_contact_status ON contact_submissions(status);
CREATE INDEX idx_revisions_record ON content_revisions(table_name, record_id);
```

- [ ] **Step 2: Apply migration to Supabase**

Run the SQL in the Supabase SQL Editor (Dashboard → SQL Editor → paste and run), or use the Supabase CLI:

```bash
supabase db push
```

Expected: All tables created, RLS enabled, indexes in place.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema with RLS policies and indexes"
```

---

### Task 8: Create seed script

**Files:**
- Create: `scripts/seed.ts`

This script reads the existing markdown content files (still in the repo) and inserts them into Supabase.

- [ ] **Step 1: Create seed script**

```typescript
// scripts/seed.ts
// Run: npx tsx scripts/seed.ts
// Requires: .env.local with SUPABASE_SERVICE_ROLE_KEY

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

function readMd(path: string) {
  const raw = readFileSync(path, 'utf-8');
  const { data, content } = matter(raw);
  return { data, body: content.trim() || null };
}

function readAllMd(dir: string) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((f) => {
    const slug = f.replace('.md', '');
    const { data, body } = readMd(join(dir, f));
    return { slug, data, body };
  });
}

async function seedPages() {
  console.log('Seeding pages...');
  const pages = readAllMd(join(CONTENT_DIR, 'pages'));

  for (const page of pages) {
    // Extract title/description from frontmatter, rest goes into content JSONB
    const { title, description, ...content } = page.data;

    const { error } = await supabase.from('pages').upsert(
      {
        slug: page.slug,
        title: title || page.slug,
        description: description || null,
        content,
        status: 'published',
      },
      { onConflict: 'slug' },
    );

    if (error) console.error(`  Error seeding page ${page.slug}:`, error.message);
    else console.log(`  Seeded page: ${page.slug}`);
  }

  // Seed experience page (hardcoded content — not from markdown)
  const { error } = await supabase.from('pages').upsert(
    {
      slug: 'experience',
      title: 'Experience',
      description: 'Interactive scroll-driven experience',
      content: {
        particleConfig: {
          particleSize: 3.5,
          scrollSpeed: 1.0,
          colorPalette: ['#8b5cf6', '#6366f1', '#a78bfa'],
        },
        sections: [
          {
            number: '001',
            line1: 'WE FIND',
            line2: 'THE PIECES',
            description: 'Every business has gaps between what they want to achieve and what their systems can do. We find them.',
            align: 'left',
          },
          {
            number: '002',
            line1: 'WE',
            line2: 'CONNECT THEM',
            description: 'AI agents, automation workflows, and intelligent systems — custom-built to bridge the gap.',
            align: 'right',
          },
          {
            number: '003',
            line1: 'ORBIT',
            line2: 'ACHIEVED',
            description: 'Your operations run smoother, your team focuses on what matters, and your business scales.',
            align: 'left',
          },
        ],
        footerNav: [
          { label: 'Services', href: '/services' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Portfolio', href: '/portfolio' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
      status: 'published',
    },
    { onConflict: 'slug' },
  );

  if (error) console.error('  Error seeding experience page:', error.message);
  else console.log('  Seeded page: experience');
}

async function seedServices() {
  console.log('Seeding services...');
  const { data: servicesPage } = readMd(join(CONTENT_DIR, 'pages', 'services.md'));
  const products = servicesPage.packaged_products?.items || [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const { error } = await supabase.from('services').upsert(
      {
        name: p.name,
        tagline: p.tagline || null,
        description: p.description || null,
        icon: p.icon || null,
        deliverables: p.deliverables || [],
        metric: p.metric || null,
        sort_order: i,
      },
      { onConflict: 'name' },
    );

    if (error) console.error(`  Error seeding service ${p.name}:`, error.message);
    else console.log(`  Seeded service: ${p.name}`);
  }
}

async function seedPricing() {
  console.log('Seeding pricing tiers...');
  const { data: pricingPage } = readMd(join(CONTENT_DIR, 'pages', 'pricing.md'));
  const products = pricingPage.products || [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const { error } = await supabase.from('pricing_tiers').upsert(
      {
        name: p.name,
        tier_type: 'packaged',
        price: p.price || null,
        metric: p.metric || null,
        retainer_alt: p.retainer_alt || null,
        features: [],
        sort_order: i,
      },
      { onConflict: 'name' },
    );

    if (error) console.error(`  Error seeding pricing ${p.name}:`, error.message);
    else console.log(`  Seeded pricing: ${p.name}`);
  }

  // Custom + retainer from services page
  const { data: servicesPage } = readMd(join(CONTENT_DIR, 'pages', 'services.md'));

  const custom = servicesPage.custom;
  if (custom) {
    await supabase.from('pricing_tiers').upsert(
      {
        name: 'Custom AI Development',
        tier_type: 'custom',
        price: custom.pricing,
        description: custom.description,
        features: custom.services || [],
        sort_order: products.length,
      },
      { onConflict: 'name' },
    );
    console.log('  Seeded pricing: Custom AI Development');
  }

  const retainer = servicesPage.retainer;
  if (retainer) {
    await supabase.from('pricing_tiers').upsert(
      {
        name: 'Retainer',
        tier_type: 'retainer',
        price: retainer.pricing,
        description: retainer.description,
        features: retainer.includes || [],
        sort_order: products.length + 1,
      },
      { onConflict: 'name' },
    );
    console.log('  Seeded pricing: Retainer');
  }
}

async function seedBlog() {
  console.log('Seeding blog posts...');
  const posts = readAllMd(join(CONTENT_DIR, 'blog'));

  for (const post of posts) {
    const { error } = await supabase.from('blog_posts').upsert(
      {
        slug: post.slug,
        title: post.data.title || post.slug,
        excerpt: post.data.excerpt || null,
        body: post.body,
        cover_image: post.data.cover || null,
        tags: post.data.tags || [],
        read_time: post.data.readTime || null,
        status: 'published',
        published_at: post.data.date || new Date().toISOString(),
      },
      { onConflict: 'slug' },
    );

    if (error) console.error(`  Error seeding blog ${post.slug}:`, error.message);
    else console.log(`  Seeded blog: ${post.slug}`);
  }
}

async function seedCaseStudies() {
  console.log('Seeding case studies...');
  const studies = readAllMd(join(CONTENT_DIR, 'case-studies'));

  for (const study of studies) {
    const { error } = await supabase.from('case_studies').upsert(
      {
        slug: study.slug,
        title: study.data.title || study.slug,
        client: study.data.client || null,
        industry: study.data.industry || null,
        summary: study.data.summary || study.data.excerpt || null,
        body: study.body,
        cover_image: study.data.cover || null,
        tech_stack: study.data.tech_stack || study.data.tags || [],
        metrics: study.data.metrics || {},
        status: 'published',
        published_at: study.data.date || new Date().toISOString(),
      },
      { onConflict: 'slug' },
    );

    if (error) console.error(`  Error seeding case study ${study.slug}:`, error.message);
    else console.log(`  Seeded case study: ${study.slug}`);
  }
}

async function seedResources() {
  console.log('Seeding resources...');
  const resources = readAllMd(join(CONTENT_DIR, 'resources'));

  for (const resource of resources) {
    const { error } = await supabase.from('resources').upsert(
      {
        slug: resource.slug,
        title: resource.data.title || resource.slug,
        excerpt: resource.data.excerpt || null,
        body: resource.body,
        tags: resource.data.tags || [],
        status: 'published',
      },
      { onConflict: 'slug' },
    );

    if (error) console.error(`  Error seeding resource ${resource.slug}:`, error.message);
    else console.log(`  Seeded resource: ${resource.slug}`);
  }
}

async function main() {
  console.log('Starting seed...\n');

  await seedPages();
  await seedServices();
  await seedPricing();
  await seedBlog();
  await seedCaseStudies();
  await seedResources();

  console.log('\nSeed complete!');
}

main().catch(console.error);
```

- [ ] **Step 2: Test seed script**

First, create a `.env.local` file with real Supabase credentials, then run:

```bash
npm run seed
```

Expected output:
```
Starting seed...

Seeding pages...
  Seeded page: home
  Seeded page: services
  Seeded page: pricing
  Seeded page: about
  Seeded page: contact
  Seeded page: experience
Seeding services...
  Seeded service: Voice AI Agent
  Seeded service: Website Chat Widget
  ...
Seeding pricing tiers...
  ...
Seeding blog posts...
  ...
Seeding case studies...
  ...
Seeding resources...
  ...

Seed complete!
```

Verify in Supabase Dashboard → Table Editor that all rows are present.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add content seed script (markdown → Supabase)"
```

---

## Chunk 3: Auth System

### Task 9: Create auth pages layout

**Files:**
- Create: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Create auth layout**

```tsx
// src/app/(auth)/layout.tsx
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-text-primary">
            MPS
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/layout.tsx
git commit -m "feat: add auth pages layout"
```

---

### Task 10: Create login page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create login page**

```tsx
// src/app/(auth)/login/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const justRegistered = searchParams.get('registered') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Sign in</h1>

        {justRegistered && (
          <div className="text-sm text-green-400 bg-green-400/10 rounded-lg px-4 py-3">
            Account created! Check your email to confirm, then sign in.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <p className="text-center text-sm text-text-muted">
        <Link href="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/login/
git commit -m "feat: add login page with Supabase Auth"
```

---

### Task 11: Create register page

**Files:**
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Create register page**

```tsx
// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-text-muted">
          We sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
          Click it to activate your account, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-muted transition-all"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Create account</h1>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm text-text-muted">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/register/
git commit -m "feat: add register page with Supabase Auth"
```

---

### Task 12: Create auth callback route

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

- [ ] **Step 1: Create callback route**

```typescript
// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Validate redirect target to prevent open redirect attacks
  const rawNext = searchParams.get('next') ?? '/';
  const next = rawNext.startsWith('/') ? rawNext : '/';

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add Supabase auth callback route"
```

---

### Task 13: Final build verification

- [ ] **Step 1: Verify build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors. Pages generated:
- `/` (homepage)
- `/login`
- `/register`

- [ ] **Step 2: Verify dev server**

Run: `npm run dev`
Expected:
- `http://localhost:3000` shows test homepage with correct dark theme
- `http://localhost:3000/login` shows login form
- `http://localhost:3000/register` shows register form
- `http://localhost:3000/admin` redirects to `/login?redirect=/admin`

- [ ] **Step 3: Final commit**

```bash
git add src/ next.config.ts tsconfig.json postcss.config.mjs package.json package-lock.json .env.local.example .gitignore supabase/ scripts/seed.ts
git commit -m "chore: phase 1 complete — Next.js scaffold, database schema, auth system"
```

---

## Completion Checklist

- [ ] Next.js 15 project builds and runs
- [ ] Tailwind v4 tokens match current Astro site exactly
- [ ] Supabase clients work (browser, server, admin)
- [ ] All 10 database tables created with RLS policies
- [ ] Seed script successfully populates all content from markdown
- [ ] Login and register pages functional with Supabase Auth
- [ ] Middleware protects /admin routes
- [ ] Auth callback route handles Supabase redirects

## Next Plans

After this phase, the following plans will be created:

- **Phase 2:** Public pages — migrate all 10 pages + UI components (Button, Badge, GlassCard, SectionHeading, Nav, Footer)
- **Phase 3:** Three.js — ParticleGate and ParticleExperience as React components
- **Phase 4:** Admin panel — Dashboard, content editors, media library, draft/publish
- **Phase 5:** API routes, contact form, ISR revalidation
- **Phase 6:** Deployment — Dockerfile, VPS setup, DNS
