import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Trash2,
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
  is_approved?: boolean;
  meta_data: Record<string, unknown>;
  created_at: string;
  /** Baris mentah dari Supabase — untuk update status dinamis */
  _raw: Record<string, unknown>;
}

const TABS = [
  { id: 'lms', label: 'LMS Kesetaraan', icon: '📖', color: 'text-blue-400' },
  { id: 'scanbite', label: 'Scanbite', icon: '☕', color: 'text-emerald-400' },
  { id: 'restoran_asli', label: 'Restoran Asli', icon: '🍽️', color: 'text-rose-400' },
  { id: 'siput', label: 'SIPUT', icon: '🐌', color: 'text-sky-400' },
  { id: 'instafoto', label: 'Instafoto', icon: '📸', color: 'text-orange-400' },
] as const;

function isMainDbTab(tab: ProductType): boolean {
  return tab === 'lms' || tab === 'siput';
}

function getDbClient(tab: ProductType) {
  return isMainDbTab(tab) ? supabase : supabaseKuliner;
}

function getProductTypeValue(row: Record<string, unknown>): string {
  return String(row.product_type || row.product_name || row.business_type || '').toLowerCase();
}

function matchesActiveTab(row: Record<string, unknown>, tab: ProductType): boolean {
  const pType = getProductTypeValue(row);
  const tabLower = tab.toLowerCase();

  switch (tab) {
    case 'lms':
      return (
        pType === 'lms' ||
        pType.includes('lms') ||
        pType.includes('armilla') ||
        pType.includes('kesetaraan')
      );
    case 'siput':
      return pType === 'siput' || pType.includes('siput');
    case 'scanbite':
      return pType === 'scanbite' || pType.includes('scanbite');
    case 'restoran_asli':
      return pType === 'restoran_asli' || pType.includes('restoran') || pType.includes('resto');
    case 'instafoto':
      return pType === 'instafoto' || pType.includes('instafoto') || pType.includes('instafood');
    default:
      return pType === tabLower || pType.includes(tabLower);
  }
}

function isTruthyApproved(value: unknown): boolean {
  return value === true || value === 1 || String(value).toLowerCase() === 'true';
}

/** Toleran terhadap status string/boolean dari berbagai skema Supabase. */
function isVerified(item: Pick<Pendaftar, 'status' | 'is_approved' | '_raw'>): boolean {
  const statusValues = [
    item.status,
    item._raw?.status,
  ]
    .map((v) => String(v ?? '').toLowerCase())
    .filter(Boolean);

  if (statusValues.some((s) => s === 'verified' || s === 'active' || s === 'approved')) {
    return true;
  }

  if (isTruthyApproved(item.is_approved) || isTruthyApproved(item._raw?.is_approved)) {
    return true;
  }

  if (item._raw?.approved === true || String(item._raw?.approved).toLowerCase() === 'true') {
    return true;
  }

  return false;
}

function resolveUiStatus(row: Record<string, unknown>): Pendaftar['status'] {
  if (isTruthyApproved(row.is_approved)) {
    return 'verified';
  }
  const status = String(row.status || '').toLowerCase();
  if (status === 'verified' || status === 'active' || status === 'approved') return 'verified';
  if (row.approved === true || String(row.approved).toLowerCase() === 'true') return 'verified';
  return 'pending';
}

function mapRowToPendaftar(row: Record<string, unknown>, tab: ProductType): Pendaftar {
  return {
    id: String(row.id),
    full_name: String(row.admin_name || row.full_name || row.name || '-'),
    email: String(row.admin_email || row.email || '-'),
    whatsapp: String(row.whatsapp || row.whatsapp_number || row.WA || '-'),
    business_name: String(row.school_name || row.business_name || row.tenant_name || '-'),
    product_type: tab,
    package: String(row.paket_langganan || row.selected_package || row.package_tier || 'silver'),
    status: resolveUiStatus(row),
    is_approved: isTruthyApproved(row.is_approved),
    meta_data: {
      npsn: row.npsn ?? null,
      tables_count: row.table_count ?? row.tables_count ?? 0,
      outlet_count: row.outlet_count ?? 0,
    },
    created_at: String(row.created_at || ''),
    _raw: row,
  };
}

