import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Mail, 
  MessageSquare, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  Store,
  LayoutGrid,
  School,
  Database
} from 'lucide-react';

type ProductType = 'scanbite' | 'lms' | 'siput' | 'instafood' | 'restoran_asli';

export default function FormPendaftaranSaaS() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine current product from URL
  const productParam = searchParams.get('product') as ProductType;
  const currentProduct: ProductType = ['scanbite', 'lms', 'siput', 'instafood', 'restoran_asli'].includes(productParam) 
    ? productParam 
    : 'lms';

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    business_name: '',
    product_type: currentProduct,
    package: '',
    // Dynamic fields
    tables_count: '',
    outlet_count: '',
    npsn: ''
  });

  // Keep business_name synchronized if it's LMS/SIPUT
  useEffect(() => {
    setFormData(prev => ({ ...prev, product_type: currentProduct }));
  }, [currentProduct]);

  const isCulinary = ['scanbite', 'restoran_asli', 'instafood'].includes(formData.product_type);

  const getProductLabel = (type: string = formData.product_type) => {
    switch (type) {
      case 'scanbite': return 'ScanBite (Gizi & Nutrisi)';
      case 'lms': return 'Rasya LMS PKBM';
      case 'siput': return 'SIPUT (Sistem Informasi Penduduk)';
      case 'instafood': return 'Instafood (Manajemen Menu)';
      case 'restoran_asli': return 'Restoran Asli (POS & Kasir)';
      default: return 'Layanan Rasyatech';
    }
  };

  const getProductDescription = (type: string = formData.product_type) => {
    switch (type) {
      case 'scanbite': return 'Solusi pemindaian gizi makanan cerdas untuk institusi pendidikan dan kesehatan.';
      case 'lms': return 'Learning Management System terpadu untuk PKBM, LKP, dan Satuan Pendidikan Non-Formal.';
      case 'siput': return 'Digitalisasi administrasi kependudukan dan layanan publik tingkat desa/kelurahan.';
      case 'instafood': return 'Manajemen menu digital dan integrasi kurir internal untuk bisnis kuliner modern.';
      case 'restoran_asli': return 'Point of Sales (POS) handal dengan manajemen stok dan pelaporan komprehensif.';
      default: return 'Silakan isi formulir di bawah untuk memulai pendaftaran.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Package meta_data based on product
      const meta_data: Record<string, string> = {};
      if (formData.product_type === 'scanbite' || formData.product_type === 'restoran_asli') {
        meta_data.tables_count = formData.tables_count;
      } else if (formData.product_type === 'instafood') {
        meta_data.outlet_count = formData.outlet_count;
      } else if (formData.product_type === 'lms' || formData.product_type === 'siput') {
        meta_data.npsn = formData.npsn;
      }

      const { error: submitError } = await supabase
        .from('pendaftar')
        .insert([{
          full_name: formData.full_name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          business_name: formData.business_name,
          product_type: formData.product_type,
          package: formData.product_type === 'siput' ? null : (formData.package || 'standard'),
          meta_data: meta_data,
          status: 'pending'
        }]);

      if (submitError) throw submitError;

      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Gagal mengirim pendaftaran. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#151C30] border border-slate-800 rounded-[32px] p-12 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Pendaftaran Berhasil!</h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            Terima kasih telah mendaftar untuk <span className="text-white font-semibold">{getProductLabel()}</span>. Tim kami akan menghubungi Anda melalui WhatsApp dalam waktu 1x24 jam.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
          >
            Kembali ke Beranda
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Brand & Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Database className="w-4 h-4" />
            Rasyatech Cloud Ecosystem
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
            Mulai Transformasi Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Bisnis Anda</span>
          </h1>
          
          <div className="p-8 bg-[#151C30]/50 border border-slate-800 rounded-[32px] backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {formData.product_type === 'lms' && <School className="w-5 h-5 text-blue-400" />}
              {formData.product_type === 'scanbite' && <LayoutGrid className="w-5 h-5 text-emerald-400" />}
              {formData.product_type === 'instafood' && <Store className="w-5 h-5 text-orange-400" />}
              {formData.product_type === 'siput' && <Database className="w-5 h-5 text-emerald-500" />}
              {getProductLabel()}
            </h3>
            <p className="text-slate-400 italic">
              "{getProductDescription()}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Setup Cepat', desc: 'Selesai dalam < 24 jam' },
              { label: 'Bantuan 24/7', desc: 'Support teknis WhatsApp' }
            ].map((item, i) => (
              <div key={i} className="p-4 border border-slate-800 rounded-2xl bg-[#151C30]/30 transition-all hover:bg-slate-800/20 group">
                <div className="text-blue-400 font-bold mb-1 transition-colors group-hover:text-blue-300">{item.label}</div>
                <div className="text-slate-500 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-semibold group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </button>
        </motion.div>

        {/* Right Side: Registration Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#151C30] border border-slate-800 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Form Header */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Form Pendaftaran Layanan</h2>
            <p className="text-slate-500">Lengkapi data Anda untuk memproses aktivasi sistem.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">Pilih Produk Ekosistem</label>
              <div className="relative">
                <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50" />
                <select 
                  required
                  value={formData.product_type}
                  onChange={(e) => setFormData({...formData, product_type: e.target.value as any, package: ''})}
                  className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                >
                  <option value="lms">Rasya LMS (Sekolah / PKBM)</option>
                  <option value="scanbite">ScanBite (Gizi & Nutrisi Kuliner)</option>
                  <option value="restoran_asli">Restoran Asli (POS & Kasir)</option>
                  <option value="instafood">Instafood (E-Menu & Delivery)</option>
                  <option value="siput">SIPUT (Sistem Informasi Penduduk)</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="budisantoso@gmail.com"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* WhatsApp */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nomor WhatsApp</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    required
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    placeholder="0812xxxxxxx"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  {formData.product_type === 'lms' || formData.product_type === 'siput' ? 'Nama Sekolah / Instansi' : 'Nama Bisnis / Restoran'}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    required
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    placeholder={formData.product_type === 'lms' || formData.product_type === 'siput' ? 'PKBM Melati' : 'RM Padang Asli'}
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Package Section (Culinary only) */}
            <AnimatePresence mode="wait">
              {isCulinary && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-emerald-400 uppercase tracking-widest px-1">Pilihan Paket Bisnis</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                    <select 
                      required
                      value={formData.package}
                      onChange={(e) => setFormData({...formData, package: e.target.value})}
                      className="w-full bg-[#0A0F1E] border border-emerald-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                    >
                      <option value="">-- Pilih Paket Bisnis --</option>
                      <option value="silver">Silver (Basic Tools)</option>
                      <option value="gold">Gold (Advanced Reporting)</option>
                      <option value="platinum">Platinum (Enterprise / Multi-Outlet)</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dynamic Fields Section */}
            <AnimatePresence mode="wait">
              {(formData.product_type === 'scanbite' || formData.product_type === 'restoran_asli') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">Estimasi Jumlah Meja / Spot</label>
                  <div className="relative">
                    <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50" />
                    <input 
                      required
                      type="number"
                      value={formData.tables_count}
                      onChange={(e) => setFormData({...formData, tables_count: e.target.value})}
                      placeholder="Contoh: 25"
                      className="w-full bg-[#0A0F1E] border border-blue-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </motion.div>
              )}

              {formData.product_type === 'instafood' && (
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="space-y-2"
                >
                  <label className="block text-xs font-black text-orange-400 uppercase tracking-widest px-1">Jumlah Outlet / Kurir Internal</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/50" />
                    <input 
                      required
                      type="number"
                      value={formData.outlet_count}
                      onChange={(e) => setFormData({...formData, outlet_count: e.target.value})}
                      placeholder="Contoh: 5"
                      className="w-full bg-[#0A0F1E] border border-orange-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </motion.div>
              )}

              {(formData.product_type === 'lms' || formData.product_type === 'siput') && (
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="space-y-2"
                >
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">NPSN Sekolah / Kode Instansi (Jika Ada)</label>
                  <div className="relative">
                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50" />
                    <input 
                      type="text"
                      value={formData.npsn}
                      onChange={(e) => setFormData({...formData, npsn: e.target.value})}
                      placeholder="Contoh: 201020xx"
                      className="w-full bg-[#0A0F1E] border border-blue-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button 
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Kirim Pendaftaran
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-slate-600 text-xs px-4">
              Dengan mendaftar, Anda menyetujui bahwa data yang diberikan akan disimpan secara aman dan digunakan untuk keperluan aktivasi layanan Rasyatech.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
