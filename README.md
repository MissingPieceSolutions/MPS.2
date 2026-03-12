# MPS.2 — Missing Piece Solutions Website

Company website for [MPS (Missing Piece Solutions)](https://mps-2.pages.dev), an AI automation agency offering performance-based AI products for SMBs.

## Tech Stack

- **[Astro 5](https://astro.build)** — Static site generator
- **[Tailwind CSS 4](https://tailwindcss.com)** — Utility-first styling (CSS-first config via `@theme`)
- **[Three.js](https://threejs.org)** + **[GSAP](https://gsap.com)** — Particle animations (homepage gate, experience page)
- **[Formspree](https://formspree.io)** — Contact form submission
- **Deployed on** [Cloudflare Pages](https://pages.cloudflare.com)

## Project Structure

```
MPS.2/
├── public/                     # Static assets (favicons, logos, OG images)
├── scripts/                    # Build utilities (OG image generator)
└── src/
    ├── components/
    │   ├── layout/             # Nav, Footer, ScrollProgress
    │   ├── sections/           # Page-level sections (HeroSection, CtaBanner, TrustBar, etc.)
    │   └── ui/                 # Reusable primitives (Button, Badge, GlassCard, SectionHeading)
    ├── content/                # Astro Content Collections (markdown + YAML frontmatter)
    │   ├── pages/              # Page content (home, services, about, contact, pricing)
    │   ├── case-studies/       # Portfolio case studies (mps-tourism + 3 legacy)
    │   ├── blog/               # Blog posts (3 articles)
    │   └── resources/          # Resource guides (3 guides)
    ├── layouts/                # BaseLayout (shared head, meta, fonts, analytics)
    ├── pages/                  # Astro page routes (1 file = 1 URL)
    ├── scripts/                # Client-side JS (Three.js particles, scroll-reveal)
    └── styles/                 # global.css (Tailwind @theme tokens, animations)
```

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `index.astro` | Homepage — particle gate entrance |
| `/experience` | `experience.astro` | Scroll-driven interactive experience page |
| `/services` | `services.astro` | 5 AI products + custom dev + retainer tiers |
| `/pricing` | `pricing.astro` | Performance-based pricing cards |
| `/portfolio` | `portfolio.astro` | Case study (BRT Tourism quotation engine) |
| `/about` | `about.astro` | Team and company story |
| `/contact` | `contact.astro` | Formspree contact form |
| `/showcase` | `showcase.astro` | Component showcase / design system preview |
| `/privacy` | `privacy.astro` | Privacy policy |
| `/404` | `404.astro` | Custom 404 page |

## Content Collections

All page content is driven by markdown files in `src/content/`. Pages use `getEntry()` to fetch content and pass data as props to components. To update copy, edit the `.md` files — no component changes needed.

**Example:** To update service descriptions, edit `src/content/pages/services.md`.

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Design System

- **Font:** Space Grotesk (variable weight)
- **Theme:** Dark mode with glassmorphism (see `src/styles/global.css` `@theme` block)
- **UI primitives:** `Button`, `Badge`, `GlassCard`, `SectionHeading` — use these for consistency
- **Animations:** Scroll-reveal system (`data-reveal` attributes), GSAP for particle effects
