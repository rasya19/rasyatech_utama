import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // atau 'motion/react' sesuai package.json Anda
import { supabase } from '../../lib/supabase';
import { supabaseKuliner } from '../../lib/supabase-kuliner';
import { 
  Users, 
  MessageCircle, 
  CheckCircle2, 
  Loader2, 
  Search, 
  School,
  Store,
  Clock,
  RefreshCcw,
  AlertCircle,
  Trash2
} from 'lucide-react';

type ProductType = 'lms' | 'scanbite' | 'restoran_asli' | 'siput' | 'instafoto';

interface Pendaftar {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  business_name: string;
  product_type: ProductType;
  package?: string;
  status: 'pending' | 'active' | 'verified';
  meta_data: any;
  created_at: string;
}

const TABS = [
  { id: 'lms', label: 'LMS Kesetaraan', icon: '📖' },
  { id: 'scanbite', label: 'Scanbite', icon: '☕' },
  { id: 'restoran_asli', label: 'Restoran Asli', icon: '🍽️' },
  { id: 'siput', label: 'SIPUT', icon: '🐌' },
  { id: 'instafoto', label: 'Instafoto', icon: '📸' },
] as const;

export default function ManajemenPendaftarSaaS() {
  const [activeTab, setActiveTab] = useState<ProductType>('lms');
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let resultData: any[] = [];
      let fetchError: any = null;

      // Percabangan penarikan data berdasarkan Client Supabase yang sesuai
      if (activeTab === 'lms') {
        const { data: res, error: err } = await supabase
          .from('pendaftar')
          .select('*')
          .eq('product_type', 'lms');
        resultData = res || [];
        fetchError = err;
      } else {
        // Menggunakan supabaseKuliner untuk produk makanan/apps retail
        const { data: res, error: err } = await supabaseKuliner
          .from('pendaftar')
          .select('*')
          .eq('product_type', activeTab);
        resultData = res || [];
        fetchError = err;
      }

      if (fetchError) throw fetchError;

      // Amankan sorting dari nilai null/undefined pada created_at
      const mappedData = [...resultData];
      mappedData.sort((a, b) => {
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setData(mappedData);
    } catch (err: any) {
      console.error('Gagal load data:', err);
      setError(err.message || 'Gagal memuat data pendaftar');
    } finally {
      setLoading(false);
    }
  };

  // Jalankan fetch data ulang setiap kali Tab Aktif berubah
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- UPDATE STATUS ---
  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'verified') => {
    setUpdatingId(id);
    try {
      const client = activeTab === 'lms' ? supabase : supabaseKuliner;
      const { error: err } = await client
        .from('pendaftar')
        .update({ status: newStatus })
        .eq('id', id);

      if (err) throw err;
      
      // Update state lokal supaya tidak perlu reload seluruh halaman
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err: any) {
      alert('Gagal memperbarui status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // --- HAPUS DATA ---
  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pendaftar ini?')) return;
    
    try {
      const client = activeTab === 'lms' ? supabase : supabaseKuliner;
      const { error: err } = await client
        .from('pendaftar')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  // --- FILTER SEARCH ---
  const filteredData = data.filter(item => 
    item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.whatsapp?.includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" /> Manajemen Pendaftar SaaS
          </h1>
          <p className="text-sm text-slate-400">Kelola database leads dan aktivasi sistem pendaftar otomatis.</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Navigasi Tab Produk */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-slate-800 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProductType)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-lg text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'border-blue-500 bg-slate-900 text-blue-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Kontrol & Filter Pencarian */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama, bisnis, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition text-slate-200"
          />
        </div>
        <div className="text-xs text-slate-400 w-full sm:w-auto text-right">
          Menampilkan <span className="text-blue-400 font-bold">{filteredData.length}</span> pendaftar
        </div>
      </div>

      {/* Penanganan Status Loading / Error / Kosong */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Menarik data pendaftar dari server...</p>
          </motion.div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-900 rounded-xl text-red-400 max-w-2xl mx-auto"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        ) : filteredData.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-300">BELUM ADA PENDAFTAR</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">Belum ada user yang mendaftar untuk produk ini atau pencarian tidak ditemukan.</p>
          </motion.div>
        ) : (
          /* Tabel Data */
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/30"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Data Pendaftar</th>
                  <th className="px-6 py-4">Nama Bisnis / Instansi</th>
                  <th className="px-6 py-4">Status Akun</th>
                  <th className="px-6 py-4">Tanggal Daftar</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{item.full_name}</div>
                      <div className="text-xs text-slate-500 space-y-0.5 mt-0.5">
                        <p>{item.email}</p>
                        <p className="text-blue-400">{item.whatsapp}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        {item.product_type === 'lms' ? <School className="w-4 h-4 text-amber-500" /> : <Store className="w-4 h-4 text-emerald-500" />}
                        {item.business_name || '-'}
                      </div>
                      {item.package && (
                        <span className="inline-block px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded text-2xs mt-1">
                          Paket: {item.package}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        item.status === 'verified' || item.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                          : 'bg-amber-950/40 text-amber-400 border-amber-900/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'verified' || item.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Tombol Follow Up WhatsApp */}
                        <a
                          href={`https://wa.me/${item.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>

                        {/* Tombol Aktivasi Status */}
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'verified')}
                            disabled={updatingId === item.id}
                            className="p-2 bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-400 hover:text-blue-200 rounded-lg transition disabled:opacity-50"
                            title="Verifikasi / Aktifkan"
                          >
                            {updatingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        )}

                        {/* Tombol Hapus */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-900 text-slate-400 hover:text-red-400 rounded-lg transition"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
