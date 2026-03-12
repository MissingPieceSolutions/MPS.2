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
