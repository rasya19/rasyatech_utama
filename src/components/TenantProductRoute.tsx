import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TenantDashboard from './TenantDashboard';
import SchoolLogin from './SchoolLogin';
import { parseTenantHostname } from '../lib/tenant-host-parser';

type TenantProductPillar = 'lms' | 'siput' | 'scanbite' | 'resto' | 'instafood' | 'kuliner';

type TenantProductRouteProps = {
  pillar: TenantProductPillar;
};

const PORTAL_TITLES: Record<TenantProductPillar, string> = {
  lms: 'Portal LMS',
  siput: 'Portal SIPUT',
  scanbite: 'Portal Scanbite',
  resto: 'Portal Resto',
  instafood: 'Portal Instafood',
  kuliner: 'Portal Kuliner',
};

export default function TenantProductRoute({ pillar }: TenantProductRouteProps) {
  const { subdomain: routeSubdomain } = useParams<{ subdomain: string }>();
  const parsed = parseTenantHostname(window.location.hostname);
  const subdomain = routeSubdomain || parsed?.routeTenantSlug || null;

  useEffect(() => {
    if (subdomain) {
      localStorage.setItem('current_tenant_subdomain', subdomain);
      localStorage.setItem('current_product_pillar', pillar);
      console.log(`[TenantProductRoute][${pillar}] subdomain=`, subdomain);
    }

    const previousTitle = document.title;
    document.title = subdomain
      ? `${PORTAL_TITLES[pillar]} — ${subdomain}`
      : PORTAL_TITLES[pillar];

    return () => {
      document.title = previousTitle;
    };
  }, [subdomain, pillar]);

  if (!subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        Subdomain tenant tidak ditemukan.
      </div>
    );
  }

  if (pillar === 'lms') {
    return <SchoolLogin portal="lms" tenantSubdomain={subdomain} />;
  }

  return <TenantDashboard portal={pillar} tenantSubdomain={subdomain} />;
}
