import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../lib/supabase' // pastiin path ini bener

export default function MasterAdmin() {
  // ... state dan logic kamu yang lain
// HAPUS INI SEMUA
const [email, setEmail] = useState('')  // udah ada
const [password, setPassword] = useState('') // udah ada

...
} from 'lucide-react'; // ini import, salah tempat
import { Link } from 'react-router-dom'; // ini juga salah tempat

const handleResetPassword = async () => {
  if (!email) {
    alert('Isi email dulu di kolom login')
    return
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://rasyatech.rsch.my.id/reset-password',
  })
  
  if (error) {
    alert('Gagal kirim: ' + error.message)
  } else {
    alert('Link reset password udah dikirim ke email. Cek inbox/spam ya.')
  }
}

  // ... di bagian return JSX form login
  return (
    <div>
      {/* ... form kamu yang udah ada */}
      
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input type="password" placeholder="Password" />
      
      <button className="Login">Login</button>
      
      {/* TAMBAHIN INI DI BAWAH TOMBOL LOGIN */}
      <button 
        type="button"
        onClick={handleResetPassword}
        style={{
          background: 'none',
          border: 'none',
          color: '#6366f1',
          marginTop: '12px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Lupa Password?
      </button>

      {/* ... Magic Link & Login with Google kamu */}
    </div>
  )
}  Save, 
  Plus, 
  Trash2,
  Edit2, 
  LogOut, 
  Laptop as LaptopIcon, 
  Monitor, 
  Settings, 
  Package,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Users,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'services' | 'laptops' | 'payments' | 'products' | 'registrations' | 'affiliates'>('config');
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Data States
  const [config, setConfig] = useState<any>({ whatsapp: '', address: '', openingHours: '', heroTitle: '', heroSubtitle: '' });
  const [payments, setPayments] = useState<any>({
    bankBcaProvider: 'BCA',
    bankBca: '1234567890',
    bankMandiriProvider: 'Mandiri',
    bankMandiri: '0987654321',
    eWallet: '081918226387',
    bankBcaName: 'PT Rasyatech Digital',
    bankMandiriName: 'PT Rasyatech Digital',
    eWalletName: 'Admin Rasyatech'
  });
  const [services, setServices] = useState<any[]>([]);
  const [laptops, setLaptops] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  // Edit States
  const [editingService, setEditingService] = useState<any>(null);
  const [editingLaptop, setEditingLaptop] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingAffiliate, setEditingAffiliate] = useState<any>(null);
  const [editingRegistration, setEditingRegistration] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // // Listen to Config
    // const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
    //   if (snap.exists()) {
    //     setConfig((prev: any) => ({ ...prev, ...snap.data() }));
    //   }
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/config'));

    // // Listen to Payments
    // const unsubPayments = onSnapshot(doc(db, 'settings', 'payments'), (snap) => {
    //   if (snap.exists()) {
    //     setPayments((prev: any) => ({ ...prev, ...snap.data() }));
    //   }
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/payments'));

    // // Listen to Services
    // const unsubServices = onSnapshot(query(collection(db, 'services'), orderBy('title')), (snap) => {
    //   setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    // }, (err) => handleFirestoreError(err, OperationType.LIST, 'services'));

    // // Listen to Laptops
    // const unsubLaptops = onSnapshot(query(collection(db, 'laptops'), orderBy('name')), (snap) => {
    //   setLaptops(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    // }, (err) => handleFirestoreError(err, OperationType.LIST, 'laptops'));

    // // Listen to Ads
    // const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
    //   setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    // }, (err) => handleFirestoreError(err, OperationType.LIST, 'ads'));

    // // Listen to Products
    // const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snap) => {
    //   setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    // }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    // Listen to Registrations
    fetchRegistrations();

    // // Listen to Affiliates
    // const unsubAffiliates = onSnapshot(query(collection(db, 'affiliates'), orderBy('name')), (snap) => {
    //   setAffiliates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    // }, (err) => handleFirestoreError(err, OperationType.LIST, 'affiliates'));

    // // Listen to Visitor Count
    // const unsubStats = onSnapshot(doc(db, 'stats', 'visitors'), (snap) => {
    //   if (snap.exists()) {
    //     setVisitorCount(snap.data().count || 0);
    //   }
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'stats/visitors'));

    return () => {
      // unsubConfig();
      // unsubPayments();
      // unsubServices();
      // unsubLaptops();
      // unsubAds();
      // unsubProducts();
      // unsubAffiliates();
      // unsubStats();
    };
  }, [user]);

  const fetchRegistrations = async () => {
    const { data: regs, error } = await supabase.from('registrations').select('*');
    if (error) {
        console.error("Error fetching registrations:", error);
    } else {
        setRegistrations(regs || []);
    }
  };

  const fetchAffiliates = async () => {
    const { data: affs, error } = await supabase.from('affiliates').select('*').order('name', { ascending: true });
    if (error) {
        console.error("Error fetching affiliates:", error);
    } else {
        setAffiliates(affs || []);
    }
  };

  const handleLogin = async () => {
    setSaveStatus(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://rasyatech.rsch.my.id/admin'
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      setSaveStatus({ type: 'error', message: 'Gagal login: ' + (error.message || 'Error tidak diketahui') });
    }
  };

  const handleManualLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      setSaveStatus({ type: 'error', message: 'Gagal login: ' + (error.message || 'Error tidak diketahui') });
    }
  };
