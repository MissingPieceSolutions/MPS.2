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

main().catch((err) => { console.error(err); process.exit(1); });
