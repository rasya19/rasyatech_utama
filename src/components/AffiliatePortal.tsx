import { useState, useEffect } from 'react';
import { 
  Users, 
  LogOut, 
  ArrowLeft, 
  Package, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function AffiliatePortal() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // if (!user) return;
    //
    // // Listen to Affiliate Profile
    // const unsubAffiliate = onSnapshot(
    //   query(collection(db, 'affiliates'), where('email', '==', user.email)),
    //   (snap) => {
    //     if (!snap.empty) {
    //       setAffiliateData({ id: snap.docs[0].id, ...snap.docs[0].data() });
    //       setError(null);
    //     } else {
    //       setAffiliateData(null);
    //       setError('Email Anda tidak terdaftar sebagai mitra affiliasi. Silakan hubungi admin Rasyatech.');
    //     }
    //   },
    //   (err) => handleFirestoreError(err, OperationType.GET, 'affiliates')
    // );
    //
    // // Listen to Registrations
    // const unsubRegs = onSnapshot(
    //   query(
    //     collection(db, 'registrations'),
    //     where('affiliateEmail', '==', user.email),
    //     orderBy('createdAt', 'desc')
    //   ),
    //   (snap) => {
    //     setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    //   },
    //   (err) => {
    //     console.error(err);
    //     // Silently handle if index is missing first
    //   }
    // );
    //
    // return () => {
    //   unsubAffiliate();
    //   unsubRegs();
    // };
  }, [user]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError('Gagal login: ' + err.message);
    }
  };

  const totalCommission = registrations.reduce((sum, reg) => sum + (reg.commission || 0), 0);
  const verifiedCount = registrations.filter(r => r.status === 'verified').length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <Link to="/" className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold bg-white px-6 py-3 rounded-2xl shadow-sm transition-all border border-slate-100">
        <ArrowLeft className="w-5 h-5" /> Kembali
      </Link>
      <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl text-center border border-slate-100">
        <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
          <Users className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black mb-4">Portal Mitra Affiliasi</h1>
        <p className="text-slate-500 mb-10 font-medium">Masuk untuk memantau pendaftaran sekolah dan komisi Anda secara real-time.</p>
        <button 
          onClick={handleLogin}
          className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95"
        >
          Masuk dengan Google
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-xl text-center border border-red-100">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-4">Akses Terbatas</h2>
        <p className="text-slate-500 mb-8 font-medium">{error}</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => supabase.auth.signOut()} className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl transition-all">Ganti Akun</button>
          <Link to="/" className="w-full py-4 text-indigo-600 font-black">Kembali ke Beranda</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-6 px-4 md:px-10 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all border border-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-none">Affiliate Dashboard</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">RasyaTech Partner Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-sm font-black text-slate-900">{user.displayName}</div>
            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{affiliateData?.referralCode}</div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-10 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-2xl shadow-indigo-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
              <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Estimasi Komisi</div>
            </div>
            <div className="text-4xl font-black mb-1">Rp {totalCommission.toLocaleString()}</div>
            <div className="text-white/60 text-sm font-bold">Total saldo yang akan dicairkan</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 className="w-6 h-6" /></div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Sekolah Terverifikasi</div>
            </div>
            <div className="text-4xl font-black mb-1 text-slate-900">{verifiedCount}</div>
            <div className="text-slate-400 text-sm font-bold">Dari total {registrations.length} pendaftaran</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><BarChart3 className="w-32 h-32" /></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Package className="w-6 h-6" /></div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Kode Referral</div>
            </div>
            <div className="text-4xl font-black mb-2 text-slate-900 tracking-tighter">{affiliateData?.referralCode}</div>
            <button className="text-indigo-600 font-black text-xs flex items-center gap-2 hover:gap-3 transition-all" onClick={() => {
              navigator.clipboard.writeText(affiliateData?.referralCode);
              alert('Kode Referral disalin!');
            }}>
              Salin Kode & Bagikan <ExternalLink className="w-3 h-3" />
            </button>
          </motion.div>
        </div>

        {/* Registrations List */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900">Pendaftaran Melalui Anda</h3>
            <div className="flex gap-2">
              <span className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-black rounded-xl">Real-time Sync</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Sekolah / Instansi</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Paket</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status / Habis Kontrak</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Komisi Anda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {registrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900">{reg.schoolName}</div>
                      <div className="text-xs font-bold text-slate-400">{reg.createdAt?.toDate ? reg.createdAt.toDate().toLocaleDateString() : 'Baru'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-600">{reg.package}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                          reg.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {reg.status}
                        </span>
                        {reg.contractEnd && (
                          <span className={`text-[10px] font-black ${new Date(reg.contractEnd) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                            {new Date(reg.contractEnd) < new Date() ? 'EXPIRED' : 'Exp: ' + reg.contractEnd}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-indigo-600">
                      Rp {(reg.commission || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {registrations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                      Belum ada sekolah yang terdaftar melalui referral Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-xs font-medium">
          Dikelola secara transparan oleh sistem otomasi RasyaTech. <br />
          Pencairan komisi dilakukan setiap tanggal 1 - 5 setiap bulannya.
        </p>
      </div>
    </div>
  );
}
