import type { Metadata } from 'next';
import Link from 'next/link';
import { getResources } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Resources', description: 'Guides and templates for AI automation.' };

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div className="pb-12">
      <section id="resources" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Resources" heading="Guides & Templates" subheading="Practical resources for your AI journey." />
          <div className="mt-12 space-y-6">
            {resources.map((r) => (
              <Link key={r.id} href={`/resources/${r.slug}`} className="block group">
                <GlassCard hover className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                    {r.title}
                  </h3>
                  {r.excerpt && <p className="text-sm text-text-muted">{r.excerpt}</p>}
                  {r.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {r.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
                    </div>
                  )}
                </GlassCard>
              </Link>
            ))}
            {resources.length === 0 && <p className="text-text-muted">No resources yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
