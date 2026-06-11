import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useLandingData } from '../../lib/LandingDataContext'
import { 
  Users, 
  MessageCircle, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Filter,
  ExternalLink,
  School,
  Store,
  LayoutGrid,
  Clock,
  RefreshCcw,
  AlertCircle,
  Trash2 // <-- Ditambahkan ikon Trash2
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
  { id: 'lms', label: 'LMS Kesetaraan', icon: '📖', color: 'text-blue-400' },
  { id: 'scanbite', label: 'Scanbite', icon: '☕', color: 'text-emerald-400' },
  { id: 'restoran_asli', label: 'Restoran Asli', icon: '🍽️', color: 'text-rose-400' },
  { id: 'siput', label: 'SIPUT', icon: '🐌', color: 'text-sky-400' },
  { id: 'instafoto', label: 'Instafoto', icon: '📸', color: 'text-orange-400' },
] as const;

export default function ManajemenPendaftarSaaS() {
  const [activeTab, setActiveTab] = useState<ProductType>('lms');
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Ambil data mentah registrations dari LandingDataContext
  const { registrations: regs, fetchData: refreshContext } = useLandingData();
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Amankan jika data dari context belum siap / kosong
      if (!regs || regs.length === 0) {
        setData([]);
        return;
      }

      // 1. Filter data lokal berdasarkan activeTab menggunakan kolom product_name (case-insensitive)
      const filteredRegs = regs.filter((r: any) => {
        const pName = (r.product_name || '').toLowerCase();
        
        switch (activeTab) {
          case 'lms':
            return pName.includes('lms') || pName.includes('armilla') || pName.includes('kesetaraan');
          case 'siput':
            return pName.includes('siput');
          case 'scanbite':
            return pName.includes('scanbite');
          case 'instafoto':
            return pName.includes('instafoto') || pName.includes('instafood');
          case 'restoran_asli':
            return pName.includes('resto') || pName.includes('restoran');
          default:
            return false;
        }
      });

      // 2. Mapping data hasil filter agar sesuai dengan interface Pendaftar UI
      const mappedData: Pendaftar[] = filteredRegs.map((r: any) => ({
        id: r.id,
        full_name: r.admin_name || r.full_name || r.name || '-',
        email: r.admin_email || r.email || '-',
        whatsapp: r.whatsapp || r.whatsapp_number || r.WA || '-',
        business_name: r.school_name || r.business_name || '-',
        product_type: activeTab,
        package: r.paket_langganan || r.selected_package || 'silver',
        status: (r.status === 'verified' || r.status === 'active' || r.approved === true || r.is_approved === true || r.is_approved === 'true') ? 'active' : 'pending',
        meta_data: { 
          npsn: r.npsn || null,
          tables_count: r.table_count || r.outlet_count || 0,
          outlet_count: r.outlet_count || r.table_count || 0
        },
        created_at: r.created_at
      }));

      // 3. Urutkan dari data pendaftaran yang paling baru
      mappedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setData(mappedData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pendaftar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, regs]); // <-- Tambahkan regs di dependency array

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    setUpdatingId(id);
    try {
      const nextStatus = currentStatus === 'pending' ? 'active' : 'pending';
      const isApprovedValue = (nextStatus === 'active');

      // Update status di tabel tunggal registrations
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ 
          status: nextStatus,
          is_approved: isApprovedValue
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      alert('Status pendaftar berhasil diperbarui!');
      if (refreshContext) await refreshContext(); // Paksa context mengambil data terbaru dari database
      
    } catch (err: any) {
      console.error('Update operation error:', err);
      alert('Gagal memperbarui status pendaftar.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
  if (!window.confirm("Yakin ingin menghapus data ini?")) return;

  try {
    // Karena cuma ada 1 tabel, pakai supabase utama saja
    const { error } = await supabase
      .from('registrations') // Targetkan tabel tunggal ini
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert('Data berhasil dihapus.');
    await fetchData(); // Refresh data setelah hapus
  } catch (err: any) {
    console.error('Error saat menghapus:', err);
    alert('Gagal menghapus data.');
  }
};

  const getDynamicColumnHeader = () => {
    if (activeTab === 'scanbite' || activeTab === 'restoran_asli') return 'Jml Meja';
    if (activeTab === 'instafoto') return 'Jml Outlet';
    if (activeTab === 'lms' || activeTab === 'siput') return 'NPSN';
    return '-';
  };

  const getDynamicValue = (meta: any) => {
    if (!meta) return '-';
    if (activeTab === 'scanbite' || activeTab === 'restoran_asli') return meta.tables_count || '-';
    if (activeTab === 'instafoto') return meta.outlet_count || '-';
    if (activeTab === 'lms' || activeTab === 'siput') return meta.npsn || '-';
    return '-';
  };

  return (
    <div className="bg-[#0A0F1E] rounded-[32px] border border-slate-800/50 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Manajemen Pendaftar SaaS</h1>
          </div>
          <p className="text-slate-400 text-sm">Rekap pendaftaran produk ekosistem Rasyatech Enterprise.</p>
        </div>

        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-2xl transition-all text-sm font-bold border border-slate-700/50 disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-4 pb-2 bg-[#0D1426] border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProductType)}
            className={`flex items-center gap-3 px-6 py-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-500 text-white bg-blue-500/5' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-sm font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-32 flex flex-col items-center justify-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-slate-500 font-medium font-serif italic">Membaca database Supabase...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              className="py-32 flex flex-col items-center justify-center gap-4 text-center"
            >
              <div className="p-4 bg-rose-500/10 rounded-full">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Waduh! Galat Sistem</h3>
              <p className="text-slate-500 max-w-sm">{error}</p>
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div 
              key="empty"
              className="py-32 flex flex-col items-center justify-center gap-4 text-center"
            >
              <div className="p-4 bg-slate-800/50 rounded-full">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-slate-400 font-bold text-lg uppercase tracking-widest">Belum Ada Pendaftar</h3>
              <p className="text-slate-600 max-w-sm text-sm">Belum ada user yang mendaftar untuk produk {activeTab.toUpperCase()} di wilayah ini.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Waktu Daftar</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Nama Lengkap</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Instansi / Bisnis</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">WhatsApp</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Paket</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">{getDynamicColumnHeader()}</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                      <td className="py-6 px-4">
                        <div className="text-slate-300 text-sm font-medium">{new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                        <div className="text-slate-600 text-[10px] font-mono mt-0.5">{new Date(item.created_at).toLocaleTimeString('id-ID')}</div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="text-white font-bold">{item.full_name}</div>
                        <div className="text-slate-500 text-xs mt-1">{item.email}</div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                            {activeTab === 'lms' || activeTab === 'siput' ? <School className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                          </span>
                          <span className="text-slate-300 font-semibold">{item.business_name}</span>
                        </div>
                      </td>
                      <td className="py-6 px-4 font-mono text-slate-400 text-sm">{item.whatsapp}</td>
                      <td className="py-6 px-4">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          {item.package || 'default'}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                        <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold font-mono">
                          {getDynamicValue(item.meta_data)}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        {item.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-6 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all group/wa"
                            title="Hubungi via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 transition-transform group-hover/wa:scale-110" />
                          </a>
                          
                          <button
                            onClick={() => handleUpdateStatus(item.id, item.status)}
                            disabled={updatingId === item.id}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                              item.status === 'active'
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            }`}
                          >
                            {updatingId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : item.status === 'active' ? (
                              'Nonaktifkan'
                            ) : (
                              'Setujui'
                            )}
                          </button>

                          {/* Tombol Hapus Ditambahkan Di Sini */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all hover:text-rose-300"
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

      {/* Footer Info */}
      <div className="p-6 bg-[#0D1426]/50 border-t border-slate-800 text-slate-600 text-xs flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Supabase Live Sync Enabled
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Secure WhatsApp API
          </span>
        </div>
        <div className="font-mono">RASYATECH_ADMIN_V2.0.4</div>
      </div>
    </div>
  );
}