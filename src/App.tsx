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
import DashboardSekolahCallback from './components/DashboardSekolahCallback';
import TenantSubdomainGate from './components/TenantSubdomainGate';
import TenantProductRoute from './components/TenantProductRoute';
import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';
import { LandingDataProvider } from './lib/LandingDataContext';
import { supabase } from './lib/supabase';
import { isMainDomainHostname } from './lib/subdomain-utils';

function LandingOrRedirect() {
  const subdomain = useSubdomain();
  if (subdomain && !isMainDomainHostname(window.location.hostname)) {
    return <Navigate to="/admin" replace />;
  }
  return <RasyatechLanding />;
}

/** Domain utama → Master Admin; subdomain tenant → dashboard tenant. */
function AdminEntry() {
  const subdomain = useSubdomain();
  const onMainDomain = isMainDomainHostname(window.location.hostname);

  if (!onMainDomain && subdomain) {
    return <TenantDashboard />;
  }

  return <MasterAdmin />;
}

function AppRoutes() {
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
    <>
      <TenantSubdomainGate />
      <Routes>
        <Route path="/" element={<LandingOrRedirect />} />

        <Route path="/master-admin" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminEntry />} />

        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard-sekolah" element={<DashboardSekolahCallback />} />

        <Route path="/lms/:subdomain" element={<TenantProductRoute pillar="lms" />} />
        <Route path="/siput/:subdomain" element={<TenantProductRoute pillar="siput" />} />
        <Route path="/kuliner/:subdomain" element={<TenantProductRoute pillar="kuliner" />} />

        <Route path="/affiliate/portal" element={<AffiliatePortal />} />
        <Route path="/login-sekolah" element={<SchoolLogin />} />
        <Route path="/admin/monitoring" element={<MonitoringDashboard />} />
        <Route path="/daftar" element={<FormPendaftaranSaaS />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
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
