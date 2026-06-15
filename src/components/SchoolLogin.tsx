import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SchoolLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useMagicLink, setUseMagicLink] = useState(false); // toggle magic link

  // Login dengan email + password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
      return;
    }

    // Setelah login sukses, ambil data tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenant_master')
      .select('subdomain, product_app')
      .eq('admin_email', email)
      .single();

    if (tenantError || !tenant) {
      setMessage('Akun tidak terdaftar sebagai admin sekolah.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Redirect ke dashboard tenant di subdomain yang sama
    window.location.href = `https://${tenant.subdomain}.${tenant.product_app}.rsch.my.id/admin`;
  };

  // Magic link (OTP) - tetap tersedia
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: tenant, error: tenantError } = await supabase
      .from('tenant_master')
      .select('subdomain, product_app')
      .eq('admin_email', email)
      .single();

    if (tenantError || !tenant) {
      setMessage('Email tidak terdaftar sebagai admin sekolah.');
      setLoading(false);
      return;
    }

    const redirectUrl = `https://${tenant.subdomain}.${tenant.product_app}.rsch.my.id/dashboard-sekolah`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Cek email Anda untuk link login!');
    }
    setLoading(false);
  };

  const handleSubmit = useMagicLink ? handleMagicLink : handlePasswordLogin;

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login Sekolah</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Sekolah"
            className="w-full p-2 border rounded"
            required
          />
          {!useMagicLink && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 border rounded"
              required
            />
          )}
          <button
            type="submit"
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Memproses...' : useMagicLink ? 'Kirim Magic Link' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setUseMagicLink(!useMagicLink)}
            className="text-sm text-blue-600 hover:underline"
          >
            {useMagicLink ? 'Gunakan Password' : 'Gunakan Magic Link (Email)'}
          </button>
        </div>
        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}

        {/* Tombol demo (tetap) */}
        <div className="mt-6 border-t border-gray-200 pt-6 space-y-3">
          <p className="text-[10px] text-gray-400 font-extrabold text-center uppercase tracking-wider">Mode Akses Uji Coba</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const mockSession = {
                  user: { email: 'dinas@kuningan.go.id', id: 'mock-dinas-id' },
                  schoolData: { school_name: 'Dinas Pendidikan Kab. Kuningan', role: 'DINAS', subdomain: 'dinas' }
                };
                sessionStorage.setItem('siput_mock_session', JSON.stringify(mockSession));
                window.location.reload();
              }}
              className="p-2.5 bg-slate-900 hover:bg-black text-emerald-400 font-bold text-xs rounded-lg transition-all text-center shadow-sm border border-slate-800"
            >
              Demo Dinas 🏛️
            </button>
            <button
              onClick={() => {
                const mockSession = {
                  user: { email: 'paud_melati@siput.id', id: 'mock-sekolah-id' },
                  schoolData: { id: 'demo-school-id', school_name: 'PAUD Melati Kuningan', subdomain: 'paudmelati', npsn: '20230412', address: 'Jl. Raya Cilimus No. 12, Kuningan' }
                };
                sessionStorage.setItem('siput_mock_session', JSON.stringify(mockSession));
                window.location.reload();
              }}
              className="p-2.5 bg-[#00BEC4] hover:bg-[#14B8A6] text-[#0B2447] font-bold text-xs rounded-lg transition-all text-center shadow-sm"
            >
              Demo Sekolah 💻
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
