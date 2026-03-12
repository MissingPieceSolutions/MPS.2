import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '@/lib/content';
import { createBuildSupabase } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 60;

export async function generateStaticParams() {
  const supabase = createBuildSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from('blog_posts').select('slug').eq('status', 'published');
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  return { title: post?.title, description: post?.excerpt || undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="px-6 pt-12 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm text-accent hover:underline">&larr; Back to Blog</Link>

        <header className="mt-6 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-text-muted">
            {post.published_at && <time>{new Date(post.published_at).toLocaleDateString()}</time>}
            {post.read_time && <span>{post.read_time}</span>}
          </div>
          {post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          )}
        </header>

        {post.body && (
          <div className="mt-12 prose prose-invert prose-accent max-w-none whitespace-pre-wrap">
            {post.body}
          </div>
        )}
      </div>
    </article>
  );
}
