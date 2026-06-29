import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { supabaseKuliner } from '../../lib/supabase-kuliner';
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
  Trash2,
  Ban,
  AlertTriangle
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
  status: string;
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'lms') {
        // Fetch from registrations table for schools
        const { data: regs, error: fetchError } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        // Map registrations to Pendaftar format
        const mappedData: Pendaftar[] = (regs || []).map(r => ({
          id: r.id,
          full_name: r.admin_name || r.name || '-',
          email: r.email || r.admin_email || '-',
          whatsapp: r.whatsapp || r.WA || '-',
          business_name: r.school_name || '-',
          product_type: 'lms',
          package: r.selected_package || r.paket_langganan || 'silver',
          status: r.status || 'pending',
          meta_data: { npsn: r.npsn },
          created_at: r.created_at
        }));
        
        // Also fetch from pendaftar table where product_type = 'lms' just in case
        const { data: saasLms } = await supabase
          .from('pendaftar')
          .select('*')
          .eq('product_type', 'lms');
        
        const unified = [...mappedData, ...(saasLms || [])];
        // Sort by created_at
        unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setData(unified);
      } else {
        // Fetch from culinary supabase registrations table
        const { data: pendaftar, error: fetchError } = await supabaseKuliner
          .from('registrations')
          .select('*')
          .eq('business_type', activeTab)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        const mappedData: Pendaftar[] = (pendaftar || []).map((r: any) => ({
          id: r.id,
          full_name: r.full_name || '-',
          email: r.email || '-',
          whatsapp: r.whatsapp_number || '-',
          business_name: r.business_name || '-',
          product_type: activeTab,
          package: r.package_tier || r.selected_package || 'standard',
          status: r.status as any,
          meta_data: { 
            tables_count: r.table_count,
            outlet_count: r.table_count
          },
          created_at: r.created_at
        }));

        setData(mappedData);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pendaftar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const isLms = activeTab === 'lms';
      const client = isLms ? supabase : supabaseKuliner;
      const table = 'registrations';

      const updatePayload: any = { status: newStatus };
      if (isLms) {
        updatePayload.is_approved = (newStatus === 'active' || newStatus === 'trial');
      }

      const { error: updateError } = await client
        .from(table)
        .update(updatePayload)
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Update local state
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err: any) {
      console.error('Update operation error:', err);
      alert('Gagal update database bang: ' + (err.message || err));
    } finally {
      setUpdatingId(null);
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

  const renderStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <Clock className="w-3 h-3 animate-pulse" />
            Trial
          </span>
        );
      case 'suspend':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <AlertCircle className="w-3 h-3" />
            Suspend
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <Ban className="w-3 h-3" />
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <Clock className="w-3 h-3" />
            {status || 'Pending'}
          </span>
        );
    }
  };

  const handleDelete = async (id: string) => {
    // 1. Konfirmasi user agar tidak salah hapus
    if (!confirm("Apakah Anda yakin ingin menghapus data pendaftar ini?")) return;

    try {
      const isLms = activeTab === 'lms';
      const client = isLms ? supabase : supabaseKuliner;

      // 2. Eksekusi delete ke database yang sesuai
      const { error } = await client
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Gagal menghapus data: " + error.message);
      } else {
        alert("Data berhasil dihapus!");
        // 3. Refresh data agar tampilan ter-update
        fetchData();
      }
    } catch (err: any) {
      console.error("Delete operation error:", err);
      alert("Terjadi kesalahan sistem saat menghapus data.");
    }
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
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="py-6 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
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
                            onClick={() => handleDelete(item.id)}
                            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all group/trash"
                            title="Hapus Pendaftar"
                          >
                            <Trash2 className="w-4 h-4 transition-transform group-hover/trash:scale-110" />
                          </button>
                          
                          <div className="relative">
                            {updatingId === item.id ? (
                              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                <span>Updating...</span>
                              </div>
                            ) : (
                              <>
                                <select
                                  value={item.status || 'pending'}
                                  onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                                  className="appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl pl-4 pr-8 py-2.5 outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="pending" className="bg-[#0A0F1E] text-orange-400 font-bold">Pending</option>
                                  <option value="trial" className="bg-[#0A0F1E] text-yellow-400 font-bold">Trial</option>
                                  <option value="active" className="bg-[#0A0F1E] text-emerald-400 font-bold">Active</option>
                                  <option value="suspend" className="bg-[#0A0F1E] text-rose-400 font-bold">Suspend</option>
                                  <option value="inactive" className="bg-[#0A0F1E] text-slate-400 font-bold">Inactive</option>
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                                  <span className="text-[8px]">▼</span>
                                </div>
                              </>
                            )}
                          </div>
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
