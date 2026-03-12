'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-text-muted">
          We sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
          Click it to activate your account, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-block mt-4 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-muted transition-all"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface/60 backdrop-blur-md rounded-xl ring-1 ring-white/10 p-8 space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Create account</h1>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm text-text-muted">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your name"
          />
        </div>

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
            minLength={8}
            className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Min. 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-muted transition-all focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