const handleResetPassword = async () => {
  if (!email) {
    setSaveStatus({ type: 'error', message: 'Silakan masukkan email Anda terlebih dahulu di kolom atas' })
    return;
  }
  
  setResetLoading(true);
  setSaveStatus(null);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://rasyatech.rsch.my.id/reset-password',
  })
  
  setResetLoading(false);
  
  if (error) {
    setSaveStatus({ type: 'error', message: 'Gagal kirim: ' + error.message })
  } else {
    setSaveStatus({ type: 'success', message: 'Link reset password udah dikirim ke email. Cek inbox/spam.' })
  }
}

const handleSendMagicLink = async () => {
  // ... code magic link kamu yang udah ada
  const [resetLoading, setResetLoading] = useState(false);
  const handleSendMagicLink = async () => {
    if (!email) {
      setSaveStatus({ type: 'error', message: 'Silakan masukkan email Anda (ismanto095@gmail.com) terlebih dahulu di kotak input email.' });
      return;
    }
    setResetLoading(true);
    setSaveStatus(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/admin',
        },
      });
      if (error) throw error;
      setSaveStatus({ type: 'success', message: 'Magic Link dikirim! Silakan cek email Anda (ismanto095@gmail.com).' });
    } catch (error: any) {
      console.error(error);
      setSaveStatus({ type: 'error', message: 'Gagal mengirim link: ' + (error.message || 'Error tidak diketahui') });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setSaveStatus(null);
    try {
      const { error } = await supabase.from('settings').upsert({ id: 'config', ...config });
      if (error) throw error;
      setSaveStatus({ type: 'success', message: 'Konfigurasi website berhasil disimpan!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Gagal menyimpan konfigurasi.' });
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSavePayments = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPayments(true);
    setSaveStatus(null);
    try {
      const { error } = await supabase.from('settings').upsert({ id: 'payments', ...payments });
      if (error) throw error;
      setSaveStatus({ type: 'success', message: 'Konfigurasi pembayaran berhasil disimpan!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Gagal menyimpan konfigurasi pembayaran.' });
      console.error(err);
    } finally {
      setSavingPayments(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    const data = editingService;
    try {
      const { error } = await supabase.from('services').upsert(data);
      if (error) throw error;
      setEditingService(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLaptop = async (id: string) => {
    if (!confirm('Yakin ingin menghapus laptop ini?')) return;
    try {
      const { error } = await supabase.from('laptops').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLaptop = async (e: FormEvent) => {
    e.preventDefault();
    const data = editingLaptop;
    try {
      const { error } = await supabase.from('laptops').upsert(data);
      if (error) throw error;
      setEditingLaptop(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus barang ini?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const data = editingProduct;
    try {
      const { error } = await supabase.from('products').upsert(data);
      if (error) throw error;
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAffiliate = async (id: string) => {
    if (!confirm('Hapus mitra affiliasi ini?')) return;
    try {
      const { error } = await supabase.from('affiliates').delete().eq('id', id);
      if (error) throw error;
      fetchAffiliates(); // Assumed function exists or is needed
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAffiliate = async (e: FormEvent) => {
    e.preventDefault();
    const data = editingAffiliate;
    try {
      const { error } = await supabase.from('affiliates').upsert(data);
      if (error) throw error;
      setEditingAffiliate(null);
      fetchAffiliates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!window.confirm("Apakah Mas Ismanto yakin ingin menghapus permanen pendaftar ini?")) return;
    try {
      const response = await fetch(`/api/delete-registration?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Gagal menghapus pendaftar');
      }
      
      const data = await response.json();
      setSaveStatus({ type: 'success', message: data.message });
      fetchRegistrations();
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: 'error', message: 'Gagal menghapus pendaftar.' });
    }
  };

  const handleVerifySchool = async (reg: any) => {
    if (!reg) return;
    
    // Auto-subdomain: lowercase dan hapus semua karakter non-alfanumerik
    const autoSubdomain = reg.school_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!autoSubdomain) {
      setSaveStatus({ type: 'error', message: 'Nama sekolah tidak valid untuk dibuatkan subdomain otomatis!' });
      return;
    }

    setSaveStatus({ type: 'success', message: 'Sedang memproses verifikasi otomatis...' });
    
    try {
      // 1. Validasi: Keunikan (Cek apakah subdomain sudah dipakai sekolah lain)
      const { data: existing, error: checkError } = await supabase
        .from('registrations')
        .select('id, school_name')
        .eq('subdomain', autoSubdomain)
        .eq('status', 'verified')
        .neq('id', reg.id) // Kecuali dirinya sendiri
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existing) {
        setSaveStatus({ 
          type: 'error', 
          message: `Subdomain "${autoSubdomain}" sudah digunakan oleh ${existing.school_name}.` 
        });
        return;
      }

      const response = await fetch('/api/verify-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg.id,
          email: reg.admin_email,
          school_name: reg.school_name,
          subdomain: autoSubdomain, 
          whatsapp: reg.whatsapp
        }),
      });

      if (!response.ok) {
         const errorBody = await response.text();
         throw new Error(`Server returned ${response.status}: ${errorBody}`);
      }

      setSaveStatus({ type: 'success', message: 'Sekolah berhasil diverifikasi otomatis!' });
      fetchRegistrations(); // Refresh list agar status terupdate di UI
    } catch(err: any) {
        console.error("Error in handleVerifySchool:", err);
        setSaveStatus({ type: 'error', message: 'Gagal verifikasi: ' + err.message });
    }
  };

  const handleUnverifySchool = async (reg: any) => {
    if (!reg) return;
    if (!window.confirm(`Apakah Mas Ismanto yakin ingin membatalkan verifikasi untuk ${reg.school_name}?`)) return;
    
    setSaveStatus({ type: 'success', message: 'Membatalkan verifikasi...' });
    
    try {
        const response = await fetch('/api/unverify-school', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                registrationId: reg.id,
                subdomain: reg.subdomain
            })
        });

        if (!response.ok) {
           const errorBody = await response.text();
           throw new Error(`Server returned ${response.status}: ${errorBody}`);
        }

        setSaveStatus({ type: 'success', message: 'Verifikasi berhasil dibatalkan!' });
        fetchRegistrations();
    } catch(err: any) {
        console.error("Error in handleUnverifySchool:", err);
        setSaveStatus({ type: 'error', message: 'Gagal batalkan verifikasi: ' + err.message });
    }
  };

  const handleUpdateRegStatus = async (id: string, status: string) => {
    try {
      console.log(`Updating ${id} to ${status}...`);
      const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
      if (error) throw error;
      console.log("Update successful");
      setSaveStatus({ type: 'success', message: 'Status berhasil diperbarui!' });
      setTimeout(() => setSaveStatus(null), 3000);
      fetchRegistrations();
    } catch (err: any) {
      console.error("Error updating status:", err);
      setSaveStatus({ type: 'error', message: 'Gagal update status: ' + (err.message || 'Error tidak diketahui') });
    }
  };

  const handleSaveRegistration = async (e: FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      npsn: editingRegistration.npsn,
      school_name: editingRegistration.school_name,
      admin_name: editingRegistration.admin_name,
      admin_email: editingRegistration.admin_email,
      whatsapp: editingRegistration.whatsapp || editingRegistration.WA || '',
      WA: editingRegistration.WA || '',
      status: editingRegistration.status || (editingRegistration.is_approved ? 'verified' : 'pending'),
      subdomain: editingRegistration.subdomain || '',
      is_approved: !!editingRegistration.is_approved
    };
    
    try {
        if (editingRegistration.id) {
            const { error } = await supabase.from('registrations').update(payload).eq('id', editingRegistration.id);
            if (error) throw error;
        } else {
             const { error } = await supabase.from('registrations').insert([payload]);
             if (error) throw error;
        }
        setEditingRegistration(null);
        fetchRegistrations();
        setSaveStatus({ type: 'success', message: 'Data pendaftar berhasil disimpan!' });
        setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.error("Error saving registration:", err);
      setSaveStatus({ type: 'error', message: 'Gagal menyimpan pendaftar: ' + (err.message || 'Error tidak diketahui') });
    }
  };

  const handleSeedDemoData = async () => {
    if (!confirm('Yakin ingin melakukan seeding data demo? Ini akan membuat/memperbarui 3 akun demo (Silver, Gold, Platinum).')) return;
    try {
      const demoAccounts = [
        { email: 'silver@demo.com', plan: 'silver', name: 'User Silver', data: { tasks: [{ title: 'Belajar Dasar', status: 'done' }] } },
        { email: 'gold@demo.com', plan: 'gold', name: 'User Gold', data: { finance: { balance: 1000 }, reports: [{ date: '2026-05-12' }] } },
        { email: 'platinum@demo.com', plan: 'platinum', name: 'User Platinum', data: { stats: { views: 999 }, qr: 'https://qr.example.com', theme: 'black-gold' } }
      ];
      
      const { error } = await supabase.from('users').upsert(demoAccounts);
      if (error) throw error;

      setSaveStatus({ type: 'success', message: 'Data demo 3 akun berhasil dibuat!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Gagal seeding data.' });
      console.error(err);
    }
  };

  const isAuthorizedSuperAdmin = user?.email?.toLowerCase() === 'ismanto095@gmail.com';
  const hostnamePrefix = window.location.hostname.split('.')[0];
  const isMainDomain = hostnamePrefix === 'rasyatech' || hostnamePrefix === 'www' || window.location.hostname.split('.').length < 3 || window.location.hostname.includes('asia-southeast1.run.app') || window.location.hostname.includes('localhost');

  useEffect(() => {
    if (!loading && user && (!isAuthorizedSuperAdmin || !isMainDomain)) {
       // Redirect unauthorized users or main admin access from subdomains
       window.location.href = '/';
    }
  }, [user, loading, isAuthorizedSuperAdmin, isMainDomain]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-all bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Beranda
      </Link>
      <div className="max-w-md w-full bg-white p-12 rounded-[32px] shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-indigo-600">
          <Settings className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black mb-4">Admin RasyaComp</h1>
        {saveStatus && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
            saveStatus.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-left">{saveStatus.message}</span>
          </div>
        )}
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Silakan login menggunakan akun Google Anda untuk mengelola konten website.
        </p>
        <form onSubmit={handleManualLogin} className="space-y-4 mb-8">
  <div>
    <input 
      type="email" 
      placeholder="Email" 
      value={email} 
      onChange={e => setEmail(e.target.value)}
      required
      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
    />
  </div>
  <div>
    <input 
      type="password" 
      placeholder="Password" 
      value={password} 
      onChange={e => setPassword(e.target.value)}
      required
      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
    />
  </div>
  <button 
    type="submit"
    className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all mb-2"
  >
    Login
  </button>

  {/* TAMBAHIN INI DI SINI */}
  <button 
    type="button"
    onClick={handleResetPassword}
    disabled={resetLoading}
    className="w-full text-indigo-600 font-bold text-sm hover:underline disabled:opacity-50"
  >
    Lupa Password?
  </button>

  <button 
    type="button"
    onClick={handleSendMagicLink}
    disabled={resetLoading}
    className="w-full text-indigo-600 font-bold text-sm hover:underline disabled:opacity-50"
  >
    {resetLoading ? 'Mengirim...' : 'Gunakan Magic Link (Login tanpa password)'}
  </button>
</form>
        <div className="text-center font-bold text-slate-400 mb-4">ATAU</div>
        <button 
          onClick={handleLogin}
          className="w-full py-5 bg-white text-slate-600 font-black rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
        >
          Login with Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {!isAuthorizedSuperAdmin && user && (
        <div className="bg-red-500 text-white px-10 py-3 text-center text-sm font-black uppercase tracking-widest sticky top-0 z-[100] shadow-xl">
          ⚠️ Akun ini ({user.email}) tidak memiliki akses simpan. Hubungi Developer.
        </div>
      )}
      <nav className="bg-white border-b border-slate-100 py-6 px-10 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">RC</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <div className="text-sm font-bold text-slate-900">{user.displayName}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">{user.email}</div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:text-red-500 transition-colors border border-slate-100"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-10 pt-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Total Pengunjung</div>
             <div className="text-4xl font-black text-indigo-600 font-mono tracking-tighter">{visitorCount.toLocaleString()}</div>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Total Pendaftar</div>
             <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{registrations.length}</div>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Mitra Affiliasi</div>
             <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{affiliates.length}</div>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Inventory Unit</div>
             <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{laptops.length + products.length}</div>
           </div>
        </div>

        {/* Tabs */}
        <AnimatePresence>
          {saveStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold ${
                saveStatus.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {saveStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {saveStatus.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-4 mb-12">
          {[
            { id: 'config', label: 'Konfigurasi', icon: <Settings className="w-5 h-5" /> },
            { id: 'payments', label: 'Pembayaran', icon: <CheckCircle2 className="w-5 h-5" /> },
            { id: 'services', label: 'Layanan', icon: <Monitor className="w-5 h-5" /> },
            { id: 'laptops', label: 'Inventory Laptop', icon: <Package className="w-5 h-5" /> },
            { id: 'products', label: 'Katalog Barang', icon: <Package className="w-5 h-5" /> },
            { id: 'registrations', label: 'Pendaftar', icon: <Users className="w-5 h-5" /> },
            { id: 'affiliates', label: 'Affiliasi', icon: <Users className="w-5 h-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* Config Section */}
          {activeTab === 'config' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100">
              <h2 className="text-3xl font-black mb-10">Konfigurasi Website</h2>
              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp Number</label>
                  <input 
                    type="text" 
                    value={config.whatsapp} 
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                    placeholder="Contoh: 628123456789"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Hero Title</label>
                  <input 
                    type="text" 
                    value={config.heroTitle} 
                    onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Hero Subtitle</label>
                  <textarea 
                    value={config.heroSubtitle} 
                    onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold h-24"
                    placeholder="Deskripsi singkat di bawah judul utama"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Alamat Lengkap</label>
                  <textarea 
                    value={config.address} 
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold h-32"
                  />
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="submit" 
                    disabled={savingConfig}
                    className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all"
                  >
                    {savingConfig ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {savingConfig ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSeedDemoData}
                    className="mt-6 px-10 py-5 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-100 flex items-center gap-3 hover:bg-purple-700 transition-all"
                  >
                    🚀 Automated Demo Seeding
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Payments Section */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100">
              <h2 className="text-3xl font-black mb-10">Konfigurasi Pembayaran</h2>
              <p className="text-slate-500 mb-8">Informasi ini akan tampil pada instruksi pembayaran setelah pendaftaran sekolah baru.</p>
              <form onSubmit={handleSavePayments} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bank 1 */}
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Transfer Bank 1</h3>
                    <select 
                      value={payments.bankBcaProvider}
                      onChange={(e) => setPayments({ ...payments, bankBcaProvider: e.target.value })}
                      className="text-xs font-black bg-white border border-slate-200 rounded-lg px-2 py-1"
                    >
                      {['BCA', 'Mandiri', 'BNI', 'BRI', 'BTN', 'BSI', 'CIMB Niaga', 'Lainnya'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor Rekening</label>
                    <input 
                      type="text" 
                      value={payments.bankBca} 
                      onChange={(e) => setPayments({ ...payments, bankBca: e.target.value })}
                      className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atas Nama</label>
                    <input 
                      type="text" 
                      value={payments.bankBcaName} 
                      onChange={(e) => setPayments({ ...payments, bankBcaName: e.target.value })}
                      className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>
                </div>

                {/* Bank 2 */}
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Transfer Bank 2</h3>
                    <select 
                      value={payments.bankMandiriProvider}
                      onChange={(e) => setPayments({ ...payments, bankMandiriProvider: e.target.value })}
                      className="text-xs font-black bg-white border border-slate-200 rounded-lg px-2 py-1"
                    >
                      {['Mandiri', 'BCA', 'BNI', 'BRI', 'BTN', 'BSI', 'CIMB Niaga', 'Lainnya'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor Rekening</label>
                    <input 
                      type="text" 
                      value={payments.bankMandiri} 
                      onChange={(e) => setPayments({ ...payments, bankMandiri: e.target.value })}
                      className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atas Nama</label>
                    <input 
                      type="text" 
                      value={payments.bankMandiriName} 
                      onChange={(e) => setPayments({ ...payments, bankMandiriName: e.target.value })}
                      className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>
                </div>

                {/* E-Wallet */}
                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl md:col-span-2">
                  <h3 className="font-bold text-slate-800">DANA / OVO / GoPay (E-Wallet)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor HP</label>
                      <input 
                        type="text" 
                        value={payments.eWallet} 
                        onChange={(e) => setPayments({ ...payments, eWallet: e.target.value })}
                        className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atas Nama</label>
                      <input 
                        type="text" 
                        value={payments.eWalletName} 
                        onChange={(e) => setPayments({ ...payments, eWalletName: e.target.value })}
                        className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-indigo-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button 
                    type="submit" 
                    disabled={savingPayments}
                    className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all"
                  >
                    {savingPayments ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {savingPayments ? 'Menyimpan...' : 'Simpan Konfigurasi Pembayaran'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Services Section */}
          {activeTab === 'services' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100">
                <h2 className="text-3xl font-black">Kelola Layanan</h2>
                <button 
                  onClick={() => setEditingService({ title: '', description: '', icon: 'Monitor' })}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Tambah Layanan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[32px] border border-slate-100 hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingService(s)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteService(s.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <h4 className="text-xl font-black mb-3">{s.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Laptops Section */}
          {activeTab === 'laptops' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100">
                <h2 className="text-3xl font-black">Inventory Laptop</h2>
                <button 
                  onClick={() => setEditingLaptop({ name: '', price: '', image: '', isAvailable: true })}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Tambah Laptop
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {laptops.map(l => (
                  <div key={l.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden group">
                    <div className="h-48 overflow-hidden relative">
                      <img src={l.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => setEditingLaptop(l)} className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-900 shadow-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteLaptop(l.id)} className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-8">
                      <h4 className="font-black text-lg mb-1">{l.name}</h4>
                      <p className="text-indigo-600 font-black mb-4 italic">{l.price}</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${l.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {l.isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {l.isAvailable ? 'Available' : 'Sold Out'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Products Section */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100">
                <h2 className="text-3xl font-black">Katalog Barang (Aksesoris/Sparepart)</h2>
                <button 
                  onClick={() => setEditingProduct({ name: '', price: '', image: '', category: 'Aksesoris', isAvailable: true })}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Tambah Barang
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden group">
                    <div className="h-40 overflow-hidden relative">
                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => setEditingProduct(p)} className="p-2 bg-white/90 backdrop-blur rounded-xl text-slate-900 shadow-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-1">{p.category}</div>
                      <h4 className="font-black text-lg mb-2">{p.name}</h4>
                      <p className="text-slate-900 font-black">{p.price}</p>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold">Belum ada barang di katalog.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Registrations Section */}
          {activeTab === 'registrations' && (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
    <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100">
      <div>
        <h2 className="text-3xl font-black">Manajemen Pendaftar</h2>
        <p className="text-slate-500 font-medium">Kelola pendaftaran sekolah baru dari landing page.</p>
      </div>
      <div className="flex gap-3">
        {/* Tombol Refresh - TAMBAHAN BARU */}
        <button 
          onClick={fetchRegistrations}
          className="px-6 py-3 bg-slate-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg hover:bg-slate-700 transition-all"
        >
          <Loader2 className="w-5 h-5" /> Refresh
        </button>
        <button 
          onClick={() => setEditingRegistration({ school_name: '', npsn: '', admin_name: '', admin_email: '', WA: '', status: 'pending', subdomain: '', is_approved: false })}
          className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-5 h-5" /> Tambah Pendaftar
        </button>
      </div>
    </div>

    {/* LOADING STATE - TAMBAHAN BARU */}
    {loadingRegistrations && (
      <div className="bg-white rounded-[40px] border border-slate-100 p-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Memuat data pendaftar...</p>
      </div>
    )}

    {/* ERROR STATE - TAMBAHAN BARU */}
    {registrationsError && !loadingRegistrations && (
      <div className="bg-red-50 border border-red-200 rounded-[32px] p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-bold mb-2">Gagal memuat data</p>
        <p className="text-red-500 text-sm mb-4">{registrationsError}</p>
        <button 
          onClick={fetchRegistrations}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    )}

    {/* DATA LIST - hanya tampil jika tidak loading dan tidak error */}
    {!loadingRegistrations && !registrationsError && (
      <div className="grid grid-cols-1 gap-6">
        {registrations.map(reg => (
          <div key={reg.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                     URL: {reg.subdomain || '-'}.rsch.my.id
                  </span>
                </div>
                <p className="text-slate-500 font-medium">Admin: <span className="text-slate-900 font-bold">{reg.admin_name}</span> ({reg.admin_email})</p>
                <p className="text-slate-400 text-xs font-bold mt-1">WA: {reg.WA || '-'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {reg.status === 'verified' ? (
                  <>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 border border-emerald-100">
                       <CheckCircle2 className="w-4 h-4" />
                       <span className="text-xs font-black uppercase tracking-tight">TERVERIFIKASI</span>
                    </div>
                    <button
                      onClick={() => {
                        window.open(`https://${reg.subdomain}.rsch.my.id`, '_blank');
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-xl text-xs font-black transition-all hover:bg-indigo-700"
                    >
                      Manage Access
                    </button>
                    <button 
                      onClick={() => handleUnverifySchool(reg)}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors group"
                      title="Batalkan Verifikasi"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleVerifySchool(reg)}
                    className="px-6 py-2.5 bg-indigo-600 text-white shadow-lg shadow-indigo-100 rounded-xl text-sm font-black transition-all hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify Now
                  </button>
                )}
                <button onClick={() => handleDeleteRegistration(reg.id)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors ml-auto">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Kontak Admin</label>
                <p className="font-bold text-slate-900">{reg.admin_name || '-'}</p>
                <p className="text-xs text-slate-500">{reg.admin_email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Sekolah / NPSN</label>
                <p className="font-bold text-slate-900">{reg.school_name}</p>
                <p className="text-xs text-slate-500">NPSN: {reg.npsn || '-'}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status</label>
                <p className="font-bold text-indigo-600 uppercase tracking-tighter">{reg.status}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
               <button onClick={() => setEditingRegistration(reg)} className="text-indigo-600 font-black text-xs px-4 py-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">Edit Data Pendaftar</button>
            </div>
          </div>
        ))}
        
        {registrations.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <p className="text-slate-400 font-bold">Belum ada pendaftaran baru.</p>
          </div>
        )}
      </div>
    )}
  </motion.div>
)}
          {/* Affiliates Section */}
          {activeTab === 'affiliates' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100">
                <h2 className="text-3xl font-black">Manajemen Affiliasi</h2>
                <button 
                  onClick={() => setEditingAffiliate({ name: '', email: '', referralCode: '' })}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg"
                >
                  <Plus className="w-5 h-5" /> Tambah Mitra
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {affiliates.map(af => (
                  <div key={af.id} className="bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col items-center text-center group shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
                      <Users className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-xl mb-2">{af.name}</h4>
                    <p className="text-slate-500 text-sm font-bold mb-6">{af.email}</p>
                    <div className="flex gap-2 w-full pt-4 border-t border-slate-50">
                      <button onClick={() => setEditingAffiliate(af)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" /> Edit</button>
                      <button onClick={() => handleDeleteAffiliate(af.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {affiliates.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold">Belum ada mitra affiliasi.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingService(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-12 rounded-[40px] shadow-2xl">
              <h3 className="text-3xl font-black mb-8">{editingService.id ? 'Edit' : 'Tambah'} Layanan</h3>
              <form onSubmit={handleSaveService} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Judul Layanan</label>
                  <input type="text" required value={editingService.title} onChange={e => setEditingService({ ...editingService, title: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Deskripsi</label>
                  <textarea required value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold h-32" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Simpan</button>
                  <button type="button" onClick={() => setEditingService(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingLaptop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingLaptop(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-12 rounded-[40px] shadow-2xl">
              <h3 className="text-3xl font-black mb-8">{editingLaptop.id ? 'Edit' : 'Tambah'} Laptop</h3>
              <form onSubmit={handleSaveLaptop} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Unit</label>
                    <input type="text" required value={editingLaptop.name} onChange={e => setEditingLaptop({ ...editingLaptop, name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Harga</label>
                    <input type="text" required value={editingLaptop.price} onChange={e => setEditingLaptop({ ...editingLaptop, price: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                  </div>
                  <div className="flex items-end pb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={editingLaptop.isAvailable} onChange={e => setEditingLaptop({ ...editingLaptop, isAvailable: e.target.checked })} className="w-6 h-6 rounded border-slate-200 text-indigo-600 focus:ring-indigo-600" />
                      <span className="text-sm font-black uppercase tracking-widest text-slate-400">Available</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Image URL</label>
                  <input type="text" required value={editingLaptop.image} onChange={e => setEditingLaptop({ ...editingLaptop, image: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Simpan</button>
                  <button type="button" onClick={() => setEditingLaptop(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProduct(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-12 rounded-[40px] shadow-2xl">
              <h3 className="text-3xl font-black mb-8">{editingProduct.id ? 'Edit' : 'Tambah'} Barang</h3>
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Barang</label>
                  <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Harga</label>
                    <input type="text" required value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Kategori</label>
                    <select value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold">
                      <option value="Aksesoris">Aksesoris</option>
                      <option value="Suku Cadang">Suku Cadang</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Image URL</label>
                  <input type="text" required value={editingProduct.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Simpan</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingAffiliate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingAffiliate(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-12 rounded-[40px] shadow-2xl">
              <h3 className="text-3xl font-black mb-8">{editingAffiliate.id ? 'Edit' : 'Tambah'} Mitra Affiliasi</h3>
              <form onSubmit={handleSaveAffiliate} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Mitra</label>
                  <input type="text" required value={editingAffiliate.name} onChange={e => setEditingAffiliate({ ...editingAffiliate, name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Affiliate</label>
                    <input type="email" required value={editingAffiliate.email} onChange={e => setEditingAffiliate({ ...editingAffiliate, email: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Referral Code</label>
                    <input type="text" required value={editingAffiliate.referralCode} onChange={e => setEditingAffiliate({ ...editingAffiliate, referralCode: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="Contoh: MITRA01" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Simpan</button>
                  <button type="button" onClick={() => setEditingAffiliate(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingRegistration(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-3xl font-black mb-8">Tambah / Edit Pendaftar</h3>
              <form onSubmit={handleSaveRegistration} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Subdomain (cth: sekolah1)</label>
                  <input type="text" required value={editingRegistration.subdomain || ''} onChange={e => setEditingRegistration({ ...editingRegistration, subdomain: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Sekolah / Instansi</label>
                  <input type="text" required value={editingRegistration.school_name || ''} onChange={e => setEditingRegistration({ ...editingRegistration, school_name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">NPSN</label>
                  <input type="text" required value={editingRegistration.npsn || ''} onChange={e => setEditingRegistration({ ...editingRegistration, npsn: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Admin Sekolah</label>
                  <input type="text" required value={editingRegistration.admin_name || ''} onChange={e => setEditingRegistration({ ...editingRegistration, admin_name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Admin Sekolah</label>
                    <input type="email" required value={editingRegistration.admin_email || ''} onChange={e => setEditingRegistration({ ...editingRegistration, admin_email: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">WhatsApp / HP (WA)</label>
                    <input type="text" value={editingRegistration.WA || ''} onChange={e => setEditingRegistration({ ...editingRegistration, WA: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold" placeholder="08xxxxxxxx" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status</label>
                    <select value={editingRegistration.status} onChange={e => setEditingRegistration({ ...editingRegistration, status: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 font-bold">
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 px-4 bg-slate-50 rounded-2xl">
                    <input 
                      type="checkbox" 
                      id="is_approved"
                      checked={editingRegistration.is_approved} 
                      onChange={e => setEditingRegistration({ ...editingRegistration, is_approved: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label htmlFor="is_approved" className="text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer">Approved (is_approved)</label>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">Simpan</button>
                  <button type="button" onClick={() => setEditingRegistration(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
