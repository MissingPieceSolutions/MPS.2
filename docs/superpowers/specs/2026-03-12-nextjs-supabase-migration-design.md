# MPS.2 — Next.js + Supabase Migration Design

**Date:** 2026-03-12
**Status:** Draft
**Authors:** Efe + Claude

## 1. Overview

Migrate the MPS.2 company website from Astro 5 (static site generator) to Next.js 15 (App Router) with Supabase as the backend. This transforms a static markdown-driven site into a full-stack application with a CMS admin panel, auth system, and dynamic content management.

### Current State
- Astro 5 + Tailwind CSS 4 static site
- 10 pages, 15 components, 4 content collections (markdown)
- Three.js particle gate + GSAP scroll-driven experience page
- Formspree contact form
- Deployed on Cloudflare Pages

### Target State
- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase (cloud) for database, auth, storage
- Full CMS admin panel with draft/publish, media library, revisions
- Configurable Three.js components via `@react-three/fiber`
- VPS deployment (Docker/PM2, standalone Node.js)

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.x | App Router, API routes, ISR, middleware |
| UI | React | 19.x | Component library |
| Language | TypeScript | 5.x | Type safety throughout |
| Styling | Tailwind CSS | 4.x | CSS-first config, existing design tokens |
| 3D | Three.js + @react-three/fiber | latest | Particle systems, WebGL |
| Animation | GSAP + ScrollTrigger | 3.x | Scroll-driven animations |
| Database | Supabase (PostgreSQL) | cloud | Content, auth, storage |
| Auth | Supabase Auth | cloud | Email/password, role-based access |
| Storage | Supabase Storage | cloud | Media uploads (images, files) |
| Rich Text | Tiptap | 2.x | Admin content editor |
| Deployment | Docker / PM2 | - | VPS, standalone Node.js server |

## 3. Project Structure

