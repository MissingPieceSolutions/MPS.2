import type { Metadata } from 'next';
import { getPage } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FounderCard } from '@/components/sections/FounderCard';
import { CtaBanner } from '@/components/sections/CtaBanner';
import type { AboutPageContent } from '@/types/content';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return { title: page?.title || 'About', description: page?.description || undefined };
}

export default async function AboutPage() {
  const page = await getPage('about');
  const content = page?.content as unknown as AboutPageContent | undefined;

  return (
    <div className="space-y-24 pb-12">
      {/* Header */}
      <section id="about-hero" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="About" heading={page?.title || 'About MPS'} />
        </div>
      </section>

      {/* Story */}
      {content?.story && (
        <section id="story" className="px-6">
          <div className="mx-auto max-w-4xl space-y-4" data-reveal="fade-up">
            <h3 className="text-2xl font-bold text-text-primary">{content.story.heading}</h3>
            <p className="text-text-muted leading-relaxed">{content.story.text}</p>
          </div>
        </section>
      )}

      {/* Founders */}
      {content?.founders && (
        <section id="team" className="px-6">
          <div className="mx-auto max-w-6xl">
            <SectionHeading eyebrow="Team" heading="Meet the Founders" align="center" />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.founders.map((founder, i) => (
                <div key={founder.name} data-reveal="fade-up" style={{ '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}>
                  <FounderCard {...founder} />
                </div>
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
