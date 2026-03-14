'use client';

import { useEffect, useState } from 'react';

interface PageRecord {
  id: string;
  slug: string;
  title: string;
  status: string;
  updated_at: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/content?table=pages')
      .then((r) => r.json())
      .then((res) => { setPages(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Pages</h1>

      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-muted text-left">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b border-white/5 hover:bg-surface-elevated/50">
                <td className="px-4 py-3 text-text-primary font-medium">{page.title}</td>
                <td className="px-4 py-3 text-text-muted font-mono text-xs">/{page.slug}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    page.status === 'published' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {new Date(page.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