```
MPS.2/
├── public/                      # Static assets (favicons, logos, OG images)
├── scripts/                     # Build utilities (OG image generator, DB seed)
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── seed.sql                 # Initial content seed (from current markdown)
└── src/
    ├── app/                     # Next.js App Router
    │   ├── (public)/            # Route group: public website
    │   │   ├── page.tsx         # Homepage (particle gate)
    │   │   ├── experience/
    │   │   │   └── page.tsx
    │   │   ├── services/
    │   │   │   └── page.tsx
    │   │   ├── pricing/
    │   │   │   └── page.tsx
    │   │   ├── portfolio/
    │   │   │   └── page.tsx
    │   │   ├── about/
    │   │   │   └── page.tsx
    │   │   ├── contact/
    │   │   │   └── page.tsx
    │   │   ├── blog/
    │   │   │   ├── page.tsx     # Blog listing
    │   │   │   └── [slug]/
    │   │   │       └── page.tsx # Blog post detail
    │   │   ├── resources/
    │   │   │   ├── page.tsx     # Resource listing
    │   │   │   └── [slug]/
    │   │   │       └── page.tsx # Resource detail
    │   │   ├── privacy/
    │   │   │   └── page.tsx
    │   │   ├── showcase/
    │   │   │   └── page.tsx
    │   │   └── layout.tsx       # Public layout (Nav, Footer, ScrollProgress)
    │   ├── admin/                 # Admin CMS (layout.tsx provides sidebar + auth guard)
    │   │   ├── page.tsx             # Dashboard overview
    │   │   ├── pages/
    │   │   │   ├── page.tsx         # List all editable pages
    │   │   │   └── [slug]/
    │   │   │       └── page.tsx     # Edit specific page
    │   │   ├── blog/
    │   │   │   ├── page.tsx         # Blog post list
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx     # Create post
    │   │   │   └── [id]/
    │   │   │       └── page.tsx     # Edit post
    │   │   ├── case-studies/
    │   │   │   ├── page.tsx
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── [id]/
    │   │   │       └── page.tsx
    │   │   ├── resources/
    │   │   │   ├── page.tsx         # Resource list
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx
    │   │   │   └── [id]/
    │   │   │       └── page.tsx
    │   │   ├── services/
    │   │   │   └── page.tsx         # Edit services + pricing
    │   │   ├── media/
    │   │   │   └── page.tsx         # Media library
    │   │   ├── contacts/
    │   │   │   └── page.tsx         # Contact submissions inbox
    │   │   └── layout.tsx           # Admin layout (sidebar, auth guard)
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── register/
    │   │   │   └── page.tsx
    │   │   └── reset-password/
    │   │       └── page.tsx
    │   ├── api/
    │   │   ├── content/
    │   │   │   ├── pages/
    │   │   │   │   └── route.ts       # GET/PUT page content
    │   │   │   ├── blog/
    │   │   │   │   └── route.ts       # CRUD blog posts
    │   │   │   ├── case-studies/
    │   │   │   │   └── route.ts       # CRUD case studies
    │   │   │   ├── services/
    │   │   │   │   └── route.ts       # CRUD services
    │   │   │   └── pricing/
    │   │   │       └── route.ts       # CRUD pricing tiers
    │   │   ├── media/
    │   │   │   └── route.ts           # Upload, list, delete media
    │   │   ├── contact/
    │   │   │   └── route.ts           # Submit contact form
    │   │   ├── revalidate/
    │   │   │   └── route.ts           # On-demand ISR revalidation
    │   │   └── auth/
    │   │       └── callback/
    │   │           └── route.ts       # Supabase auth callback
    │   ├── layout.tsx                 # Root layout (fonts, metadata)
    │   ├── not-found.tsx              # Custom 404
    │   └── error.tsx                  # Global error boundary
    ├── components/
    │   ├── layout/
    │   │   ├── Nav.tsx
    │   │   ├── Footer.tsx
    │   │   ├── ScrollProgress.tsx
    │   │   └── AdminSidebar.tsx
    │   ├── sections/
    │   │   ├── HeroSection.tsx
    │   │   ├── CtaBanner.tsx
    │   │   ├── TrustBar.tsx
    │   │   ├── FounderCard.tsx
    │   │   ├── StatCallout.tsx
    │   │   ├── PortfolioGrid.tsx
    │   │   └── PortfolioList.tsx
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Badge.tsx
    │   │   ├── GlassCard.tsx
    │   │   └── SectionHeading.tsx
    │   ├── three/
    │   │   ├── ParticleGate.tsx       # Homepage particle entrance
    │   │   ├── ParticleExperience.tsx # Scroll-driven experience
    │   │   ├── shaders/              # GLSL shader files
    │   │   │   ├── particle.vert
    │   │   │   └── particle.frag
    │   │   └── config.ts             # Default particle configs
    │   └── admin/
    │       ├── ContentEditor.tsx      # Tiptap rich text editor
    │       ├── PageEditor.tsx         # Structured JSONB page editor
    │       ├── MediaPicker.tsx        # Media library modal
    │       ├── PreviewBanner.tsx      # Draft preview banner
    │       ├── RevisionHistory.tsx    # Version history panel
    │       └── ContactInbox.tsx       # Contact submission viewer
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts             # Browser Supabase client
    │   │   ├── server.ts             # Server-side client (RSC / API routes)
    │   │   └── admin.ts              # Service role client (admin operations)
    │   ├── auth/
    │   │   ├── middleware.ts          # Auth check for admin routes
    │   │   └── helpers.ts            # Session helpers, role checks
    │   └── content.ts                # Content fetching + caching helpers
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useContent.ts
    │   └── useMediaUpload.ts
    ├── types/
    │   ├── content.ts                # Page, BlogPost, CaseStudy, Service, etc.
    │   ├── auth.ts                   # User, Profile, Role
    │   └── database.ts               # Generated Supabase types
    ├── middleware.ts                  # Next.js middleware (auth redirect)
    └── styles/
        └── globals.css               # Tailwind v4 @theme tokens + animations
```

## 4. Database Schema

### 4.1 Content Tables

