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
