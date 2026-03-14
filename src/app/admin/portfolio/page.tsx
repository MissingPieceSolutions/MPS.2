'use client';

import { useEffect, useState } from 'react';

interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  industry: string | null;
  status: string;
  published_at: string | null;
}

export default function AdminPortfolioPage() {
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/content?table=case_studies')
      .then((r) => r.json())
      .then((res) => { setStudies(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Portfolio / Case Studies</h1>

      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-muted text-left">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {studies.map((study) => (
              <tr key={study.id} className="border-b border-white/5 hover:bg-surface-elevated/50">
                <td className="px-4 py-3 text-text-primary font-medium">{study.title}</td>
                <td className="px-4 py-3 text-text-muted">{study.client || '—'}</td>
                <td className="px-4 py-3 text-text-muted">{study.industry || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    study.status === 'published' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {study.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
