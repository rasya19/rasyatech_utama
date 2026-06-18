import { sendWhatsAppNotification } from '../lib/notifications';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { supabaseKuliner } from '../lib/supabase-kuliner';
import { DEFAULT_PACKAGE_TIER, logSupabaseInsertError } from '../lib/tenant-insert-utils';
import {
  SAAS_PRODUCT_OPTIONS,
  normalizeProductParam,
  toProductApp,
  isMainDbProduct,
  isKulinerDbProduct,
  resolvePackageTierForProduct,
  getProductRedirectDomain,
  type SaasProductType,
} from '../lib/saas-product-options';
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
  LayoutGrid,
  School,
  Database,
  Store,
} from 'lucide-react';

// Helper: generate subdomain dari business_name
const generateSubdomain = (businessName: string) => {
  return businessName
    .toLowerCase()
    .replace(/\s+/g, '-')          // spasi → strip
    .replace(/[^a-z0-9\-]/g, '');  // hapus karakter aneh
};

export default function FormPendaftaranSaaS() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(6);

  const productParam = searchParams.get('product');
  const currentProduct = normalizeProductParam(productParam);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    business_name: '',
    product_type: currentProduct,
    package: '',
    tables_count: '',
    outlet_count: '',
    npsn: '',
    school_name: '',
  });

  const getProductRedirectDetails = (type: SaasProductType, businessName: string) => {
    const slug = generateSubdomain(businessName);
    const baseDomain = getProductRedirectDomain(type);
    return {
      name: getProductLabel(type),
      url: `https://${slug}.${baseDomain}`,
    };
  };

  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const redirectDetails = getProductRedirectDetails(formData.product_type, formData.business_name);
          window.location.href = redirectDetails.url;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, formData.product_type, formData.business_name]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, product_type: currentProduct }));
  }, [currentProduct]);

  const productType = formData.product_type as SaasProductType;
  const isLms = productType === 'lms';
  const isSchoolProduct = isMainDbProduct(productType);
  const isCulinary = isKulinerDbProduct(productType);
  const needsTablesCount = productType === 'scanbite' || productType === 'resto';
  const needsOutletCount = productType === 'instafood';

  const getProductLabel = (type: SaasProductType = productType) => {
    return SAAS_PRODUCT_OPTIONS.find((o) => o.value === type)?.label ?? 'Layanan Rasyatech';
  };

  const getProductDescription = (type: SaasProductType = productType) => {
    switch (type) {
      case 'lms':
        return 'Learning Management System terpadu untuk PKBM, LKP, dan Satuan Pendidikan Non-Formal.';
      case 'siput':
        return 'Aplikasi manajemen data murid, guru, dan kelas untuk PAUD/TK.';
      case 'scanbite':
        return 'Solusi pemindaian menu makanan cerdas untuk efisiensi operasional cafe.';
      case 'resto':
        return 'Point of Sales (POS) handal dengan manajemen stok dan pelaporan komprehensif.';
      case 'instafood':
        return 'Manajemen menu digital dan integrasi kurir internal untuk bisnis kuliner modern.';
      default:
        return 'Silakan isi formulir di bawah untuk memulai pendaftaran.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let submittedPayload: Record<string, unknown> = {};

    try {
      if (isLms && !formData.package.trim()) {
        throw new Error('Paket langganan wajib dipilih untuk produk LMS.');
      }

      const packageTier = resolvePackageTierForProduct(
        productType,
        formData.package,
        DEFAULT_PACKAGE_TIER
      );
      const subdomain = generateSubdomain(formData.business_name);
      const tenantName = formData.business_name.trim();
      const productApp = toProductApp(productType);

      const baseData = {
        full_name: formData.full_name,
        email: formData.email,
        whatsapp_number: formData.whatsapp,
        whatsapp: formData.whatsapp,
        business_name: tenantName,
        school_name: tenantName,
        tenant_name: tenantName,
        product_type: productApp,
        product_app: productApp,
        subdomain,
        npsn: formData.npsn.trim() || '-',
        package_tier: packageTier,
        paket_langganan: packageTier,
        source: 'gerbang_pendaftaran',
        status: 'pending',
        tenant: productType,
      };

      if (isSchoolProduct) {
        submittedPayload = { ...baseData };
        const { error: schoolError } = await supabase
          .from('registrations')
          .insert([submittedPayload]);
        if (schoolError) throw schoolError;
      } else {
        submittedPayload = {
          ...baseData,
          business_type: productApp,
          selected_package: packageTier,
          table_count: parseInt(formData.tables_count || '0', 10) || 0,
          outlet_count: parseInt(formData.outlet_count || '0', 10) || 0,
        };
        const { error: culinaryError } = await supabaseKuliner
          .from('registrations')
          .insert([submittedPayload]);
        if (culinaryError) throw culinaryError;
      }

      try {
        await sendWhatsAppNotification(formData);
      } catch (waErr) {
        console.error('Gagal kirim WA:', waErr);
      }

      setSubmitted(true);
      alert('Pendaftaran berhasil!');

    } catch (err: unknown) {
      logSupabaseInsertError('FormPendaftaranSaaS.handleSubmit', err, submittedPayload);
      const message =
        err instanceof Error ? err.message : 'Gagal mengirim pendaftaran. Silakan coba lagi.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- TAMPILAN SUKSES ---
  if (submitted) {
    const redirectDetails = getProductRedirectDetails(formData.product_type, formData.business_name);
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6 selection:bg-blue-500/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-[#151C30] border border-slate-800 rounded-[32px] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none animate-pulse" />
          <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none animate-pulse" />

          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Pendaftaran Sukses!</h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            Rasyatech Ecosystem Gateway
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Terima kasih telah mendaftar untuk layanan <span className="text-white font-bold">{getProductLabel()}</span>.<br />
            Tim support Rasyatech akan menghubungi Anda via WhatsApp dalam waktu 1x24 jam untuk verifikasi detail akun.
          </p>

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl mb-8 flex flex-col items-center justify-center gap-1.5">
            <p className="text-xs text-slate-400">
              Mengarahkan Anda ke portal <span className="text-blue-400 font-bold">{redirectDetails.name}</span> secara automatis
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <p className="text-sm text-white font-extrabold font-mono">
                dalam {countdown} detik...
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { window.location.href = redirectDetails.url; }}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] text-sm"
            >
              Lanjutkan Sekarang
            </button>
            <button
              onClick={() => navigate('/')}
              className="py-4 px-6 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold rounded-2xl transition-all text-sm"
            >
              Kembali ke Beranda
            </button>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-br from-blue-950/40 to-slate-900/80 border border-blue-500/20 rounded-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 mb-3 border border-blue-500/30 tracking-wider">
              POWERED BY RASYATECH 🔥
            </span>
            <h4 className="text-white font-bold text-sm mb-1">Butuh Digitalisasi Sekolah atau UMKM?</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Rasyatech Cloud menyediakan layanan LMS, POS Kasir, dan Sistem Informasi PAUD Terpadu dengan infrastruktur server awan handal. Selesai cepat & support WhatsApp 24/7.
            </p>
            <div className="text-[9px] font-extrabold text-blue-400/90 tracking-widest uppercase flex justify-between items-center">
              <span>Rasyatech Core Cloud Hosting</span>
              <span>Kuningan, Jawa Barat</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- FORM UTAMA ---
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans selection:bg-blue-500/30">
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
              {productType === 'lms' && <School className="w-5 h-5 text-blue-400" />}
              {(productType === 'scanbite' || productType === 'resto') && (
                <LayoutGrid className="w-5 h-5 text-emerald-400" />
              )}
              {productType === 'instafood' && <Store className="w-5 h-5 text-orange-400" />}
              {productType === 'siput' && <Database className="w-5 h-5 text-emerald-500" />}
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      product_type: e.target.value as SaasProductType,
                      package: '',
                    })
                  }
                  className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                >
                  {SAAS_PRODUCT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="budisantoso@gmail.com"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nomor WhatsApp</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    required
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="0812xxxxxxx"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  {isSchoolProduct ? 'Nama Sekolah / Instansi' : 'Nama Bisnis / Restoran'}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    required
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder={isSchoolProduct ? 'PKBM Melati' : 'RM Padang Asli'}
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLms && (
                <motion.div
                  key="lms-package"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">
                    Paket Langganan LMS <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    className="w-full bg-[#0A0F1E] border border-blue-500/20 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                  >
                    <option value="">-- Pilih Paket LMS --</option>
                    <option value="basic">Basic</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </motion.div>
              )}

              {!isLms && (
                <motion.p
                  key="free-tier-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-slate-500 px-1"
                >
                  Paket untuk {getProductLabel()}: <span className="text-emerald-400 font-bold">FREE</span>{' '}
                  (otomatis)
                </motion.p>
              )}

              {needsTablesCount && (
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
                      onChange={(e) => setFormData({ ...formData, tables_count: e.target.value })}
                      placeholder="Contoh: 25"
                      className="w-full bg-[#0A0F1E] border border-blue-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </motion.div>
              )}

              {needsOutletCount && (
                <motion.div
                  key="outlet-count"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-orange-400 uppercase tracking-widest px-1">
                    Jumlah Outlet / Kurir Internal
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/50" />
                    <input
                      required
                      type="number"
                      value={formData.outlet_count}
                      onChange={(e) => setFormData({ ...formData, outlet_count: e.target.value })}
                      placeholder="Contoh: 5"
                      className="w-full bg-[#0A0F1E] border border-orange-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </motion.div>
              )}

              {isSchoolProduct && (
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
                      onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
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
