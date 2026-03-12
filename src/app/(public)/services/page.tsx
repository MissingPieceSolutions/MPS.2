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
