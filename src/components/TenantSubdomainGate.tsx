import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseTenantHostname, buildTenantRoutePath } from '../lib/tenant-host-parser';

/**
 * Client-side fallback bila middleware edge tidak mengubah pathname browser.
 * Redirect hostname tenant → /_lms|/_siput/[cleanSlug]
 */
export default function TenantSubdomainGate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const parsed = parseTenantHostname(window.location.hostname);
    if (!parsed) return;

    const alreadyRouted =
      location.pathname.startsWith('/_lms/') ||
      location.pathname.startsWith('/_siput/') ||
      location.pathname.startsWith('/_scanbite/') ||
      location.pathname.startsWith('/lms/') ||
      location.pathname.startsWith('/siput/') ||
      location.pathname.startsWith('/kuliner/') ||
      location.pathname === '/admin' ||
      location.pathname === '/login-sekolah';

    if (alreadyRouted) return;

    const target = buildTenantRoutePath(parsed);
    if (location.pathname === target || location.pathname.startsWith(`${target}/`)) return;

    console.log('[TenantSubdomainGate] redirect', {
      hostname: window.location.hostname,
      target,
    });
    navigate(target, { replace: true });
  }, [location.pathname, navigate]);

  return null;
}
