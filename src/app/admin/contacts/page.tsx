'use client';

import { useEffect, useState } from 'react';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: string | null;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/contacts')
      .then((r) => r.json())
      .then((res) => { setContacts(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch('/api/admin/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, status: status as Contact['status'] } : c));
  }

  const statusColors: Record<string, string> = {
    new: 'bg-accent/20 text-accent',
    read: 'bg-yellow-400/20 text-yellow-400',
    replied: 'bg-green-400/20 text-green-400',
  };

  if (loading) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Contact Submissions</h1>

      {contacts.length === 0 ? (
        <p className="text-text-muted">No submissions yet.</p>
      ) : (
        <div className="space-y-4">
          {contacts.map((c) => (
            <div key={c.id} className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{c.name}</p>
                  <p className="text-sm text-text-muted">{c.email}{c.company ? ` · ${c.company}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                  <select
                    value={c.status}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                    className="text-xs bg-bg-base rounded px-2 py-1 text-text-muted ring-1 ring-white/10"
                  >
                    <option value="new">new</option>
                    <option value="read">read</option>
                    <option value="replied">replied</option>
                  </select>
                </div>
              </div>
              {c.project_type && <p className="text-xs text-accent">{c.project_type}</p>}
              <p className="text-sm text-text-muted whitespace-pre-wrap">{c.message}</p>
              <p className="text-xs text-text-muted/50">{new Date(c.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
