import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';

export const metadata: Metadata = { title: 'Showcase', description: 'Component showcase and design system preview.' };

export default function ShowcasePage() {
  return (
    <div className="px-6 pt-12 pb-24 space-y-24">
      <div className="mx-auto max-w-4xl space-y-20">
        {/* Buttons */}
        <section id="buttons">
          <SectionHeading eyebrow="Primitives" heading="Buttons" />
          <div className="mt-8 flex flex-wrap gap-4">
            <Button>Primary Default</Button>
            <Button size="sm">Primary Small</Button>
            <Button variant="ghost">Ghost Default</Button>
            <Button variant="ghost" size="sm">Ghost Small</Button>
          </div>
        </section>

        {/* Badges */}
        <section id="badges">
          <SectionHeading eyebrow="Primitives" heading="Badges" />
          <div className="mt-8 flex flex-wrap gap-4">
            <Badge>Accent Badge</Badge>
            <Badge variant="muted">Muted Badge</Badge>
          </div>
        </section>

        {/* Section Headings */}
        <section id="headings">
          <SectionHeading eyebrow="Primitives" heading="Section Headings" />
          <div className="mt-8 space-y-8">
            <SectionHeading eyebrow="Left Aligned" heading="With Subheading" subheading="This is the subheading text." />
            <SectionHeading eyebrow="Centered" heading="Center Aligned" subheading="Also with a subheading." align="center" />
          </div>
        </section>

        {/* Glass Cards */}
        <section id="cards">
          <SectionHeading eyebrow="Primitives" heading="Glass Cards" />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard>
              <h3 className="font-bold text-text-primary">Standard</h3>
              <p className="text-sm text-text-muted mt-2">No hover effect.</p>
            </GlassCard>
            <GlassCard hover>
              <h3 className="font-bold text-text-primary">With Hover</h3>
              <p className="text-sm text-text-muted mt-2">Hover to see the glow.</p>
            </GlassCard>
            <GlassCard hover>
              <h3 className="font-bold text-text-primary">With Content</h3>
              <p className="text-sm text-text-muted mt-2">Cards can contain anything.</p>
              <Button size="sm" className="mt-4">Action</Button>
            </GlassCard>
          </div>
        </section>
      </div>
    </div>
  );
}
