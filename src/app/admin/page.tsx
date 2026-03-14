import { createServerSupabase } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch counts for dashboard overview
  const [pages, blog, cases, contacts, resources] = await Promise.all([
    supabase.from('pages').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.from('case_studies').select('id', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('resources').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Pages', count: pages.count ?? 0 },
    { label: 'Blog Posts', count: blog.count ?? 0 },
    { label: 'Case Studies', count: cases.count ?? 0 },
    { label: 'New Contacts', count: contacts.count ?? 0 },
    { label: 'Resources', count: resources.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">Welcome back, {user?.email}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-4"
          >
            <p className="text-3xl font-bold text-accent">{stat.count}</p>
            <p className="text-sm text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
