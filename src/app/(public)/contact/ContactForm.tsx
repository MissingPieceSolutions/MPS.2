'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  options?: string[];
}

interface ContactFormProps {
  fields: FormField[];
  submitLabel: string;
  successMessage: string;
  errorMessage: string;
  privacyNote: string;
}

export function ContactForm({ fields, submitLabel, successMessage, errorMessage, privacyNote }: ContactFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({});
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <GlassCard className="text-center space-y-4">
        <div className="text-4xl">✓</div>
        <p className="text-text-primary font-medium">{successMessage}</p>
      </GlassCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GlassCard className="space-y-6">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label htmlFor={field.name} className="block text-sm text-text-muted">
              {field.label} {field.required && <span className="text-accent">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                required={field.required}
                placeholder={field.placeholder}
                rows={5}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">{field.placeholder}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                className="w-full px-4 py-3 bg-bg-base rounded-lg ring-1 ring-white/10 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
          </div>
        ))}

        {status === 'error' && (
          <div className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-3">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending...' : submitLabel}
        </button>
      </GlassCard>

      {privacyNote && (
        <p className="text-xs text-text-muted/60 text-center">
          Your information is handled according to our{' '}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </form>
  );
}
