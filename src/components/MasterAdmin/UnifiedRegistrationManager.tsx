import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import ManajemenPendaftarSaaS from './ManajemenPendaftarSaaS';
import { 
  Users, 
  School, 
  Package, 
  UserCheck, 
  Search, 
  Download, 
  Plus, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  Loader2,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

type MainTab = 'schools' | 'saas' | 'affiliates';

export default function UnifiedRegistrationManager() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('schools');
  
  // Legacy Registrations (Schools) State
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [searchRegQuery, setSearchRegQuery] = useState('');
  const [filterRegPackage, setFilterRegPackage] = useState('all');

  // Affiliates State
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loadingAffs, setLoadingAffs] = useState(false);

  // Modal States
  const [editingRegistration, setEditingRegistration] = useState<any>(null);
  const [editingAffiliate, setEditingAffiliate] = useState<any>(null);

  useEffect(() => {
    if (activeMainTab === 'schools') fetchRegistrations();
    if (activeMainTab === 'affiliates') fetchAffiliates();
  }, [activeMainTab]);

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
      const { data, error } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setRegistrations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const fetchAffiliates = async () => {
    setLoadingAffs(true);
    try {
      const { data, error } = await supabase.from('affiliates').select('*').order('name', { ascending: true });
      if (error) throw error;
      setAffiliates(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAffs(false);
    }
  };

  // Actions for Schools
  const handleVerifySchool = async (reg: any) => {
    const autoSubdomain = reg.school_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    try {
      const response = await fetch('/api/verify-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg.id,
          email: reg.admin_email,
          school_name: reg.school_name,
          subdomain: autoSubdomain, 
          whatsapp: reg.whatsapp || reg.WA
        }),
      });
      if (response.ok) fetchRegistrations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReg = async (id: string) => {
    if (!confirm('Hapus pendaftar sekolah ini?')) return;
    try {
      await supabase.from('registrations').delete().eq('id', id);
      fetchRegistrations();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions for Affiliates
  const handleDeleteAff = async (id: string) => {
    if (!confirm('Hapus mitra affiliate ini?')) return;
    try {
      await supabase.from('affiliates').delete().eq('id', id);
      fetchAffiliates();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRegs = registrations.filter(reg => {
    const matchesSearch = !searchRegQuery.trim() || 
      (reg.school_name || '').toLowerCase().includes(searchRegQuery.toLowerCase()) ||
      (reg.admin_name || '').toLowerCase().includes(searchRegQuery.toLowerCase());
    const matchesPackage = filterRegPackage === 'all' || (reg.paket_langganan || 'silver').toLowerCase() === filterRegPackage.toLowerCase();
    return matchesSearch && matchesPackage;
  });

  return (
    <div className="space-y-8">
      {/* Top Level Unified Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex p-1.5 bg-slate-50 rounded-[24px] w-full md:w-auto">
          {[
            { id: 'schools', label: 'Pendaftar Sekolah', icon: <School className="w-4 h-4" /> },
            { id: 'saas', label: 'Pendaftar SaaS Ecosystem', icon: <Package className="w-4 h-4" /> },
            { id: 'affiliates', label: 'Program Afiliasi', icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as MainTab)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                activeMainTab === tab.id 
                  ? 'bg-white text-[#0B2447] shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {activeMainTab === tab.id && <motion.div layoutId="activeTab" className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
            </button>
          ))}
        </div>
        
        <div className="px-6 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hidden lg:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Centralized Management Platform
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeMainTab === 'schools' && (
          <motion.div 
            key="schools"
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* School Header & Search */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="relative max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari sekolah, NPSN, atau admin..." 
                    value={searchRegQuery}
                    onChange={(e) => setSearchRegQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={filterRegPackage}
                  onChange={(e) => setFilterRegPackage(e.target.value)}
                  className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer text-sm"
                >
                  <option value="all">Semua Paket</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
                <button 
                  onClick={() => setEditingRegistration({ school_name: '', npsn: '', admin_name: '', admin_email: '', WA: '', status: 'pending', subdomain: '' })}
                  className="px-8 py-4 bg-[#0B2447] text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-5 h-5" /> Tambah Manual
                </button>
              </div>
            </div>

            {/* School List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingRegs ? (
                <div className="col-span-full py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="font-serif italic">Sinkronisasi data sekolah...</p>
                </div>
              ) : filteredRegs.map((reg) => (
                <div key={reg.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <School className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{reg.school_name}</h4>
                        <p className="text-slate-500 text-xs font-bold">NPSN: {reg.npsn || '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setEditingRegistration(reg)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDeleteReg(reg.id)} className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 transition-colors">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Hubungi</span>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-[9px] font-black uppercase">
                          {reg.paket_langganan || 'silver'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{reg.admin_name}</p>
                      <p className="text-slate-500 text-xs">{reg.admin_email}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {reg.status === 'verified' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase border border-amber-100">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                         <a 
                            href={`https://wa.me/${(reg.whatsapp || reg.WA || '').replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          {reg.status !== 'verified' && (
                            <button 
                              onClick={() => handleVerifySchool(reg)}
                              className="px-4 py-2 bg-blue-600 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3 h-3" /> Verifikasi
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredRegs.length === 0 && !loadingRegs && (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold">Tidak ada data pendaftar sekolah yang cocok.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeMainTab === 'saas' && (
          <motion.div 
            key="saas"
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
          >
            <ManajemenPendaftarSaaS />
          </motion.div>
        )}

        {activeMainTab === 'affiliates' && (
          <motion.div 
            key="affiliates"
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Program Kemitraan</h2>
                <p className="text-slate-500 font-medium">Monitoring data member affiliate and referral program Rasyatech.</p>
              </div>
              <button 
                onClick={() => setEditingAffiliate({ name: '', email: '', referralCode: '' })}
                className="px-8 py-4 bg-[#0B2447] text-white font-black rounded-2xl shadow-lg flex items-center gap-2 text-sm"
              >
                <Plus className="w-5 h-5" /> Member Baru
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loadingAffs ? (
                <div className="col-span-full py-32 flex justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                </div>
              ) : affiliates.map((af) => (
                <div key={af.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 mb-4">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight mb-1">{af.name}</h4>
                  <p className="text-slate-500 text-xs font-bold mb-6">{af.email}</p>
                  
                  <div className="w-full p-4 bg-slate-50 rounded-2xl mb-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Referral Code</span>
                    <span className="font-mono font-black text-blue-600">{af.referralCode}</span>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button onClick={() => setEditingAffiliate(af)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                       <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDeleteAff(af.id)} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-100 transition-all">
                       <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              
              {affiliates.length === 0 && !loadingAffs && (
                <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold">Belum ada mitra affiliate terdaftar.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals - Keeping them inside for portability */}
      <AnimatePresence>
        {editingRegistration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingRegistration(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-3xl font-black mb-8">Data Sekolah</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await supabase.from('registrations').upsert(editingRegistration);
                setEditingRegistration(null);
                fetchRegistrations();
              }} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Sekolah</label>
                  <input type="text" required value={editingRegistration.school_name || ''} onChange={e => setEditingRegistration({ ...editingRegistration, school_name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">NPSN</label>
                    <input type="text" value={editingRegistration.npsn || ''} onChange={e => setEditingRegistration({ ...editingRegistration, npsn: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Subdomain</label>
                    <input type="text" required value={editingRegistration.subdomain || ''} onChange={e => setEditingRegistration({ ...editingRegistration, subdomain: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Admin</label>
                  <input type="email" required value={editingRegistration.admin_email || ''} onChange={e => setEditingRegistration({ ...editingRegistration, admin_email: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">Simpan Data</button>
                  <button type="button" onClick={() => setEditingRegistration(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingAffiliate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingAffiliate(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl p-10 rounded-[40px] shadow-2xl">
              <h3 className="text-3xl font-black mb-8">Data Member Affiliate</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await supabase.from('affiliates').upsert(editingAffiliate);
                setEditingAffiliate(null);
                fetchAffiliates();
              }} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
                  <input type="text" required value={editingAffiliate.name || ''} onChange={e => setEditingAffiliate({ ...editingAffiliate, name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email</label>
                    <input type="email" required value={editingAffiliate.email || ''} onChange={e => setEditingAffiliate({ ...editingAffiliate, email: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Referral Code</label>
                    <input type="text" required value={editingAffiliate.referralCode || ''} onChange={e => setEditingAffiliate({ ...editingAffiliate, referralCode: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">Simpan Mitra</button>
                  <button type="button" onClick={() => setEditingAffiliate(null)} className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-2xl">Batal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
