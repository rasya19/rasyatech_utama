import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

// 1. Interface
interface LandingDataContextType {
  config: {
    whatsapp: string;
    address: string;
    heroTitle: string;
    heroSubtitle: string;
  };
  payments: {
    bankBcaProvider: string;
    bankBca: string;
    bankMandiriProvider: string;
    bankMandiri: string;
    eWallet: string;
    bankBcaName: string;
    bankMandiriName: string;
    eWalletName: string;
  };
  registrations: any[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

// 2. Buat Context
const LandingDataContext = createContext<LandingDataContextType | undefined>(undefined);

// 3. Provider Component (Tadi namanya keseleo di sini)
export const LandingDataProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState({
    whatsapp: '6281918226387',
    address: 'Mekarwangi, Kuningan - Jawa Barat',
    heroTitle: 'Transformasi Digital Masa Depan',
    heroSubtitle: 'Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan.'
  });

  const [payments, setPayments] = useState({
    bankBcaProvider: 'BCA',
    bankBca: '1234567890',
    bankMandiriProvider: 'Mandiri',
    bankMandiri: '0987654321',
    eWallet: '081918226387',
    bankBcaName: 'PT Rasyatech Digital',
    bankMandiriName: 'PT Rasyatech Digital',
    eWalletName: 'Admin Rasyatech'
  });

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk menarik ulang data (tanpa perlu reload halaman manual)
  const fetchLandingData = async () => {
    try {
      setLoading(true);

      const [settingsRes, regRes] = await Promise.all([
        supabase.from('settings').select('*'),
        supabase.from('registrations').select('*')
      ]);

      if (settingsRes.data) {
        const configRow = settingsRes.data.find((s: any) => s.id === 'config');
        const paymentsRow = settingsRes.data.find((s: any) => s.id === 'payments');
        if (configRow) setConfig(prev => ({ ...prev, ...configRow }));
        if (paymentsRow) setPayments(prev => ({ ...prev, ...paymentsRow }));
      }

      if (regRes.data) {
        setRegistrations(regRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  return (
    <LandingDataContext.Provider 
      value={{ 
        config, 
        payments, 
        registrations, 
        loading, 
        error, 
        fetchData: fetchLandingData // Kita pakai fungsi aslinya biar halus tanpa kedip
      }}
    >
      {children}
    </LandingDataContext.Provider>
  );
};

// 4. Custom Hook dengan PWA Fallback (Anti Layar Putih)
export const useLandingData = () => {
  const context = useContext(LandingDataContext);
  
  // Jika dipanggil di luar provider (misal pas admin baru buka tab), kasih data darurat
  if (!context) {
    return {
      config: {
        whatsapp: '6281918226387',
        address: 'Mekarwangi, Kuningan - Jawa Barat',
        heroTitle: 'Transformasi Digital Masa Depan',
        heroSubtitle: 'Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan.'
      },
      payments: {
        bankBcaProvider: 'BCA',
        bankBca: '1234567890',
        bankMandiriProvider: 'Mandiri',
        bankMandiri: '0987654321',
        eWallet: '081918226387',
        bankBcaName: 'PT Rasyatech Digital',
        bankMandiriName: 'PT Rasyatech Digital',
        eWalletName: 'Admin Rasyatech'
      },
      registrations: [], // <-- PENGAMAN UTAMA .map() ADA DI SINI
      loading: false,
      error: null,
      fetchData: async () => {}
    };
  }
  return context;
};