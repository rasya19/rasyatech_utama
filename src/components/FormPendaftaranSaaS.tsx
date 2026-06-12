<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseKuliner } from '../lib/supabase-kuliner';
import {
  SAAS_PRODUCTS,
  getSaasProductLabel,
  getSaasProductPortalUrl,
  isCulinaryProduct,
  isSchoolProduct,
  type SaasProductId,
} from '../lib/saas-products';
import {
  generateSubdomainFromTenantName,
  formatTenantHost,
  checkSubdomainAvailability,
  validateSubdomain,
} from '../lib/subdomain-utils';
import {
  submitTenantRegistration,
  notifyRegistrationWebhook,
} from '../lib/tenant-registration';
import {
  Building2,
  Mail,
  MessageSquare,
  User,
  ArrowRight,
  CheckCircle2,
=======
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Pastikan import motion dari 'framer-motion'
import { supabase } from '../lib/supabase';
import { supabaseKuliner } from '../lib/supabase-kuliner';
import { 
  Building2, 
  Mail, 
  MessageSquare, 
  User, 
  ArrowRight, 
  CheckCircle2, 
>>>>>>> origin/main
  AlertCircle,
  Loader2,
  ChevronLeft,
  Store,
  LayoutGrid,
  School,
<<<<<<< HEAD
  Database,
  Globe,
  Link2,
} from 'lucide-react';

const VALID_PRODUCTS = SAAS_PRODUCTS.map((p) => p.id);
=======
  Database
} from 'lucide-react';

type ProductType = 'lms' | 'scanbite' | 'siput' | 'Instafood' | 'restoran_asli';
>>>>>>> origin/main

export default function FormPendaftaranSaaS() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(6);
<<<<<<< HEAD
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [registeredSubdomain, setRegisteredSubdomain] = useState('');
  const [registeredTenantUrl, setRegisteredTenantUrl] = useState('');

  const productParam = searchParams.get('product') as SaasProductId;
  const currentProduct: SaasProductId = VALID_PRODUCTS.includes(productParam)
    ? productParam
=======

  // Determine current product from URL
  const productParam = searchParams.get('product') as ProductType;
  const currentProduct: ProductType = ['scanbite', 'lms', 'siput', 'Instafood', 'restoran_asli'].includes(productParam) 
    ? productParam 
>>>>>>> origin/main
    : 'lms';

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
<<<<<<< HEAD
    tenant_name: '',
    product_app: currentProduct,
    subdomain: '',
    package: '',
    tables_count: '',
    outlet_count: '',
    npsn: '',
  });

  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = getSaasProductPortalUrl(formData.product_app);
