'use client';

import { useEffect, useState } from 'react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  tags: string[];
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/content?table=blog_posts')
      .then((r) => r.json())
      .then((res) => { setPosts(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Blog Posts</h1>

      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-muted text-left">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-white/5 hover:bg-surface-elevated/50">
                <td className="px-4 py-3 text-text-primary font-medium">{post.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    post.status === 'published' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {post.tags?.map((tag) => (
                      <span key={tag} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
