'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-text-primary">Something went wrong</h1>
        <p className="text-text-muted">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="inline-flex items-center px-6 py-3 bg-accent text-white font-medium rounded-lg hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