```sql
-- Flexible page content (homepage, services, about, contact, pricing)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- 'home', 'services', 'about', etc.
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}', -- Flexible section data per page
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Services (individual products)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  icon TEXT,                           -- Icon identifier (e.g., 'phone', 'chat')
  deliverables TEXT[] DEFAULT '{}',
  metric TEXT,                         -- e.g., 'Per booked appointment'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing tiers
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier_type TEXT NOT NULL CHECK (tier_type IN ('packaged', 'custom', 'retainer')),
  price TEXT,                          -- Display price (e.g., '$75-100')
  metric TEXT,                         -- e.g., 'Per booked appointment'
  retainer_alt TEXT,                   -- Alternative retainer price
  description TEXT,
  features TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,                           -- Rich text (HTML from Tiptap)
  cover_image TEXT,                    -- URL from Supabase Storage
  tags TEXT[] DEFAULT '{}',
  read_time TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Case studies
CREATE TABLE case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  client TEXT,
  industry TEXT,
  summary TEXT,
  body TEXT,                           -- Rich text (HTML from Tiptap)
  cover_image TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',          -- e.g., { "reduction": "70%", "timeline": "6 weeks" }
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resources (guides, templates)
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
```

### 4.2 Media & CMS Tables

```sql
-- Media library
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,                   -- Supabase Storage URL
  filename TEXT NOT NULL,
  alt_text TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content revision history
CREATE TABLE content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,            -- 'pages', 'blog_posts', etc.
  record_id UUID NOT NULL,             -- ID of the record
  snapshot JSONB NOT NULL,             -- Full row snapshot before change
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Auth & Users

```sql
-- Extended user profiles (auth.users is managed by Supabase Auth)
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
```

### 4.4 Contact Submissions

```sql
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
```

### 4.5 Row Level Security (RLS)

```sql
-- Public read access for published content
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published pages"
  ON pages FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to pages"
  ON pages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Editors can read and save drafts"
  ON pages FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );
CREATE POLICY "Editors can update but only save as draft"
  ON pages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  ) WITH CHECK (status = 'draft');

-- Same pattern for blog_posts, case_studies, resources
-- Note: Only admins can set status = 'published'. Editors can create/edit drafts only.

-- Contact form: anyone can insert, only admins can read
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read contact submissions"
  ON contact_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Media: admins/editors can manage
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage media"
  ON media FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );
CREATE POLICY "Public can read media"
  ON media FOR SELECT USING (true);
