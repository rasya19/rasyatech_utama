import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SchoolLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenant, setTenant] = useState(process.env.NEXT_PUBLIC_TENANT || 'scanbite_live');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Login ke Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // 2. Setelah login, update metadata user dengan tenant
      if (data.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { tenant: tenant }
        });
        if (updateError) {
          console.warn('Gagal update metadata tenant:', updateError);
          // tetap lanjutkan meskipun metadata gagal
        }
      }

      // 3. Simpan tenant di localStorage atau sessionStorage untuk digunakan di komponen lain
      localStorage.setItem('tenant', tenant);

      // 4. Redirect ke /admin
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Login gagal');
      setLoading(false);
    }
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
          {/* Pilihan Tenant */}
          <select
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="scanbite_live">Scanbite</option>
            <option value="lms_kesetaraan">LMS Kesetaraan</option>
            <option value="siput">SIPUT</option>
            <option value="resto">Resto</option>
            <option value="instafood">Instafood</option>
          </select>
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
