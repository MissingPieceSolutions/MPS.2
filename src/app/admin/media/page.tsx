'use client';

import { useEffect, useState, useRef } from 'react';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt_text: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/content?table=media')
      .then((r) => r.json())
      .then((res) => { setMedia(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const json = await res.json();

    if (json.data) {
      setMedia((prev) => [json.data, ...prev]);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  if (loading) return <p className="text-text-muted">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Media</h1>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="text-sm text-text-muted file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-sm file:cursor-pointer"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-accent text-white text-sm rounded-lg disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <p className="text-text-muted">No media files yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.map((item) => (
            <div key={item.id} className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 overflow-hidden">
              {item.mime_type?.startsWith('image/') ? (
                <img src={item.url} alt={item.alt_text || item.filename} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-surface-elevated text-text-muted text-xs">
                  {item.mime_type || 'file'}
                </div>
              )}
              <div className="p-3 space-y-1">
                <p className="text-xs text-text-primary truncate">{item.filename}</p>
                <p className="text-xs text-text-muted">{formatSize(item.size_bytes)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
