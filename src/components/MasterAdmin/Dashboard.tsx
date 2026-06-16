import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import MonitoringDashboard from './MonitoringDashboard';
import ManajemenPendaftarSaaS from './ManajemenPendaftarSaaS';
import UnifiedRegistrationManager from './UnifiedRegistrationManager';
import { 
  Save, 
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
  ShieldCheck,
  Menu,
  X,
  Search,
  Download,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function Admin() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'services' | 'laptops' | 'payments' | 'products' | 'registrations_unified' | 'monitoring'>('config');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  const [searchRegQuery, setSearchRegQuery] = useState('');
  const [filterRegPackage, setFilterRegPackage] = useState('all');
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [chartView, setChartView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    setLoadingRegistrations(true);
    setRegistrationsError(null);
    try {
      const { data: regs, error } = await supabase.from('tenant_master').select('*');
      if (error) {
        console.error("Error fetching registrations:", error);
        setRegistrationsError(error.message);
      } else {
        setRegistrations(regs || []);
      }
    } catch (err: any) {
      console.error("Crash fetching registrations:", err);
      setRegistrationsError(err.message || 'Error tidak diketahui');
    } finally {
      setLoadingRegistrations(false);
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
    // Ambil tenant dari context atau environment (jangan hardcode!)
    const tenant = 'scanbite_live'; // atau dari context: const { tenant } = useTenant();
    
    const response = await fetch(`/api/delete-registration?id=${id}&tenant=${tenant}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      // Refresh data atau tampilkan notifikasi sukses
      alert('Pendaftar berhasil dihapus!');
      // reload data pendaftaran
    } else {
      const error = await response.json();
      alert('Gagal menghapus: ' + error.error);
    }
  } catch (error) {
    console.error('Error deleting registration:', error);
    alert('Terjadi kesalahan saat menghapus data.');
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
        .from('tenant_master')
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
    subdomain: reg.subdomain,
    tenant: 'scanbite_live' // atau dari context
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
      const { error } = await supabase.from('tenant_master').update({ status }).eq('id', id);
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

  const handleUpdateSchoolPackage = async (subdomain: string, newPackage: string) => {
    try {
      if (!subdomain) {
        setSaveStatus({ type: 'error', message: 'Subdomain tidak ditemukan!' });
        return;
      }
      
      console.log(`Updating 'paket_langganan' to ${newPackage} for school subdomain '${subdomain}'...`);
      
      // Update local state immediately for a highly responsive UI
      setRegistrations(prev => (prev || []).map(r => {
        if (r.subdomain === subdomain) {
          return { ...r, paket_langganan: newPackage };
        }
        return r;
      }));

      // 1. Update the 'paket_langganan' column of 'schools' table
      const { error: schoolError } = await supabase
        .from('schools')
        .update({ paket_langganan: newPackage })
        .eq('subdomain', subdomain); // In our database, this matches either slug or subdomain

      if (schoolError) {
        console.error("Gagal update paket_langganan di tabel schools:", schoolError.message, schoolError);
        // Fallback update schema by checking ID or other fields if needed
        const { error: schoolErrorById } = await supabase
          .from('schools')
          .update({ paket_langganan: newPackage })
          .eq('id', subdomain);
        
        if (schoolErrorById) {
          console.error("Gagal update paket_langganan di tabel schools berdasarkan ID:", schoolErrorById.message, schoolErrorById);
        }
      } else {
        console.log("Update paket_langganan on schools table succeeded.");
      }

      // 2. Also update registrations table just in case they added the column there
      const { error: regError } = await supabase
        .from('tenant_master')
        .update({ paket_langganan: newPackage })
        .eq('subdomain', subdomain);

      if (regError) {
        console.error("Gagal update paket_langganan di tabel registrations:", regError.message, regError);
      } else {
        console.log("Update paket_langganan on registrations table succeeded.");
      }

      setSaveStatus({ type: 'success', message: `Paket langganan diperbarui ke ${newPackage.toUpperCase()}!` });
      setTimeout(() => setSaveStatus(null), 3000);
      fetchRegistrations();
    } catch (err: any) {
      console.error("Error updating subscription package:", err);
      setSaveStatus({ type: 'error', message: 'Gagal memperbarui paket: ' + (err.message || 'Error tidak diketahui') });
    }
  };

  const handleExportToCSV = () => {
    if (registrations.length === 0) {
      setSaveStatus({ type: 'error', message: 'Tidak ada data pendaftar untuk diekspor.' });
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const headers = [
      "ID", 
      "Nama Sekolah", 
      "NPSN", 
      "Subdomain/Slug", 
      "Nama Admin", 
      "Email Admin", 
      "WhatsApp", 
      "Status", 
      "Paket Langganan", 
      "Tanggal Pendaftaran"
    ];

    const rows = (registrations || []).map(reg => [
      reg.id || '',
      (reg.school_name || '').replace(/"/g, '""'),
      reg.npsn || '-',
      reg.subdomain || '',
      (reg.admin_name || '').replace(/"/g, '""'),
      reg.admin_email || '',
      reg.WA || reg.whatsapp || '-',
      reg.status || 'pending',
      reg.paket_langganan || 'silver',
      reg.created_at || ''
    ]);

    const csvString = [headers.join(","), ...rows.map(row => row.map(val => `"${val}"`).join(","))].join("\r\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `data_pendaftar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSaveStatus({ type: 'success', message: 'Sukses mengekspor data pendaftar ke file CSV!' });
    setTimeout(() => setSaveStatus(null), 3500);
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
            const { error } = await supabase.from('tenant_master').update(payload).eq('id', editingRegistration.id);
            if (error) throw error;
        } else {
             const { error } = await supabase.from('tenant_master').insert([payload]);
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

  const getTrendingData = () => {
    const rawRegs = Array.isArray(registrations) ? registrations : [];
    
    if (chartView === 'daily') {
      // Create date slots for last 15 days
      const counts: { [key: string]: number } = {};
      rawRegs.forEach((reg: any) => {
        const rawDate = reg.created_at || reg.date;
        if (rawDate) {
          try {
            const dateStr = new Date(rawDate).toISOString().split('T')[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;
          } catch (_) {}
        }
      });
      
      const list = [];
      for (let i = 14; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        list.push({
          label,
          'Pendaftar': counts[dateStr] || 0
        });
      }
      return list;
    } else if (chartView === 'weekly') {
      // Group last 8 weeks
      const counts: { [key: string]: number } = {};
      rawRegs.forEach((reg: any) => {
        const rawDate = reg.created_at || reg.date;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(d.setDate(diff));
            const weekKey = startOfWeek.toISOString().split('T')[0];
            counts[weekKey] = (counts[weekKey] || 0) + 1;
          } catch (_) {}
        }
      });

      const list = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date();
        const firstDay = d.getDate() - d.getDay() + 1 - (i * 7);
        const startOfWeek = new Date(d.getFullYear(), d.getMonth(), firstDay);
        const weekKey = startOfWeek.toISOString().split('T')[0];
        
        const label = `Mg-${8 - i} (${startOfWeek.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`;
        list.push({
          label,
          'Pendaftar': counts[weekKey] || 0
        });
      }
      return list;
    } else {
      // Monthly: last 6 months
      const counts: { [key: string]: number } = {};
      rawRegs.forEach((reg: any) => {
        const rawDate = reg.created_at || reg.date;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            counts[key] = (counts[key] || 0) + 1;
          } catch (_) {}
        }
      });

      const list = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        list.push({
          label,
          'Pendaftar': counts[key] || 0
        });
      }
      return list;
    }
  };

  const trendData = getTrendingData();

  const filteredRegistrations = (registrations || []).filter(reg => {
    const matchesSearch = !searchRegQuery.trim() || 
      (reg.school_name || '').toLowerCase().includes(searchRegQuery.toLowerCase()) ||
      (reg.admin_name || '').toLowerCase().includes(searchRegQuery.toLowerCase()) ||
      (reg.subdomain || '').toLowerCase().includes(searchRegQuery.toLowerCase()) ||
      (reg.npsn || '').toLowerCase().includes(searchRegQuery.toLowerCase());
    
    const matchesPackage = filterRegPackage === 'all' || 
      (reg.paket_langganan || 'silver').toLowerCase() === filterRegPackage.toLowerCase();
    
    return matchesSearch && matchesPackage;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      {!isAuthorizedSuperAdmin && user && (
        <div className="bg-red-500 text-white px-10 py-3 text-center text-sm font-black uppercase tracking-widest fixed top-0 left-0 right-0 z-[100] shadow-xl">
          ⚠️ Akun ini ({user.email}) tidak memiliki akses simpan. Hubungi Developer.
        </div>
      )}

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#0B2447]/60 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Premium Sidebar with Midnight Blue `#0B2447` */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0B2447] flex flex-col shadow-2xl z-40 transform ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex flex-shrink-0`}>
        
        {/* Sidebar Header with Brushed Metal and Silver Steel texture */}
        <div className="brushed-metal p-6 flex flex-col items-center justify-center border-b border-white/10 relative">
          {/* Close button inside sidebar on mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white md:hidden hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 bg-[#0b2447] rounded-xl flex items-center justify-center text-[#00BEC4] shadow-md border border-white/20">
              <span className="text-white font-black text-xl">RC</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#0B2447] leading-none flex items-center gap-1">
                Rasya<span className="text-[#00BEC4]">Tech</span>
              </h2>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#475569] block mt-1">Admin Rasyatech</span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          <nav className="flex flex-col gap-2">
            {[
              { id: 'config', label: 'Konfigurasi', icon: <Settings className="w-5 h-5" /> },
              { id: 'payments', label: 'Pembayaran', icon: <CheckCircle2 className="w-5 h-5" /> },
              { id: 'services', label: 'Layanan', icon: <Monitor className="w-5 h-5" /> },
              { id: 'laptops', label: 'Inventory Laptop', icon: <Package className="w-5 h-5" /> },
              { id: 'products', label: 'Katalog Barang', icon: <Package className="w-5 h-5" /> },
              { id: 'registrations_unified', label: 'Manajemen Pendaftar & Mitra', icon: <Users className="w-5 h-5" /> },
              { id: 'monitoring', label: 'Monitoring Keluhan', icon: <Activity className="w-5 h-5" /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all duration-200 text-left ${
                    isActive 
                      ? 'bg-[#00BEC4] text-[#0B2447] shadow-lg shadow-[#00BEC4]/20 translate-x-1' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-[#0B2447]' : 'text-[#00BEC4]'}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Account Action */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="px-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Logged in as</p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={() => {
                supabase.auth.signOut();
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 text-rose-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Workspace Top Header */}
        <header className="bg-white border-b border-slate-200/80 py-5 px-6 md:px-10 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl md:hidden transition-colors"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-black text-[#0B2447] tracking-tight">Admin Panel - Rasyatech</h1>
          </div>
          <div className="bg-[#f8fafc] px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-slate-100 shadow-sm font-bold text-[#0B2447] flex items-center gap-2 text-xs md:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-pulse"></span>
            Admin Rasyatech
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
             <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300">
               <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Total Pengunjung</div>
               <div className="text-4xl font-black text-[#0B2447] font-mono tracking-tighter">{visitorCount.toLocaleString()}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300">
               <div className="text-[10px] uppercase font-black tracking-widest text-[#00BEC4] mb-2">Total Pendaftar</div>
               <div className="text-4xl font-black text-[#0B2447] font-mono tracking-tighter">{registrations.length}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300">
               <div className="text-[10px] uppercase font-black tracking-widest text-[#14B8A6] mb-2">Mitra Affiliasi</div>
               <div className="text-4xl font-black text-[#0B2447] font-mono tracking-tighter">{affiliates.length}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300">
               <div className="text-[10px] uppercase font-black tracking-widest text-amber-500 mb-2">Inventory Unit</div>
               <div className="text-4xl font-black text-[#0B2447] font-mono tracking-tighter">{laptops.length + products.length}</div>
             </div>
          </div>


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

          <div className="grid grid-cols-1 gap-12">
          {/* Centralized Complaint Monitoring Section */}
          {activeTab === 'monitoring' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <MonitoringDashboard />
            </motion.div>
          )}

          {/* Unified Registration Management */}
          {activeTab === 'registrations_unified' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <UnifiedRegistrationManager />
            </motion.div>
          )}

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
                {(services || []).map(s => (
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
                {(laptops || []).map(l => (
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
                {(products || []).map(p => (
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

          {/* Trend Chart Card using Recharts - Moved to Bottom */}
          <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-md hover:shadow-lg transition-all duration-300 mt-12 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-[#0B2447]">Tren Pendaftaran Baru</h3>
                <p className="text-slate-500 text-sm font-medium">Statistik registrasi pendaftar ekosistem berdasarkan periode waktu.</p>
              </div>
              
              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChartView('daily')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    chartView === 'daily' 
                      ? 'bg-white text-[#0B2447] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Harian
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('weekly')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    chartView === 'weekly' 
                      ? 'bg-white text-[#0B2447] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Mingguan
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('monthly')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    chartView === 'monthly' 
                      ? 'bg-white text-[#0B2447] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bulanan
                </button>
              </div>
            </div>

            <div className="h-80 w-full font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPendaftar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00BEC4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00BEC4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0B2447', 
                      borderRadius: '16px', 
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}
                    itemStyle={{ color: '#00BEC4', fontWeight: 800 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Pendaftar" 
                    stroke="#00BEC4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPendaftar)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
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
      </AnimatePresence>
      </main>
    </div>
  );
}
