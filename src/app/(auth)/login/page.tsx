'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const justRegistered = searchParams.get('registered') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Sign in</h1>

        {justRegistered && (
          <div className="text-sm text-green-400 bg-green-400/10 rounded-lg px-4 py-3">
            Account created! Check your email to confirm, then sign in.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-text-muted">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <p className="text-center text-sm text-text-muted">
        <Link href="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
