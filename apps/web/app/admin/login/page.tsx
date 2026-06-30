'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { BrandLogo } from '@/components/brand/logo';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/admin';
  if (raw.includes('://') || raw.includes('\\')) return '/admin';
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError('Accès refusé');
      return;
    }
    router.push(next);
    router.refresh();
  }

  const v = ADMIN_VERDICTS.login;

  return (
    <div className="min-h-screen bg-surface-sunken">
      <CockpitVerdict label={v.label} headline={v.headline} subline={v.subline} />
      <div className="flex justify-center px-5 pb-12 pt-4">
        <div className="card w-full max-w-md p-8">
          <BrandLogo className="mb-6" />
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="password"
              className="input-field"
              placeholder="Mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-heat-text">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
