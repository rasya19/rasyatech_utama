import { useState, useEffect, FormEvent, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getProductClient } from '../lib/supabase-hub';
import { parseTenantHostname } from '../lib/tenant-host-parser';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const authClient = useMemo(() => {
    const parsed = parseTenantHostname(window.location.hostname);
    if (parsed?.pillar === 'siput') return getProductClient('siput');
    if (parsed?.pillar === 'lms') return getProductClient('lms');
    const pillar = localStorage.getItem('current_product_pillar');
    if (pillar === 'siput') return getProductClient('siput');
    if (pillar === 'lms') return getProductClient('lms');
    return supabase;
  }, []);

  useEffect(() => {
    // Check if we are authenticated for password reset
    const checkSession = async () => {
      const { data: { session } } = await authClient.auth.getSession();
      if (!session) {
        setError("Sesi tidak ditemukan atau kedaluwarsa. Silakan minta tautan reset password baru.");
      }
    };
    checkSession();
  }, []);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password baru harus minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await authClient.auth.updateUser({ 
        password: password 
      });
      
      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      // Wait for 3 seconds, sign out, then redirect
      setTimeout(async () => {
        await authClient.auth.signOut();
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700/50 p-10 rounded-[40px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
        
        <div className="relative text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">Reset Password</h2>
          <p className="text-slate-400 font-medium text-sm mt-3 leading-relaxed">Masukkan password baru untuk akun Admin Rasyatech Anda.</p>
        </div>

        {success ? (
          <div className="relative p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-3xl text-emerald-400 text-center text-sm font-semibold animate-fade-in shadow-lg">
            <svg className="w-10 h-10 mx-auto text-emerald-400 mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Password berhasil diperbarui!
            <p className="text-xs text-emerald-500/80 mt-1 font-normal">Mengalihkan Anda ke halaman login dalam beberapa detik...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6 relative">
            {error && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Password Baru</label>
              <input 
                type="password" 
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Konfirmasi Password Baru</label>
              <input 
                type="password" 
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                className="w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm shadow-inner"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 hover:shadow-indigo-500/10 uppercase tracking-wider text-xs"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </>
              ) : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
