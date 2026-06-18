/**
 * Vercel Edge Middleware — bypass aset statis + rewrite subdomain tenant.
 */
import {
  LMS_INSTITUTIONAL_MARKERS,
  SIPUT_INSTITUTIONAL_MARKERS,
  slugMatchesInstitutionalMarker,
  stripInstitutionalPrefixFromSlug,
  getTenantBaseDomain,
  parseTenantHostname,
  buildTenantRoutePath,
} from './src/lib/tenant-host-parser';

const STATIC_FILE_PATTERN =
  /\.(?:png|jpe?g|gif|webp|svg|ico|js|css|woff2?|ttf|eot|map|json|txt|xml)$/i;

const STATIC_EXACT_PATHS = new Set([
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
]);

function isStaticAssetRequest(pathname: string): boolean {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/assets/')) return true;
  if (STATIC_EXACT_PATHS.has(pathname)) return true;
  if (STATIC_FILE_PATTERN.test(pathname)) return true;
  return false;
}

function isApexLandingHostname(hostname: string): boolean {
  const base = getTenantBaseDomain();
  return hostname === base || hostname === `www.${base}`;
}

function extractHostnameSubdomain(hostname: string): string | null {
  const base = getTenantBaseDomain();
  const parts = hostname.split('.');
  const baseParts = base.split('.');

  if (parts.slice(-baseParts.length).join('.') !== base) {
    return parts.length >= 3 ? parts[0] : null;
  }

  const prefix = parts.slice(0, parts.length - baseParts.length);
  if (prefix.length !== 1) return null;
  return prefix[0];
}

function buildInstitutionalRewriteTarget(
  hostname: string,
  pathname: string
): string | null {
  const subdomain = extractHostnameSubdomain(hostname);
  if (!subdomain) return null;

  const cleanSlug = stripInstitutionalPrefixFromSlug(subdomain);
  const suffix = pathname === '/' ? '' : pathname;

  if (slugMatchesInstitutionalMarker(subdomain, LMS_INSTITUTIONAL_MARKERS)) {
    return `/_lms/${cleanSlug}${suffix}`;
  }

  if (slugMatchesInstitutionalMarker(subdomain, SIPUT_INSTITUTIONAL_MARKERS)) {
    return `/_siput/${cleanSlug}${suffix}`;
  }

  return null;
}

function middlewareRewrite(request: Request, targetPath: string): Response {
  const url = new URL(request.url);
  const rewriteUrl = new URL(targetPath, url.origin);
  rewriteUrl.search = url.search;

  const rewriteTarget = `${rewriteUrl.pathname}${rewriteUrl.search}`;

  console.log('[middleware] Detected Hostname:', url.hostname);
  console.log('[middleware] Detected Path:', url.pathname);
  console.log('[middleware] Final Rewrite Target:', rewriteTarget);

  return new Response(null, {
    headers: {
      'x-middleware-rewrite': rewriteTarget,
      'x-tenant-slug': rewriteUrl.pathname.split('/')[2] || '',
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next|assets|favicon\\.ico|manifest\\.json|sw\\.js|robots\\.txt|sitemap\\.xml|.*\\.(?:png|ico|js|css|svg|webp|woff2?|ttf|json|map|txt|xml)$).*)',
  ],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const hostname = (request.headers.get('host') || url.hostname).split(':')[0].toLowerCase();
  const pathname = url.pathname;

  if (isStaticAssetRequest(pathname)) {
    return;
  }

  if (url.pathname === '/master-admin' || url.pathname.startsWith('/master-admin/')) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = url.pathname.replace(/^\/master-admin/, '/admin') || '/admin';
    return Response.redirect(redirectUrl, 308);
  }

  if (isApexLandingHostname(hostname)) {
    console.log('[middleware] Detected Hostname:', hostname);
    console.log('[middleware] Detected Path:', pathname);
    console.log('[middleware] Final Rewrite Target:', '(passthrough — landing apex)');
    return;
  }

  const alreadyInternal =
    pathname.startsWith('/_lms/') ||
    pathname.startsWith('/_siput/') ||
    pathname.startsWith('/lms/') ||
    pathname.startsWith('/siput/') ||
    pathname.startsWith('/kuliner/');

  if (alreadyInternal) {
    return;
  }

  const institutionalTarget = buildInstitutionalRewriteTarget(hostname, pathname);
  if (institutionalTarget) {
    return middlewareRewrite(request, institutionalTarget);
  }

  const parsed = parseTenantHostname(hostname);
  if (!parsed) {
    console.log('[middleware] Detected Hostname:', hostname);
    console.log('[middleware] Detected Path:', pathname);
    console.log('[middleware] Final Rewrite Target:', '(passthrough — bukan tenant)');
    return;
  }

  const fallbackTarget = buildTenantRoutePath(parsed);
  if (pathname === '/' || pathname === '') {
    return middlewareRewrite(request, fallbackTarget);
  }

  const slug = parsed.cleanTenantSlug || parsed.tenantSlug;
  const prefix =
    parsed.pillar === 'siput'
      ? `/_siput/${slug}`
      : parsed.pillar === 'kuliner'
        ? `/kuliner/${slug}`
        : `/_lms/${slug}`;

  return middlewareRewrite(request, `${prefix}${pathname}`);
}
