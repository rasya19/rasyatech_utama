import React, { createContext, useContext, useState, useEffect } from 'react';

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
  laptops: any[];
  products: any[];
  affiliates: any[];
  services: any[];
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

  const [laptops, setLaptops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Standard robust single fetch for data optimization
    const fetchLandingData = async () => {
      try {
        setLoading(true);

        const [
          configRes,
          paymentsRes,
          affiliatesRes,
          servicesRes,
          laptopsRes,
          productsRes
        ] = await Promise.all([
          fetch('/api/settings/config'),
          fetch('/api/settings/payments'),
          fetch('/api/affiliates'),
          fetch('/api/services'),
          fetch('/api/laptops'),
          fetch('/api/products')
        ]);

        if (!isMounted) return;

        if (configRes.ok) setConfig(await configRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
        if (affiliatesRes.ok) setAffiliates(await affiliatesRes.json());
        if (servicesRes.ok) setServices(await servicesRes.json());
        if (laptopsRes.ok) setLaptops(await laptopsRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());

      } catch (err: any) {
        console.error('Error fetching landing page data:', err);
        if (isMounted) {
          setError(err.message || 'Gagal memuat data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLandingData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <LandingDataContext.Provider value={{ config, payments, laptops, products, affiliates, services, loading, error }}>
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
