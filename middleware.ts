/**
 * Vercel Edge Middleware — redirect subdomain tenant ke rute SPA internal.
 */
import {
  parseTenantHostname,
  buildTenantRoutePath,
} from './src/lib/tenant-host-parser';

export const config = {
  matcher: ['/((?!api|assets|.*\\..*).*)'],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();

  const parsed = parseTenantHostname(hostname);

  console.log('[middleware][subdomain]', {
    host: hostname,
    path: url.pathname,
    tenant: parsed?.tenantSlug ?? null,
    pillar: parsed?.pillar ?? null,
  });

  if (!parsed) {
    return;
  }

  const tenantBasePath = buildTenantRoutePath(parsed);
  const currentPath = url.pathname;

  const alreadyRouted =
    currentPath.startsWith('/lms/') ||
    currentPath.startsWith('/siput/') ||
    currentPath.startsWith('/kuliner/');

  if (!alreadyRouted && (currentPath === '/' || currentPath === '')) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = tenantBasePath;
    console.log('[middleware][redirect]', hostname, '→', tenantBasePath);
    return Response.redirect(redirectUrl, 307);
  }
}
