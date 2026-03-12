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
