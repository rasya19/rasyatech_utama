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
import {
  isTenantHostname,
  isUnresolvedTenantHostname,
  parseTenantHostname,
  resolveTenantProductPillarFromParsed,
  shouldSkipLandingSplash,
  isRasyatechPortalHostname,
} from './lib/subdomain-utils';
import UnknownTenantHost from './components/UnknownTenantHost';

type TenantProductPillar = 'lms' | 'siput' | 'scanbite' | 'resto' | 'instafood' | 'kuliner';

function mapParsedPillar(parsed: NonNullable<ReturnType<typeof parseTenantHostname>>): TenantProductPillar {
  const pillar = resolveTenantProductPillarFromParsed(parsed);
  if (pillar === 'scanbite' || pillar === 'resto' || pillar === 'instafood') return pillar;
  return pillar;
}

function LandingOrRedirect() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (pathname === '/login' || pathname === '/login-sekolah') {
    const parsed = parseTenantHostname(hostname);
    const pillar = parsed? resolveTenantProductPillarFromParsed(parsed) : null;
    
    if (pillar === 'siput') {
      return <SchoolLogin />;
    }
    return <Navigate to="/" replace />;
  }

  if (isUnresolvedTenantHostname(hostname)) {
    return <UnknownTenantHost />;
  }

  if (isTenantHostname(hostname)) {
    const parsed = parseTenantHostname(hostname);
    if (!parsed) {
      return <UnknownTenantHost />;
    }
    return <TenantProductRoute pillar={mapParsedPillar(parsed)} />;
  }

  return <RasyatechLanding />;
}

function AdminEntry() {
  const hostname = window.location.hostname;
  const subdomain = useSubdomain();

  if (isRasyatechPortalHostname(hostname)) {
    return <MasterAdmin />;
  }

  if (isTenantHostname(hostname) && subdomain) {
    return <TenantDashboard />;
  }

  return <MasterAdmin />;
}

function TenantCatchAll() {
  const hostname = window.location.hostname;
  if (isUnresolvedTenantHostname(hostname)) {
    return <UnknownTenantHost />;
  }
  if (isTenantHostname(hostname)) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/" replace />;
}

function AppRoutes() {
  const navigate = useNavigate();
  const hostname = window.location.hostname;
  const parsed = parseTenantHostname(hostname);
  const pillar = parsed? resolveTenantProductPillarFromParsed(parsed) : null;

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
        <Route 
          path="/login" 
          element={
            pillar === 'siput' 
             ? <SchoolLogin /> 
              : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/login-sekolah" 
          element={
            pillar === 'siput' 
             ? <SchoolLogin /> 
              : <Navigate to="/" replace />
          } 
        />
        
        <Route path="/" element={<LandingOrRedirect />} />

        <Route path="/master-admin" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminEntry />} />

        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard-sekolah" element={<DashboardSekolahCallback />} />

        <Route path="/_lms/:subdomain/*" element={<TenantProductRoute pillar="lms" />} />
        <Route path="/_siput/:subdomain/*" element={<TenantProductRoute pillar="siput" />} />
        <Route path="/_scanbite/:subdomain/*" element={<TenantProductRoute pillar="scanbite" />} />
        <Route path="/_resto/:subdomain/*" element={<TenantProductRoute pillar="resto" />} />
        <Route path="/_instafood/:subdomain/*" element={<TenantProductRoute pillar="instafood" />} />
        <Route path="/lms/:subdomain" element={<TenantProductRoute pillar="lms" />} />
        <Route path="/siput/:subdomain" element={<TenantProductRoute pillar="siput" />} />
        <Route path="/kuliner/:subdomain" element={<TenantProductRoute pillar="kuliner" />} />

        <Route path="/affiliate/portal" element={<AffiliatePortal />} />
        <Route path="/admin/monitoring" element={<MonitoringDashboard />} />
        <Route path="/daftar" element={<FormPendaftaranSaaS />} />

        <Route path="*" element={<TenantCatchAll />} />
      </Routes>
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true;
    return!shouldSkipLandingSplash(window.location.hostname, window.location.pathname);
  });

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
