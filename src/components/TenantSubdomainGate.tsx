import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseTenantHostname, isInternalTenantPath } from '../lib/tenant-host-parser';

/**
 * Pada hostname tenant: sembunyikan path internal /_siput/... di bilah URL → tetap `/`.
 */
export default function TenantSubdomainGate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const parsed = parseTenantHostname(window.location.hostname);
    if (!parsed) return;

    const reservedPaths =
      location.pathname === '/admin' ||
      location.pathname.startsWith('/admin/') ||
      location.pathname === '/reset-password' ||
      location.pathname === '/login-sekolah' ||
      location.pathname === '/daftar';

    if (reservedPaths) return;

    if (isInternalTenantPath(location.pathname)) {
      console.log('[TenantSubdomainGate] clean URL', {
        hostname: window.location.hostname,
        from: location.pathname,
        to: '/',
      });
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}
