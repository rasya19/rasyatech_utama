import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RasyatechLanding from './components/RasyatechLanding';
import MasterAdmin from './components/MasterAdmin/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import ResetPassword from './components/ResetPassword';
import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';
import { supabase } from './lib/supabase';

function AppRoutes() {
  const subdomain = useSubdomain();
  const navigate = useNavigate();
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    // 1. Cek langsung dari URL Hash sebelum dihapus Supabase
    const hasRecoveryHash = window.location.hash && window.location.hash.includes('type=recovery');
    
    if (hasRecoveryHash) {
      setIsRecovering(true);
      navigate('/reset-password', { replace: true });
      return;
    }

    // 2. Handle lewat Event Listener Supabase (paling akurat)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
        navigate('/reset-password', { replace: true });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Jika sedang mendeteksi recovery, tahan render komponen lain agar tidak ter-lempar oleh Route "*"
  if (isRecovering && window.location.pathname !== '/reset-password') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 font-medium">Menyiapkan pemulihan akun...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Password Reset Page (Ditaruh paling atas agar prioritas) */}
      <Route 
        path="/reset-password" 
        element={<ResetPassword />} 
      />

      {/* Landing Page only on main domain */}
      <Route path="/" element={!subdomain ? <RasyatechLanding /> : <Navigate to="/admin" />} />
      
      {/* SuperAdmin/MasterAdmin only on main domain */}
      <Route 
        path="/master-admin" 
        element={!subdomain ? <MasterAdmin /> : <Navigate to="/admin" />} 
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
  return (
    <SubdomainProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SubdomainProvider>
  );
}
