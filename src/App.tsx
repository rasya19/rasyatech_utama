import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RasyatechLanding from './components/RasyatechLanding';
import SaaSManager from './components/SaaSManager';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import ResetPassword from './components/ResetPassword';
import SplashScreen from './components/SplashScreen';
import FormPendaftaranSaaS from './components/FormPendaftaranSaaS';
import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';
import { LandingDataProvider } from './lib/LandingDataContext';

function AppRoutes() {
  const subdomain = useSubdomain();
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Landing Page only on main domain */}
      <Route path="/" element={!subdomain ? <RasyatechLanding /> : <Navigate to="/admin" />} />
      
      {/* SuperAdmin/MasterAdmin only on main domain */}
      <Route 
        path="/master-admin" 
        element={!subdomain ? <SaaSManager /> : <Navigate to="/admin" />} 
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
      
      {/* Centralized Complaint Monitoring Portfolios redirected to MasterAdmin */}
      <Route path="/admin/monitoring" element={<Navigate to="/master-admin" />} />
            
      {/* Global SaaS Registration Form */}
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
