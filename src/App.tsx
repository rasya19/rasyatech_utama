import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RasyatechLanding from './components/RasyatechLanding';
import MasterAdmin from './components/MasterAdmin/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import ResetPassword from './components/ResetPassword';
import SplashScreen from './components/SplashScreen';
import MonitoringDashboard from './components/MasterAdmin/MonitoringDashboard';
import FormPendaftaranSaaS from './components/FormPendaftaranSaaS';
import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';
import { LandingDataProvider } from './lib/LandingDataContext';
import { supabase } from './lib/supabase';
import DashboardSekolahCallback from './components/DashboardSekolahCallback';

function AppRoutes() {
  const subdomain = useSubdomain();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      navigate('/reset-password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={!subdomain ? <RasyatechLanding /> : <Navigate to="/admin" />} />
      
      {/* SuperAdmin/MasterAdmin */}
      <Route path="/master-admin" element={<MasterAdmin />} />
      
      {/* Password Reset */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Callback untuk magic link */}
      <Route path="/dashboard-sekolah" element={<DashboardSekolahCallback />} />
      
      {/* Tenant Admin - SELALU tampilkan TenantDashboard */}
      <Route path="/admin" element={<TenantDashboard />} />
      
      {/* Affiliate Portal */}
      <Route path="/affiliate/portal" element={<AffiliatePortal />} />
      
      {/* Login Sekolah */}
      <Route path="/login-sekolah" element={<SchoolLogin />} />
      
      {/* Monitoring */}
      <Route path="/admin/monitoring" element={<MonitoringDashboard />} />
      
      {/* Global SaaS Registration */}
      <Route path="/daftar" element={<FormPendaftaranSaaS />} />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SubdomainProvider>
      <LandingDataProvider>
        <Router>
          {showSplash && (
            <SplashScreen 
              onComplete={() => {
                setShowSplash(false);
              }} 
            />
          )}
          <AppRoutes />
        </Router>
      </LandingDataProvider>
    </SubdomainProvider>
  );
}
