import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/portfolio', label: 'Portfolio' },
  { href: '/admin/contacts', label: 'Contacts' },
  { href: '/admin/media', label: 'Media' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 bg-surface border-r border-white/10 p-4 space-y-1">
        <Link href="/" className="block text-xl font-bold text-accent mb-6 px-3">MPS</Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
