import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SchoolLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Login dengan password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Ambil data tenant untuk mendapatkan subdomain
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant_master')
      .select('subdomain')
      .eq('admin_email', email)
      .single();

    if (tenantError || !tenant) {
      setError('Akun tidak terdaftar sebagai admin sekolah.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Redirect ke halaman admin dengan parameter tenant
    window.location.href = `https://siput.rsch.my.id/admin?tenant=${tenant.subdomain}`;
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login Sekolah</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Sekolah"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Login...' : 'Login'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
        <div className="mt-4 text-center">
          <a href="/reset-password" className="text-sm text-blue-600 hover:underline">Lupa password?</a>
        </div>
      </div>
    </div>
  );
}
