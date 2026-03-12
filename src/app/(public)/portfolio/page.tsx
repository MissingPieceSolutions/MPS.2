import type { Metadata } from 'next';
import { getCaseStudies } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PortfolioList } from '@/components/sections/PortfolioList';
import { CtaBanner } from '@/components/sections/CtaBanner';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Portfolio', description: 'Our work — AI automation case studies.' };

export default async function PortfolioPage() {
  const projects = await getCaseStudies();

  return (
    <div className="space-y-24 pb-12">
      <section id="portfolio" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Portfolio" heading="Our Work" subheading="Case studies from real client engagements." />
          <div className="mt-12">
            <PortfolioList projects={projects} />
          </div>
        </div>
      </section>

      <CtaBanner
        heading="Got a Process Worth Automating?"
        subtext="Tell us what you're working on — we'll tell you what's possible."
        ctaLabel="Start a Conversation"
        ctaHref="/contact"
      />
    </div>
  );
}