=======
    business_name: '',
    product_type: currentProduct,
    package: '',
    // Dynamic fields
    tables_count: '',
    outlet_count: '',
    npsn: '',
    // Tambahin 4 ini buat API register
    school_name: '',
    subdomain: '',
    admin_email: '',
    password: ''
  });

  const getProductRedirectDetails = (type: string) => {
    switch (type) {
      case 'lms': 
        return { name: 'Rasya LMS Kesetaraan', url: 'https://kesetaraan.rasyatech.com' };
      case 'siput': 
        return { name: 'SIPUT ', url: 'https://siput.rasyatech.com' };
      case 'scanbite': 
        return { name: 'ScanBite (Cafe & Barista)', url: 'https://scanbite.rasyatech.com' };
      case 'restoran_asli': 
        return { name: 'Restoran Asli POS & Kasir', url: 'https://restoran.rasyatech.com' };
      case 'instafood': 
        return { name: 'Instafood E-Menu & Delivery', url: 'https://Instafood.rasyatech.com' };
      default: 
        return { name: 'Layanan Rasyatech', url: '/' };
    }
  };

  useEffect(() => {
    if (!submitted) return;
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const redirectDetails = getProductRedirectDetails(formData.product_type);
          window.location.href = redirectDetails.url;
>>>>>>> origin/main
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
<<<<<<< HEAD

    return () => clearInterval(interval);
  }, [submitted, formData.product_app]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, product_app: currentProduct }));
  }, [currentProduct]);

  // Auto-generate subdomain dari nama tenant (jika belum diedit manual)
  useEffect(() => {
    if (subdomainTouched) return;
    const generated = generateSubdomainFromTenantName(formData.tenant_name);
    if (generated) {
      setFormData((prev) => ({ ...prev, subdomain: generated }));
    }
  }, [formData.tenant_name, subdomainTouched]);

  const runSubdomainCheck = useCallback(async (subdomain: string) => {
    const validationError = validateSubdomain(subdomain);
    if (validationError || !subdomain) {
      setSubdomainStatus(validationError ? 'invalid' : 'idle');
      return;
    }

    setSubdomainStatus('checking');
    const result = await checkSubdomainAvailability(subdomain);
    setSubdomainStatus(result.available ? 'available' : 'taken');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.subdomain) {
        runSubdomainCheck(formData.subdomain);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.subdomain, runSubdomainCheck]);

  const getProductDescription = (type: string = formData.product_app) => {
    const product = SAAS_PRODUCTS.find((p) => p.id === type);
    return product?.description ?? 'Silakan isi formulir di bawah untuk memulai pendaftaran.';
=======
    
    return () => clearInterval(interval);
  }, [submitted, formData.product_type]);

  // Keep business_name synchronized if it's LMS/SIPUT
  useEffect(() => {
    setFormData(prev => ({ ...prev, product_type: currentProduct }));
  }, [currentProduct]);

  const isCulinary = ['scanbite', 'restoran_asli', 'Instafood'].includes(formData.product_type);

  const getProductLabel = (type: string = formData.product_type) => {
    switch (type) {
      case 'scanbite': return 'ScanBite (Cafe & Barista)';
      case 'lms': return 'Rasya LMS PKBM';
      case 'siput': return 'SIPUT (Sistem Informasi PAUD Terpadu)';
      case 'Instafood': return 'Instafood (E-Menu & Delivery)';
      case 'restoran_asli': return 'Restoran Asli (POS & Kasir)';
      default: return 'Layanan Rasyatech';
    }
  };

  const getProductDescription = (type: string = formData.product_type) => {
    switch (type) {
      case 'scanbite': return 'Solusi pemindaian menu makanan cerdas untuk efisiensi operasional cafe.';
      case 'lms': return 'Learning Management System terpadu untuk PKBM, LKP, dan Satuan Pendidikan Non-Formal.';
      case 'siput': return 'Aplikasi manajemen data murid, guru, dan kelas untuk PAUD/TK';
      case 'Instafood': return 'Manajemen menu digital dan integrasi kurir internal untuk bisnis kuliner modern.';
      case 'restoran_asli': return 'Point of Sales (POS) handal dengan manajemen stok dan pelaporan komprehensif.';
      default: return 'Silakan isi formulir di bawah untuk memulai pendaftaran.';
    }
>>>>>>> origin/main
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
<<<<<<< HEAD
      if (subdomainStatus === 'taken' || subdomainStatus === 'invalid') {
        throw new Error('Subdomain tidak valid atau sudah digunakan.');
      }

      const meta_data: Record<string, string> = {};
      if (formData.product_app === 'scanbite' || formData.product_app === 'restoran_asli') {
        meta_data.tables_count = formData.tables_count;
      } else if (formData.product_app === 'Instafood') {
        meta_data.outlet_count = formData.outlet_count;
      } else if (isSchoolProduct(formData.product_app)) {
        meta_data.npsn = formData.npsn;
      }

      await notifyRegistrationWebhook({ ...formData, meta_data });

      const result = await submitTenantRegistration({
        tenant_name: formData.tenant_name,
        product_app: formData.product_app,
        subdomain: formData.subdomain,
=======
      // 1. Logic meta_data
      const meta_data: Record<string, string> = {};
      if (formData.product_type === 'scanbite' || formData.product_type === 'restoran_asli') {
        meta_data.tables_count = formData.tables_count;
      } else if (formData.product_type === 'Instafood') {
        meta_data.outlet_count = formData.outlet_count;
      } else if (formData.product_type === 'lms' || formData.product_type === 'siput') {
        meta_data.npsn = formData.npsn;
      }

      const isLms = formData.product_type === 'lms';

      // 2. Webhook
      try {
        await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_name: formData.school_name,
            subdomain: formData.subdomain,
            admin_email: formData.admin_email,
            password: formData.password
          }),
        });
      } catch (webhookErr) {
        console.error('Webhook gagal:', webhookErr);
      }

      // 3. Supabase Logic
      const lmsInsertData = {
        school_name: formData.business_name,
>>>>>>> origin/main
        admin_name: formData.full_name,
        admin_email: formData.email,
        whatsapp: formData.whatsapp,
        npsn: formData.npsn || '-',
<<<<<<< HEAD
        package_tier:
          formData.product_app === 'lms' || formData.product_app === 'armilla'
            ? formData.package || 'silver'
            : formData.package || 'standard',
        meta_data,
      });

      setRegisteredSubdomain(result.subdomain);
      setRegisteredTenantUrl(result.tenant_url);

      // Sinkron ke Supabase Kuliner untuk produk bisnis (opsional, jika env dikonfigurasi)
      if (isCulinaryProduct(formData.product_app) || formData.product_app === 'siput') {
        const kulinerType =
          formData.product_app === 'siput' ? 'siput' : formData.product_app;
        try {
          const { error: culinaryError } = await supabaseKuliner.from('registrations').insert([
            {
              full_name: formData.full_name,
              email: formData.email,
              whatsapp_number: formData.whatsapp,
              business_type: kulinerType,
              business_name: formData.tenant_name,
              selected_package:
                formData.product_app === 'siput' ? null : formData.package || 'standard',
              table_count: parseInt(formData.tables_count || formData.outlet_count || '0', 10),
              status: 'pending',
              subdomain: result.subdomain,
            },
          ]);
          if (culinaryError) {
            console.warn('Supabase Kuliner sync skipped:', culinaryError.message);
          }
        } catch (kulinerErr) {
          console.warn('Supabase Kuliner not configured:', kulinerErr);
        }
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim pendaftaran.';
      setError(message);
=======
        subdomain: formData.business_name.toLowerCase().replace(/[^a-z0-9]/g, '') || '-',
        password: 'defaultpassword123',
        status: 'pending',
        is_approved: false,
        paket_langganan: formData.product_type === 'lms' ? (formData.package || 'silver') : (formData.package || 'standard')
      };

      const { error: lmsError } = await supabase.from('registrations').insert([lmsInsertData]);
      if (lmsError && isLms) throw lmsError;

      if (!isLms) {
        const culinaryInsertData = {
          full_name: formData.full_name,
          email: formData.email,
          whatsapp_number: formData.whatsapp,
          business_type: formData.product_type,
          business_name: formData.business_name,
          selected_package: formData.product_type === 'siput' ? null : (formData.package || 'standard'),
          table_count: parseInt(formData.tables_count || formData.outlet_count || '0'),
          status: 'pending'
        };
        const { error: culinaryError } = await supabaseKuliner.from('registrations').insert([culinaryInsertData]);
        if (culinaryError) throw culinaryError;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Gagal mengirim pendaftaran. Silakan coba lagi.');
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  if (submitted) {
    const redirectUrl = getSaasProductPortalUrl(formData.product_app);
    const redirectName = getSaasProductLabel(formData.product_app);

    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6 selection:bg-blue-500/30">
        <motion.div
=======
  // --- EARLY RETURN UNTUK TAMPILAN SUKSES ---
  if (submitted) {
    const redirectDetails = getProductRedirectDetails(formData.product_type);
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-6 selection:bg-blue-500/30">
        <motion.div 
>>>>>>> origin/main
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-[#151C30] border border-slate-800 rounded-[32px] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
        >
<<<<<<< HEAD
=======
          {/* Flame effect */}
>>>>>>> origin/main
          <div className="absolute top-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none animate-pulse" />
          <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none animate-pulse" />

          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
<<<<<<< HEAD

          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Pendaftaran Sukses!</h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            Gerbang Pendaftaran Rasyatech
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Data tenant <span className="text-white font-bold">{formData.tenant_name}</span> telah
            disimpan ke tabel master Supabase untuk{' '}
            <span className="text-white font-bold">{getSaasProductLabel(formData.product_app)}</span>.
          </p>

          {(registeredSubdomain || registeredTenantUrl) && (
            <div className="p-4 bg-slate-900/60 border border-emerald-500/20 rounded-2xl mb-6 text-left">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Globe className="w-4 h-4" />
                Subdomain Tenant Anda
              </div>
              <p className="text-white font-mono text-sm font-bold">
                {registeredTenantUrl || `https://${formatTenantHost(registeredSubdomain)}`}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Subdomain unik: <span className="text-slate-300">{registeredSubdomain}</span>
              </p>
            </div>
          )}

          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl mb-8 flex flex-col items-center justify-center gap-1.5">
            <p className="text-xs text-slate-400">
              Mengarahkan Anda ke portal <span className="text-blue-400 font-bold">{redirectName}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <p className="text-sm text-white font-extrabold font-mono">dalam {countdown} detik...</p>
=======
          
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Pendaftaran Sukses!</h2>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
            Rasyatech Ecosystem Gateway
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Terima kasih telah mendaftar untuk layanan <span className="text-white font-bold">{getProductLabel()}</span>.<br />
            Tim support Rasyatech akan menghubungi Anda via WhatsApp dalam waktu 1x24 jam untuk verifikasi detail akun.
          </p>

          {/* Redirection indicator */}
          <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl mb-8 flex flex-col items-center justify-center gap-1.5">
            <p className="text-xs text-slate-400">
              Mengarahkan Anda ke portal <span className="text-blue-400 font-bold">{redirectDetails.name}</span> secara automatis
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <p className="text-sm text-white font-extrabold font-mono">
                dalam {countdown} detik...
              </p>
>>>>>>> origin/main
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
<<<<<<< HEAD
            <button
              onClick={() => {
                window.location.href = redirectUrl;
              }}
=======
            <button 
              onClick={() => { window.location.href = redirectDetails.url; }}
>>>>>>> origin/main
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] text-sm"
            >
              Lanjutkan Sekarang
            </button>
<<<<<<< HEAD
            <button
              onClick={() => navigate('/')}
              className="py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all text-sm"
=======
            <button 
              onClick={() => navigate('/')}
              className="py-4 px-6 bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold rounded-2xl transition-all text-sm"
>>>>>>> origin/main
            >
              Kembali ke Beranda
            </button>
          </div>
<<<<<<< HEAD
=======

          {/* Powered by Rasyatech Ads Block */}
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
>>>>>>> origin/main
        </motion.div>
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans selection:bg-blue-500/30">
=======
  // --- RETURN UTAMA UNTUK TAMPILAN FORM ---
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Decorative background elements */}
>>>>>>> origin/main
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-16 items-center">
<<<<<<< HEAD
        <motion.div
=======
        {/* Left Side: Brand & Product Info */}
        <motion.div 
>>>>>>> origin/main
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Database className="w-4 h-4" />
<<<<<<< HEAD
            Gerbang Pendaftaran Rasyatech
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
            Daftar Tenant{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              5 Pilar SaaS
            </span>
          </h1>

          <div className="p-8 bg-[#151C30]/50 border border-slate-800 rounded-[32px] backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {isSchoolProduct(formData.product_app) ? (
                <School className="w-5 h-5 text-blue-400" />
              ) : (
                <Store className="w-5 h-5 text-emerald-400" />
              )}
              {getSaasProductLabel(formData.product_app)}
            </h3>
            <p className="text-slate-400 italic">&quot;{getProductDescription()}&quot;</p>
          </div>

          <button
=======
            Rasyatech Cloud Ecosystem
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight">
            Mulai Transformasi Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Bisnis Anda</span>
          </h1>
          
          <div className="p-8 bg-[#151C30]/50 border border-slate-800 rounded-[32px] backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {formData.product_type === 'lms' && <School className="w-5 h-5 text-blue-400" />}
              {formData.product_type === 'scanbite' && <LayoutGrid className="w-5 h-5 text-emerald-400" />}
              {formData.product_type === 'Instafood' && <Store className="w-5 h-5 text-orange-400" />}
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
>>>>>>> origin/main
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-semibold group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </button>
        </motion.div>

<<<<<<< HEAD
        <motion.div
=======
        {/* Right Side: Registration Form */}
        <motion.div 
>>>>>>> origin/main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#151C30] border border-slate-800 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden"
        >
<<<<<<< HEAD
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Form Pendaftaran Tenant</h2>
            <p className="text-slate-500">
              Nama sekolah/tenant, pilihan aplikasi, dan subdomain unik disimpan ke Supabase master.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pilihan Aplikasi */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">
                Pilihan Aplikasi
              </label>
              <div className="relative">
                <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500/50" />
                <select
                  required
                  value={formData.product_app}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      product_app: e.target.value as SaasProductId,
                      package: '',
                    })
                  }
                  className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                >
                  {SAAS_PRODUCTS.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
=======
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
                  <option value="scanbite">ScanBite (Cafe & Barista)</option>
                  <option value="restoran_asli">Restoran Asli (POS & Kasir)</option>
                  <option value="Instafood">Instafood (E-Menu & Delivery)</option>
                  <option value="siput">SIPUT (Sistem Informasi PAUD Terpadu)</option>
>>>>>>> origin/main
                </select>
              </div>
            </div>

<<<<<<< HEAD
            {/* Nama Sekolah / Tenant */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                Nama Sekolah / Tenant
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  required
                  type="text"
                  value={formData.tenant_name}
                  onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                  placeholder={
                    isSchoolProduct(formData.product_app)
                      ? 'Contoh: PKBM Armilla Nusa'
                      : 'Contoh: RM Padang Asli'
                  }
                  className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                />
              </div>
            </div>

            {/* Subdomain unik */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-emerald-400 uppercase tracking-widest px-1">
                Subdomain Unik Tenant
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                <input
                  required
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => {
                    setSubdomainTouched(true);
                    setFormData({
                      ...formData,
                      subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    });
                  }}
                  placeholder="armillanusa"
                  className="w-full bg-[#0A0F1E] border border-emerald-500/20 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-xs text-slate-500">
                  Preview:{' '}
                  <span className="text-emerald-400 font-mono">
                    {formData.subdomain
                      ? formatTenantHost(formData.subdomain)
                      : 'subdomain.rsch.my.id'}
                  </span>
                </p>
                {subdomainStatus === 'checking' && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Memeriksa...
                  </span>
                )}
                {subdomainStatus === 'available' && (
                  <span className="text-xs text-emerald-400 font-bold">Subdomain tersedia</span>
                )}
                {subdomainStatus === 'taken' && (
                  <span className="text-xs text-rose-400 font-bold">Sudah digunakan</span>
                )}
                {subdomainStatus === 'invalid' && (
                  <span className="text-xs text-rose-400 font-bold">Format tidak valid</span>
                )}
=======
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
>>>>>>> origin/main
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
<<<<<<< HEAD
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  Nama Lengkap Admin
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Budi Santoso"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@sekolah.sch.id"
                    className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
=======
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
>>>>>>> origin/main
                  />
                </div>
              </div>
            </div>

<<<<<<< HEAD
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  required
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="0812xxxxxxx"
                  className="w-full bg-[#0A0F1E] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isCulinaryProduct(formData.product_app) && (
                <motion.div
=======
            {/* Dynamic Package Section (Culinary only) */}
            <AnimatePresence mode="wait">
              {isCulinary && (
                <motion.div 
>>>>>>> origin/main
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
<<<<<<< HEAD
                  <label className="block text-xs font-black text-emerald-400 uppercase tracking-widest px-1">
                    Pilihan Paket Bisnis
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                    <select
                      required
                      value={formData.package}
                      onChange={(e) => setFormData({ ...formData, package: e.target.value })}
=======
                  <label className="block text-xs font-black text-emerald-400 uppercase tracking-widest px-1">Pilihan Paket Bisnis</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                    <select 
                      required
                      value={formData.package}
                      onChange={(e) => setFormData({...formData, package: e.target.value})}
>>>>>>> origin/main
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

<<<<<<< HEAD
            <AnimatePresence mode="wait">
              {(formData.product_app === 'scanbite' ||
                formData.product_app === 'restoran_asli') && (
                <motion.div
=======
            {/* Dynamic Fields Section */}
            <AnimatePresence mode="wait">
              {(formData.product_type === 'scanbite' || formData.product_type === 'restoran_asli') && (
                <motion.div 
>>>>>>> origin/main
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
<<<<<<< HEAD
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">
                    Estimasi Jumlah Meja / Spot
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.tables_count}
                    onChange={(e) => setFormData({ ...formData, tables_count: e.target.value })}
                    placeholder="25"
                    className="w-full bg-[#0A0F1E] border border-blue-500/20 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </motion.div>
              )}

              {formData.product_app === 'Instafood' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-orange-400 uppercase tracking-widest px-1">
                    Jumlah Outlet / Kurir Internal
                  </label>
                  <input
                    required
                    type="number"
                    value={formData.outlet_count}
                    onChange={(e) => setFormData({ ...formData, outlet_count: e.target.value })}
                    placeholder="5"
                    className="w-full bg-[#0A0F1E] border border-orange-500/20 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </motion.div>
              )}

              {isSchoolProduct(formData.product_app) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="block text-xs font-black text-blue-400 uppercase tracking-widest px-1">
                    NPSN / Kode Instansi (opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.npsn}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                    placeholder="201020xx"
                    className="w-full bg-[#0A0F1E] border border-blue-500/20 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
=======
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

              {formData.product_type === 'Instafood' && (
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
>>>>>>> origin/main
                </motion.div>
              )}
            </AnimatePresence>

<<<<<<< HEAD
            {error && (
              <motion.div
=======
            {/* Error Message */}
            {error && (
              <motion.div 
>>>>>>> origin/main
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

<<<<<<< HEAD
            <button
              disabled={loading || subdomainStatus === 'taken' || subdomainStatus === 'checking'}
=======
            {/* Submit Button */}
            <button 
              disabled={loading}
>>>>>>> origin/main
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
<<<<<<< HEAD
                  Menyimpan ke Supabase...
                </>
              ) : (
                <>
                  Daftar Tenant
=======
                  Memproses...
                </>
              ) : (
                <>
                  Kirim Pendaftaran
>>>>>>> origin/main
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-slate-600 text-xs px-4">
<<<<<<< HEAD
              Data disimpan ke tabel <span className="text-slate-400">tenant_master</span> dan{' '}
              <span className="text-slate-400">registrations</span> via API server aman.
=======
              Dengan mendaftar, Anda menyetujui bahwa data yang diberikan akan disimpan secara aman dan digunakan untuk keperluan aktivasi layanan Rasyatech.
>>>>>>> origin/main
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
