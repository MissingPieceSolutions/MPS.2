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