function sortByCreatedAtDesc<T extends { created_at?: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}

/** ID asli dari baris Supabase (bigint/UUID) — jangan pakai filter tenant pada update/delete. */
function getRegistrationRowId(item: Pick<Pendaftar, 'id' | '_raw'>): string | number {
  const rawId = item._raw?.id;
  if (typeof rawId === 'number') return rawId;
  if (typeof rawId === 'string' && rawId.trim() !== '') {
    const asNumber = Number(rawId);
    if (!Number.isNaN(asNumber) && String(asNumber) === rawId) return asNumber;
    return rawId;
  }
  const asNumber = Number(item.id);
  if (!Number.isNaN(asNumber) && String(asNumber) === item.id) return asNumber;
  return item.id;
}

export default function ManajemenPendaftarSaaS() {
  const [activeTab, setActiveTab] = useState<ProductType>('lms');
  const [data, setData] = useState<Pendaftar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const client = getDbClient(activeTab);
      const kulinerMissing =
        !isMainDbTab(activeTab) &&
        !(import.meta.env.VITE_SUPABASE_URL_KULINER && import.meta.env.VITE_SUPABASE_ANON_KEY_KULINER);

      if (kulinerMissing) {
        throw new Error(
          'Kredensial Supabase Kuliner belum dikonfigurasi di Vercel (VITE_SUPABASE_URL_KULINER).'
        );
      }

      const { data: rawRows, error: fetchError } = await client
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const rows = (rawRows as Record<string, unknown>[]) || [];
      const filtered = rows.filter((row) => matchesActiveTab(row, activeTab));
      const mapped = sortByCreatedAtDesc(filtered.map((row) => mapRowToPendaftar(row, activeTab)));

      setData(mapped);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data pendaftar';
      setError(message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, fetchData]);

  const handleUpdateStatus = async (item: Pendaftar) => {
    const rowId = getRegistrationRowId(item);
    setUpdatingId(item.id);
    const activating = !isVerified(item);
    const client = getDbClient(activeTab);

    try {
      const payload: Record<string, unknown> = {
        is_approved: activating,
        status: activating ? 'verified' : 'pending',
      };

      // Hanya filter by id — jangan .eq('tenant', ...) karena id sudah unik global di tabel.
      const { data: updatedRows, error: updateError } = await client
        .from('registrations')
        .update(payload)
        .eq('id', rowId)
        .select('id');

      if (updateError) throw updateError;
      if (!updatedRows?.length) {
        throw new Error('Tidak ada baris yang diperbarui. Periksa ID pendaftar atau kebijakan RLS Supabase.');
      }

      setData((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: activating ? 'verified' : 'pending',
                is_approved: activating,
                _raw: {
                  ...row._raw,
                  status: activating ? 'verified' : 'pending',
                  is_approved: activating,
                },
              }
            : row
        )
      );

      alert('Status pendaftar berhasil diperbarui!');
    } catch (err: unknown) {
      console.error('Update operation error:', err);
      const message = err instanceof Error ? err.message : 'Gagal memperbarui status pendaftar.';
      alert(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (item: Pendaftar) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;

    const rowId = getRegistrationRowId(item);

    try {
      const client = getDbClient(activeTab);

      // Hanya filter by id — jangan .eq('tenant', ...) karena id sudah unik global di tabel.
      const { data: deletedRows, error: deleteError } = await client
        .from('registrations')
        .delete()
        .eq('id', rowId)
        .select('id');

      if (deleteError) throw deleteError;
      if (!deletedRows?.length) {
        throw new Error('Tidak ada baris yang dihapus. Periksa ID pendaftar atau kebijakan RLS Supabase.');
      }

      setData((prev) => prev.filter((row) => row.id !== item.id));
      alert('Data berhasil dihapus.');
    } catch (err: unknown) {
      console.error('Error saat menghapus:', err);
      const message = err instanceof Error ? err.message : 'Gagal menghapus data.';
      alert(message);
    }
  };

  const getDynamicColumnHeader = () => {
    if (activeTab === 'scanbite' || activeTab === 'restoran_asli') return 'Jml Meja';
    if (activeTab === 'instafoto') return 'Jml Outlet';
    if (activeTab === 'lms' || activeTab === 'siput') return 'NPSN';
    return '-';
  };

  const getDynamicValue = (meta: Record<string, unknown>) => {
    if (!meta) return '-';
    if (activeTab === 'scanbite' || activeTab === 'restoran_asli') {
      return String(meta.tables_count ?? '-');
    }
    if (activeTab === 'instafoto') return String(meta.outlet_count ?? '-');
    if (activeTab === 'lms' || activeTab === 'siput') return String(meta.npsn ?? '-');
    return '-';
  };

  const formatCreatedAt = (createdAt: string) => {
    const date = new Date(createdAt || 0);
    if (Number.isNaN(date.getTime())) {
      return { date: '-', time: '-' };
    }
    return {
      date: date.toLocaleDateString('id-ID'),
      time: date.toLocaleTimeString('id-ID'),
    };
  };

  return (
    <div className="bg-[#0A0F1E] rounded-[32px] border border-slate-800/50 overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
              Manajemen Pendaftar SaaS
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            LMS & SIPUT → Supabase utama · Kuliner → Supabase Kuliner
          </p>
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
              <p className="text-slate-500 font-medium font-serif italic">
                Membaca database Supabase...
              </p>
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
              <h3 className="text-slate-400 font-bold text-lg uppercase tracking-widest">
                Belum Ada Pendaftar
              </h3>
              <p className="text-slate-600 max-w-sm text-sm">
                Belum ada user yang mendaftar untuk produk {activeTab.toUpperCase()} di tenant ini.
              </p>
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
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                      Waktu Daftar
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                      Nama Lengkap
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                      Instansi / Bisnis
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                      WhatsApp
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                      Paket
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                      {getDynamicColumnHeader()}
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="py-5 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const created = formatCreatedAt(item.created_at);
                    const verified = isVerified(item);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="py-6 px-4">
                          <div className="text-slate-300 text-sm font-medium">{created.date}</div>
                          <div className="text-slate-600 text-[10px] font-mono mt-0.5">
                            {created.time}
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="text-white font-bold">{item.full_name}</div>
                          <div className="text-slate-500 text-xs mt-1">{item.email}</div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-slate-800 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                              {activeTab === 'lms' || activeTab === 'siput' ? (
                                <School className="w-3.5 h-3.5" />
                              ) : (
                                <Store className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <span className="text-slate-300 font-semibold">{item.business_name}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4 font-mono text-slate-400 text-sm">
                          {item.whatsapp}
                        </td>
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
                          {verified ? (
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
                              onClick={() => handleUpdateStatus(item)}
                              disabled={updatingId === item.id}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                verified
                                  ? 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-white'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                              }`}
                            >
                              {updatingId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : verified ? (
                                'Nonaktifkan'
                              ) : (
                                'Setujui'
                              )}
                            </button>

                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-all hover:text-rose-300"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-[#0D1426]/50 border-t border-slate-800 text-slate-600 text-xs flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            {isMainDbTab(activeTab) ? 'Supabase LMS/SIPUT' : 'Supabase Kuliner'}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Produk: {activeTab}
          </span>
        </div>
        <div className="font-mono">RASYATECH_ADMIN_V2.1.0</div>
      </div>
    </div>
  );
}