```

## 5. Rendering Strategy

| Page | Strategy | Revalidation | Reason |
|------|----------|-------------|--------|
| Homepage | ISR | 60s | SEO + particle gate (client hydration) |
| Services | ISR | 60s | Content from Supabase, rarely changes |
| Pricing | ISR | 60s | Same as services |
| About | ISR | 60s | Static-ish content |
| Portfolio | ISR | 60s | Case study content |
| Blog listing | ISR | 60s | New posts trigger revalidation |
| Blog post `[slug]` | ISR | 60s | Per-post revalidation |
| Contact | Static shell | - | Client-side form, no dynamic server content |
| Experience | Client | - | Three.js, fully client-rendered |
| Showcase | ISR | 60s | Design system preview |
| Resource listing | ISR | 60s | New resources trigger revalidation |
| Resource `[slug]` | ISR | 60s | Per-resource revalidation |
| Privacy | ISR | 300s | Rarely changes |
| Admin `/*` | Client (SPA) | - | Behind auth, no SEO needed |
| Auth pages | Static | - | Login/register forms |

**ISR revalidation flow:**
1. Admin saves content via CMS
2. API route writes to Supabase + creates content_revision
3. API route calls `revalidatePath('/services')` (or relevant path)
4. Next request to that path serves fresh content

**Preview system:**
- Public pages: `WHERE status = 'published'`
- Preview mode: `WHERE id = :id` (ignores status filter)
- Activated via `?preview=true&token=<preview_token>` where `preview_token` is a short-lived signed JWT (15 min expiry) generated by the admin panel — NOT the user's session token. This avoids leaking auth credentials in URLs, browser history, and referrer headers.
- Admin clicks "Preview" in CMS → API generates preview token → redirects to `/<page>?preview=true&token=<preview_token>`
- `PreviewBanner` component shows at top with Publish/Edit/Exit actions

## 6. Three.js Architecture

### 6.1 Component Design

```tsx
// ParticleGate — Homepage hero
interface ParticleGateProps {
  particleCount?: number;        // default: 5000
  colorPrimary?: string;         // default: '#8b5cf6'
  colorSecondary?: string;       // default: '#6366f1'
  speed?: number;                // default: 0.8
  mouseInfluence?: number;       // default: 0.3
  logoSrc?: string;              // default: '/logo/mps-icon.svg'
  onEnter?: () => void;          // callback when user "enters"
}

// ParticleExperience — Scroll-driven page
interface ParticleExperienceProps {
  sections: ExperienceSection[];  // content from Supabase
  scrollSpeed?: number;           // default: 1.0
  particleSize?: number;          // default: 2
  colorPalette?: string[];        // configurable colors
}

interface ExperienceSection {
  type: 'morph' | 'scatter' | 'converge';
  shape?: 'sphere' | 'grid' | 'ring';
  label?: string;
  content: {
    heading: string;
    body: string;
  };
}
```

### 6.2 Loading Strategy

Three.js components are heavy (~500KB). Strategy:
- Wrap in `next/dynamic` with `ssr: false` (Three.js requires browser APIs)
- Show a lightweight CSS skeleton/gradient while loading
- Lazy-load `@react-three/fiber` only on pages that use it (homepage, experience)

### 6.3 Admin Configuration

Visual settings (particle count, colors, speed) stored in the `pages` table JSONB:
```json
{
  "hero": {
    "particleGate": {
      "particleCount": 5000,
      "colorPrimary": "#8b5cf6",
      "speed": 0.8
    }
  }
}
```

Editable from the admin page editor as a "Visual Settings" panel.

### 6.4 Experience Page Data Model

The experience page sections are currently hardcoded in `experience.astro`. In the migration, they live in the `pages` table (slug: `'experience'`) as JSONB content:

```json
{
  "particleConfig": {
    "particleSize": 2,
    "scrollSpeed": 1.0,
    "colorPalette": ["#8b5cf6", "#6366f1", "#a78bfa"]
  },
  "sections": [
    {
      "type": "morph",
      "shape": "sphere",
      "label": "What We Do",
      "content": {
        "heading": "AI That Delivers",
        "body": "We build AI products that..."
      }
    },
    {
      "type": "scatter",
      "label": "Services",
      "content": {
        "heading": "Performance-Based AI",
        "body": "You only pay when..."
      }
    }
  ],
  "footerNav": [
    { "label": "Services", "href": "/services" },
    { "label": "Pricing", "href": "/pricing" }
  ]
}
```

The `seed.ts` script extracts the current hardcoded sections array from `experience.astro` and inserts it as the `pages.content` JSONB for the experience page.

## 7. Auth Flow

### 7.1 Login

1. User visits `/login`
2. Submits email + password
3. Supabase Auth returns session (JWT + refresh token)
4. Session stored in cookies via `@supabase/ssr`
5. Redirect to `/admin` or previous page

### 7.2 Middleware Protection

```typescript
// src/middleware.ts
// Runs on every request matching /admin/*
// Checks for valid Supabase session
// If no session → redirect to /login?redirect=/admin/...
// If session but wrong role → redirect to /unauthorized
```

### 7.3 Role-Based Access

| Role | Public Site | Admin Dashboard | Content Edit | Publish | User Management | Settings |
|------|------------|-----------------|-------------|---------|-----------------|----------|
| admin | Yes | Yes | Yes | Yes | Yes | Yes |
| editor | Yes | Yes | Draft only | No (admin approves) | No | No |
| client | Yes | Client portal (future) | No | No | No | No |

## 8. Content Migration

All existing markdown content will be seeded into Supabase:

| Source File | Target Table | Notes |
|------------|-------------|-------|
| `src/content/pages/home.md` | `pages` (slug: 'home') | YAML frontmatter → JSONB content |
| `src/content/pages/services.md` | `pages` + `services` table | Products extracted to services table |
| `src/content/pages/pricing.md` | `pages` + `pricing_tiers` table | Tiers extracted to pricing_tiers |
| `src/content/pages/about.md` | `pages` (slug: 'about') | Founders, story → JSONB |
| `src/content/pages/contact.md` | `pages` (slug: 'contact') | Form fields config → JSONB |
| `src/pages/experience.astro` (hardcoded sections array) | `pages` (slug: 'experience') | Sections array + particle config → JSONB content |
| `src/content/case-studies/*.md` | `case_studies` | 4 case studies |
| `src/content/blog/*.md` | `blog_posts` | 3 blog posts |
| `src/content/resources/*.md` | `resources` | 3 resource guides |

A `scripts/seed.ts` script will parse the markdown files and insert into Supabase.

## 9. API Routes

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/content/pages` | GET | Public | List published pages |
| `/api/content/pages` | PUT | Admin/Editor | Update page content |
| `/api/content/blog` | GET | Public | List published posts |
| `/api/content/blog` | POST | Admin/Editor | Create post |
| `/api/content/blog` | PUT | Admin/Editor | Update post |
| `/api/content/blog` | DELETE | Admin | Delete post |
| `/api/content/case-studies` | GET/POST/PUT/DELETE | Same pattern | CRUD case studies |
| `/api/content/resources` | GET/POST/PUT/DELETE | Same pattern | CRUD resources |
| `/api/content/services` | GET/POST/PUT/DELETE | Same pattern | CRUD services |
| `/api/content/pricing` | GET/POST/PUT/DELETE | Same pattern | CRUD pricing |
| `/api/media` | GET | Public | List media |
| `/api/media` | POST | Admin/Editor | Upload to Supabase Storage |
| `/api/media` | DELETE | Admin | Delete media |
| `/api/contact` | POST | Public | Submit contact form |
| `/api/revalidate` | POST | Admin/Editor | Trigger ISR revalidation |
| `/api/auth/callback` | GET | - | Supabase auth callback |

## 10. Deployment (VPS)

### Docker Setup

```dockerfile
# Using node:20-slim (Debian-based) instead of Alpine to avoid musl libc
# issues with native modules like canvas (used for OG image generation)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Next.js
NEXT_PUBLIC_SITE_URL=https://missingpiecesolutions.com

# App secrets
REVALIDATION_SECRET=<random-secret>
PREVIEW_JWT_SECRET=<random-secret>
```

### Process Management

- **Option A:** Docker Compose (Next.js container + optional reverse proxy)
- **Option B:** PM2 with `ecosystem.config.js` behind nginx

## 11. Design Tokens (Preserved)

The existing Tailwind v4 `@theme` block in `globals.css` carries over unchanged. All color tokens, fonts, and animation values remain the same to ensure visual parity.

## 12. Migration Phases (High-Level)

This is a large migration. Suggested build order:

1. **Project scaffold** — Next.js + TypeScript + Tailwind v4 + Supabase client setup
2. **Database setup** — Create tables, RLS policies, seed script
3. **Auth system** — Supabase Auth, middleware, login/register pages
4. **Public pages** — Migrate all 10 pages (static content from Supabase)
5. **Three.js components** — ParticleGate + ParticleExperience as React components
6. **Admin panel** — Dashboard, content editors, media library
7. **Draft/publish + preview** — Status workflow, preview mode, revision history
8. **Contact form** — API route, admin inbox
9. **Deployment** — Dockerfile, VPS setup, DNS
10. **Content migration** — Run seed script, verify all content

## 13. Success Criteria

- All 10 public pages render with visual parity to current Astro site
- Three.js particle gate and experience page work with configurable props
- Admin panel: CRUD all content types, upload media, draft/publish workflow
- Auth: login, role-based access, middleware protection
- Contact form submissions stored in Supabase, visible in admin
- Preview system works for draft content
- ISR revalidation triggers on content updates
- Clean Docker build, deployable to VPS
- Lighthouse: Performance > 80, SEO > 90 on public pages
