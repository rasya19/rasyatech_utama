import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import TenantDashboard from './TenantDashboard';
import SchoolLogin from './SchoolLogin';

type TenantProductRouteProps = {
  pillar: 'lms' | 'siput' | 'kuliner';
};

export default function TenantProductRoute({ pillar }: TenantProductRouteProps) {
  const { subdomain } = useParams<{ subdomain: string }>();

  useEffect(() => {
    if (subdomain) {
      localStorage.setItem('current_tenant_subdomain', subdomain);
      localStorage.setItem('current_product_pillar', pillar);
      console.log(`[TenantProductRoute][${pillar}] subdomain=`, subdomain);
    }
  }, [subdomain, pillar]);

  if (!subdomain) {
    return <Navigate to="/" replace />;
  }

  if (pillar === 'lms') {
    return <SchoolLogin />;
  }

  // SIPUT & Kuliner → dashboard admin tenant
  return <TenantDashboard />;
}
