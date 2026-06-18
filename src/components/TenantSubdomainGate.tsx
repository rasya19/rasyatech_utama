import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseTenantHostname, buildTenantRoutePath } from '../lib/tenant-host-parser';
import { useSubdomainRouter } from '../lib/SubdomainRouter';

/**
 * Client-side fallback bila middleware edge tidak jalan (dev lokal / preview).
 * Redirect `/` pada hostname tenant → /lms|/siput|/kuliner/[subdomain]
 */
export default function TenantSubdomainGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productType, loading } = useSubdomainRouter();

  useEffect(() => {
    const parsed = parseTenantHostname(window.location.hostname);
    if (!parsed) return;

    const alreadyRouted =
      location.pathname.startsWith('/lms/') ||
      location.pathname.startsWith('/siput/') ||
      location.pathname.startsWith('/kuliner/') ||
      location.pathname === '/admin' ||
      location.pathname === '/login-sekolah';

    if (alreadyRouted) return;
    if (location.pathname !== '/' && location.pathname !== '') return;
    if (loading) return;

    const target = buildTenantRoutePath(parsed, productType);
    console.log('[TenantSubdomainGate] redirect', {
      hostname: window.location.hostname,
      productType,
      target,
    });
    navigate(target, { replace: true });
  }, [location.pathname, loading, navigate, productType]);

  return null;
}
