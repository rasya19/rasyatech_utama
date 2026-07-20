import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, ShieldCheck, Plus, Trash2, Edit2, Search, Loader2, 
  Settings, CheckCircle, AlertTriangle, ExternalLink, RefreshCw, LogOut, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Tenant {
  id: string;
  schoolName: string;
  subdomain: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminCenter {
  id: string;
  email: string;
  role: string;
}

export default function SaaSManager() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [admins, setAdmins] = useState<AdminCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tenants' | 'admins'>('tenants');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Form State
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  // Tenant Form
  const [schoolName, setSchoolName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [tenantStatus, setTenantStatus] = useState('ACTIVE');
  
  // Admin Form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState('MASTER_ADMIN');

  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const resTenants = await fetch('/api/saas/tenants');
      const resAdmins = await fetch('/api/saas/admins');
      
      if (resTenants.ok) {
        const data = await resTenants.json();
        setTenants(data || []);
      }
      if (resAdmins.ok) {
        const data = await resAdmins.json();
        setAdmins(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch SaaS data:', err);
      showNotification('error', 'Gagal memuat data dari server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !subdomain.trim()) {
      showNotification('error', 'Nama Sekolah dan Subdomain wajib diisi.');
      return;
    }

    setActionLoading(true);
    try {
      const url = editingTenant ? `/api/saas/tenants/${editingTenant.id}` : '/api/saas/tenants';
      const method = editingTenant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName, subdomain, status: tenantStatus })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('success', editingTenant ? 'Tenant berhasil diperbarui!' : 'Tenant baru berhasil didaftarkan!');
        setShowTenantModal(false);
        setEditingTenant(null);
        setSchoolName('');
        setSubdomain('');
        setTenantStatus('ACTIVE');
        fetchData();
      } else {
        showNotification('error', result.error || 'Gagal menyimpan data tenant.');
      }
    } catch (err) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus Tenant (sekolah) ini? Semua sub-layanan akan dinonaktifkan.')) return;
    try {
      const res = await fetch(`/api/saas/tenants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Tenant berhasil dihapus.');
        fetchData();
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Gagal menghapus tenant.');
      }
    } catch (err) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      showNotification('error', 'Email dan password wajib diisi.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/saas/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword, role: adminRole })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('success', 'Admin Center baru berhasil didaftarkan!');
        setShowAdminModal(false);
        setAdminEmail('');
        setAdminPassword('');
        setAdminRole('MASTER_ADMIN');
        fetchData();
      } else {
        showNotification('error', result.error || 'Gagal mendaftarkan admin baru.');
      }
    } catch (err) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun Master Admin ini?')) return;
    try {
      const res = await fetch(`/api/saas/admins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Akun admin berhasil dihapus.');
        fetchData();
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Gagal menghapus admin.');
      }
    } catch (err) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.schoolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTenantsCount = tenants.filter(t => t.status === 'ACTIVE').length;
  const inactiveTenantsCount = tenants.filter(t => t.status !== 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            RC
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-white">
              SaaS <span className="text-indigo-500">Manager</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Console Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all duration-200 text-left ${
              activeTab === 'tenants' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Manajemen Tenant</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all duration-200 text-left ${
              activeTab === 'admins' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Admin Center</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sesi Konsol</span>
            <span className="text-xs font-bold text-slate-300 block truncate mt-1">master_admin@rasyatech.com</span>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            Keluar Konsol
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 max-w-[1600px] mx-auto w-full">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {activeTab === 'tenants' ? 'Manajemen Tenant Sekolah' : 'Pusat Master Admin'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === 'tenants' 
                ? 'Kelola pendaftaran sekolah baru, atur subdomain, serta pantau status aktifasi client.' 
                : 'Kelola kredensial login admin pusat untuk mengamankan console.'
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700/80 text-slate-300 hover:text-white transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (activeTab === 'tenants') {
                  setEditingTenant(null);
                  setSchoolName('');
                  setSubdomain('');
                  setTenantStatus('ACTIVE');
                  setShowTenantModal(true);
                } else {
                  setShowAdminModal(true);
                }
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition"
            >
              <Plus className="w-5 h-5" />
              <span>{activeTab === 'tenants' ? 'Tambah Tenant' : 'Tambah Admin'}</span>
            </button>
          </div>
        </header>

        {/* Notifications */}
        <AnimatePresence>
          {notif && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl flex items-center gap-3 font-semibold text-sm ${
                notif.type === 'success' 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {notif.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{notif.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition shadow-md">
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Total Tenant Terdaftar</span>
            <span className="text-4xl font-black text-white block mt-2">{tenants.length}</span>
            <span className="text-[11px] text-indigo-400 font-bold block mt-3">Sistem SaaS Aktif</span>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition shadow-md">
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Tenant Aktif</span>
            <span className="text-4xl font-black text-emerald-400 block mt-2">{activeTenantsCount}</span>
            <span className="text-[11px] text-slate-500 font-bold block mt-3">Layanan operasional lancar</span>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition shadow-md">
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Tenant Ditangguhkan</span>
            <span className="text-4xl font-black text-rose-400 block mt-2">{inactiveTenantsCount}</span>
            <span className="text-[11px] text-slate-500 font-bold block mt-3">Menunggu verifikasi pembayaran</span>
          </div>

          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition shadow-md">
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Kredensial Admin Center</span>
            <span className="text-4xl font-black text-indigo-400 block mt-2">{admins.length}</span>
            <span className="text-[11px] text-slate-500 font-bold block mt-3">Akses kontrol superadmin</span>
          </div>
        </div>

        {/* Main Work Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-indigo-500 w-10 h-10" />
            <span className="font-semibold italic">Memuat basis data konsol...</span>
          </div>
        ) : activeTab === 'tenants' ? (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            {/* Table Search & Filter Toolbar */}
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-900/40">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama sekolah atau subdomain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 pl-12 pr-4 py-3 rounded-xl border border-slate-800 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Tenant Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-6">Sekolah / Instansi</th>
                    <th className="p-6">Subdomain</th>
                    <th className="p-6">Status Portal</th>
                    <th className="p-6">Tanggal Registrasi</th>
                    <th className="p-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500 italic">
                        Tidak ada tenant yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-white font-bold block">{tenant.schoolName}</span>
                              <span className="text-xs text-slate-500 block mt-0.5">ID: {tenant.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <a 
                            href={`https://${tenant.subdomain}.rasyatech_utama.my.id`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 hover:underline"
                          >
                            <span>{tenant.subdomain}.rasyatech_utama</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                            tenant.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="p-6 text-sm text-slate-400">
                          {new Date(tenant.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingTenant(tenant);
                                setSchoolName(tenant.schoolName);
                                setSubdomain(tenant.subdomain);
                                setTenantStatus(tenant.status);
                                setShowTenantModal(true);
                              }}
                              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition"
                              title="Edit Tenant"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(tenant.id)}
                              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition"
                              title="Hapus Tenant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            {/* Admin Table Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
              <h4 className="font-bold text-lg text-white">Akun Keamanan Pusat</h4>
            </div>

            {/* Admin Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/20 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-6">Alamat Email</th>
                    <th className="p-6">Otoritas Kredensial</th>
                    <th className="p-6 text-right">Aksi Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Key className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-white font-bold block">{admin.email}</span>
                            <span className="text-xs text-slate-500 block mt-0.5">ID: {admin.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {admin.role}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          disabled={admin.email === 'master_admin@rasyatech.com'}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Hapus Kredensial"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Tenant Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-black text-white">
                {editingTenant ? 'Edit Data Tenant' : 'Daftarkan Tenant Baru'}
              </h3>
              <button 
                onClick={() => {
                  setShowTenantModal(false);
                  setEditingTenant(null);
                }} 
                className="text-slate-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-5 font-semibold text-slate-300">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Nama Sekolah / Instansi</label>
                <input
                  type="text"
                  placeholder="Contoh: SMA Negeri 1 Kuningan"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-950 mt-2 p-4 rounded-xl border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Subdomain Akses</label>
                <div className="flex items-center mt-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden pr-4">
                  <input
                    type="text"
                    placeholder="contoh: sman1kuningan"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="flex-1 bg-transparent p-4 text-white focus:outline-none"
                    disabled={!!editingTenant}
                  />
                  <span className="text-slate-500 font-bold">.rasyatech</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1.5 font-medium">Subdomain bersifat permanen dan tidak dapat diubah setelah didaftarkan.</span>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Status Aktifasi</label>
                <select
                  value={tenantStatus}
                  onChange={(e) => setTenantStatus(e.target.value)}
                  className="w-full bg-slate-950 mt-2 p-4 rounded-xl border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE (Akses Diizinkan)</option>
                  <option value="INACTIVE">INACTIVE (Akses Ditangguhkan)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTenantModal(false);
                    setEditingTenant(null);
                  }}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="animate-spin w-4 h-4" />}
                  <span>{editingTenant ? 'Simpan Perubahan' : 'Daftarkan'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-black text-white">
                Tambah Akun Master Admin
              </h3>
              <button 
                onClick={() => setShowAdminModal(false)} 
                className="text-slate-500 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-5 font-semibold text-slate-300">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Email Admin</label>
                <input
                  type="email"
                  placeholder="Contoh: admin@rasyatech.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-950 mt-2 p-4 rounded-xl border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Password</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 mt-2 p-4 rounded-xl border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">Role Otoritas</label>
                <select
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full bg-slate-950 mt-2 p-4 rounded-xl border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MASTER_ADMIN">MASTER_ADMIN</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="animate-spin w-4 h-4" />}
                  <span>Daftarkan</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
