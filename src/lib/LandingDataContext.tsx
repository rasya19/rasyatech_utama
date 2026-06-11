import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

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
  registrations: any[]; // Mengganti laptops, products, services
  loading: boolean;
  error: string | null;
}

const LandingDataContext = createContext<LandingDataContextType | undefined>(undefined);

export function LandingDataProvider({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    let isMounted = true;

    const fetchLandingData = async () => {
      try {
        setLoading(true);

        // Hanya memanggil tabel yang ada
        const [settingsRes, regRes] = await Promise.all([
          supabase.from('settings').select('*'),
          supabase.from('registrations').select('*')
        ]);

        if (!isMounted) return;

        if (settingsRes.data) {
          // Ubah bagian ini:
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
        if (isMounted) setError(err.message || 'Gagal memuat data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLandingData();
    return () => { isMounted = false; };
  }, []);

  return (
    <LandingDataContext.Provider value={{ config, payments, registrations, loading, error }}>
      {children}
    </LandingDataContext.Provider>
  );
}

export function useLandingData() {
  const context = useContext(LandingDataContext);
  if (context === undefined) {
    throw new Error('useLandingData must be used within a LandingDataProvider');
  }
  return context;
}