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
