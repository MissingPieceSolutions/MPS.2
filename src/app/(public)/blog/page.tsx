import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Blog', description: 'Insights on AI automation, strategy, and delivery.' };

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="pb-12">
      <section id="blog" className="px-6 pt-12">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow="Blog" heading="Insights" subheading="Practical takes on AI automation." />
          <div className="mt-12 space-y-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <GlassCard hover className="flex flex-col gap-3">
                  <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && <p className="text-sm text-text-muted">{post.excerpt}</p>}
                  <div className="flex items-center gap-3 text-xs text-text-muted/60">
                    {post.published_at && <span>{new Date(post.published_at).toLocaleDateString()}</span>}
                    {post.read_time && <span>{post.read_time}</span>}
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {post.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
                    </div>
                  )}
                </GlassCard>
              </Link>
            ))}
            {posts.length === 0 && <p className="text-text-muted">No posts yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
