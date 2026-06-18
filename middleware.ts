/**
 * Vercel Edge Middleware — bypass aset statis + rewrite subdomain tenant.
 */
import { isApexLandingHostname } from './src/lib/tenant-host-parser';
import { resolveMiddlewareRewriteWithDb } from './src/lib/middleware-tenant-lookup';

const STATIC_FILE_PATTERN =
  /\.(?:png|jpe?g|gif|webp|svg|ico|js|css|woff2?|ttf|eot|map|json|txt|xml)$/i;

const STATIC_EXACT_PATHS = new Set([
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  '/icon-192x192.png',
  '/icon-512x512.png',
]);

const INTERNAL_ROUTE_PREFIXES = [
  '/_lms/',
  '/_siput/',
  '/_scanbite/',
  '/_resto/',
  '/_instafood/',
  '/lms/',
  '/siput/',
  '/kuliner/',
] as const;

function isStaticAssetRequest(pathname: string): boolean {
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/assets/')) return true;
  if (STATIC_EXACT_PATHS.has(pathname)) return true;
  if (STATIC_FILE_PATTERN.test(pathname)) return true;
  return false;
}

function isAlreadyInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function logMiddlewareDecision(
  hostname: string,
  pathname: string,
  rewriteTarget: string,
  extra?: Record<string, unknown>
) {
  console.log('[middleware] Detected Hostname:', hostname);
  console.log('[middleware] Detected Path:', pathname);
  console.log('[middleware] Final Rewrite Target:', rewriteTarget);
  if (extra) {
    console.log('[middleware] Context:', extra);
  }
}

function middlewareRewrite(
  request: Request,
  targetPath: string,
  cleanTenantSlug: string,
  productRoute?: string
): Response {
  const url = new URL(request.url);
  const rewriteUrl = new URL(targetPath, url.origin);
  rewriteUrl.search = url.search;
  const rewriteTarget = `${rewriteUrl.pathname}${rewriteUrl.search}`;

  logMiddlewareDecision(url.hostname, url.pathname, rewriteTarget, {
    tenant_slug: cleanTenantSlug,
    product_route: productRoute,
  });

  return new Response(null, {
    headers: {
      'x-middleware-rewrite': rewriteTarget,
      'x-tenant-slug': cleanTenantSlug,
      ...(productRoute ? { 'x-tenant-product': productRoute } : {}),
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next|assets|favicon\\.ico|manifest\\.json|sw\\.js|robots\\.txt|sitemap\\.xml|icon-192x192\\.png|icon-512x512\\.png|.*\\.(?:png|ico|js|css|svg|webp|woff2?|ttf|json|map|txt|xml)$).*)',
  ],
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const hostname = (request.headers.get('host') || url.hostname).split(':')[0].toLowerCase();
  const pathname = url.pathname;

  if (isStaticAssetRequest(pathname)) {
    return;
  }

  if (pathname === '/master-admin' || pathname.startsWith('/master-admin/')) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = pathname.replace(/^\/master-admin/, '/admin') || '/admin';
    return Response.redirect(redirectUrl, 308);
  }

  if (isApexLandingHostname(hostname)) {
    logMiddlewareDecision(hostname, pathname, '(passthrough — apex landing)');
    return;
  }

  if (isAlreadyInternalRoute(pathname)) {
    return;
  }

  const resolved = await resolveMiddlewareRewriteWithDb(hostname, pathname);
  if (!resolved) {
    logMiddlewareDecision(hostname, pathname, '(passthrough — hostname bukan tenant)');
    return;
  }

  return middlewareRewrite(
    request,
    resolved.targetPath,
    resolved.cleanTenantSlug,
    resolved.productRoute
  );
}
