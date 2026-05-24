import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RasyatechLanding from './components/RasyatechLanding';
import MasterAdmin from './components/MasterAdmin/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import ResetPassword from './components/ResetPassword';
import SplashScreen from './components/SplashScreen';
import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';
import { supabase } from './lib/supabase';

function AppRoutes() {
  const subdomain = useSubdomain();
  const navigate = useNavigate();

  useEffect(() => {
    // Capture recovery URL hash from Supabase and redirect to password reset route
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      navigate('/reset-password');
    }

    // Also handle PASSWORD_RECOVERY event triggers
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Landing Page only on main domain */}
      <Route path="/" element={!subdomain ? <RasyatechLanding /> : <Navigate to="/admin" />} />
      
      {/* SuperAdmin/MasterAdmin only on main domain */}
      <Route 
        path="/master-admin" 
        element={!subdomain ? <MasterAdmin /> : <Navigate to="/admin" />} 
      />
      
      {/* Password Reset Page */}
      <Route 
        path="/reset-password" 
        element={<ResetPassword />} 
      />
      
      {/* Tenant Admin only on subdomains */}
      <Route 
        path="/admin" 
        element={subdomain ? <TenantDashboard /> : <Navigate to="/master-admin" />} 
      />
      
      <Route 
        path="/affiliate/portal" 
        element={!subdomain ? <AffiliatePortal /> : <Navigate to="/admin" />} 
      />
      <Route 
        path="/login-sekolah" 
        element={subdomain ? <SchoolLogin /> : <Navigate to="/" />} 
      />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SubdomainProvider>
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
    </SubdomainProvider>
  );
}
