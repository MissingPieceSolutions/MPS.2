import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getResource, getResources } from '@/lib/content';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;

export async function generateStaticParams() {
  const resources = await getResources();
  return resources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  return { title: resource?.title, description: resource?.excerpt || undefined };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) notFound();

  return (
    <article className="px-6 pt-12 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/resources" className="text-sm text-accent hover:underline">&larr; Back to Resources</Link>

        <header className="mt-6 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{resource.title}</h1>
          {resource.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {resource.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          )}
        </header>

        {resource.body && (
          <div className="mt-12 prose prose-invert prose-accent max-w-none whitespace-pre-wrap">
            {resource.body}
          </div>
        )}
      </div>
    </article>
  );
}
