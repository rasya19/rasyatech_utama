import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RasyatechLanding from './components/RasyatechLanding';
import MasterAdmin from './components/MasterAdmin/Dashboard';
import TenantDashboard from './components/TenantDashboard';
import AffiliatePortal from './components/AffiliatePortal';
import SchoolLogin from './components/SchoolLogin';
import ResetPassword from './components/ResetPassword';
import Login from './components/Login'; // <-- IMPORT BARU
import { SubdomainProvider, useSubdomain } from './lib/SubdomainContext';

function AppRoutes() {
  const subdomain = useSubdomain();

  return (
    <Routes>
      <Route path="/" element={!subdomain ? <RasyatechLanding /> : <Navigate to="/admin" />} />
      
      {/* Login Super Admin - main domain */}
      <Route 
        path="/login" 
        element={!subdomain ? <Login /> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/reset-password" 
        element={!subdomain ? <ResetPassword /> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/master-admin" 
        element={!subdomain ? <MasterAdmin /> : <Navigate to="/admin" />} 
      />
      
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
