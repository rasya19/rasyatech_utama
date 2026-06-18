import React, { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseTenantHostname } from '../lib/tenant-host-parser';

type SchoolLoginProps = {
  portal?: 'lms' | 'siput' | 'default';
  tenantSubdomain?: string;
};

export default function SchoolLogin({ portal = 'default', tenantSubdomain }: SchoolLoginProps) {
  const resolvedPortal = useMemo(() => {
    if (portal !== 'default') return portal;
    const parsed = parseTenantHostname(window.location.hostname);
    if (parsed?.pillar === 'siput') return 'siput';
    if (parsed?.pillar === 'lms') return 'lms';
    return 'default';
  }, [portal]);

  const resolvedSubdomain = useMemo(() => {
    return (
      tenantSubdomain ||
      localStorage.getItem('current_tenant_subdomain') ||
      parseTenantHostname(window.location.hostname)?.routeTenantSlug ||
      ''
    );
  }, [tenantSubdomain]);

  const defaultTenant =
    resolvedPortal === 'siput' ? 'siput' : resolvedPortal === 'lms' ? 'lms_kesetaraan' : 'scanbite_live';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState(defaultTenant);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTenantPortal = resolvedPortal === 'siput' || resolvedPortal === 'lms';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { tenant, tenant_subdomain: resolvedSubdomain || undefined },
        });
        if (updateError) {
          console.warn('Gagal update metadata tenant:', updateError);
        }
      }

      localStorage.setItem('tenant', tenant);
      if (resolvedSubdomain) {
        localStorage.setItem('current_tenant_subdomain', resolvedSubdomain);
      }

      window.location.href = '/admin';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal';
      setError(msg);
      setLoading(false);
    }
  };

  const portalTitle =
    resolvedPortal === 'siput'
      ? 'Login Portal SIPUT'
      : resolvedPortal === 'lms'
        ? 'Login Portal LMS'
        : 'Login Sekolah';

  const portalSubtitle =
    resolvedPortal === 'siput'
      ? 'Sistem Informasi PAUD Terpadu'
      : resolvedPortal === 'lms'
        ? 'Learning Management System'
        : 'Masuk ke dashboard sekolah Anda';

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-2">
            {resolvedPortal === 'siput' ? 'SIPUT PAUD' : resolvedPortal === 'lms' ? 'ARMILLA LMS' : 'RASYATECH'}
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{portalTitle}</h2>
          <p className="text-sm text-slate-500 mt-1">{portalSubtitle}</p>
          {resolvedSubdomain && (
            <p className="text-xs text-slate-400 mt-2 font-mono">{resolvedSubdomain}</p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email admin sekolah"
            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />

          {!isTenantPortal && (
            <select
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl"
              required
            >
              <option value="scanbite_live">Scanbite</option>
              <option value="lms_kesetaraan">LMS Kesetaraan</option>
              <option value="siput">SIPUT</option>
              <option value="resto">Resto</option>
              <option value="instafood">Instafood</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}

        <div className="mt-4 text-center">
          <a href="/reset-password" className="text-sm text-teal-700 hover:underline">
            Lupa password?
          </a>
        </div>
      </div>
    </div>
  );
}
