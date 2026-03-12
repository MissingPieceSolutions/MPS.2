import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-accent animate-pulse">404</h1>
        <p className="text-xl text-text-muted">
          Looks like this page is a missing piece...
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
