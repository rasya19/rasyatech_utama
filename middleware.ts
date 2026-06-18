/**
 * Vercel Edge Middleware — bypass aset statis + rewrite subdomain tenant.
 * Hostname tidak dikenal → 404 (bukan redirect ke LMS / .vercel.app).
 */
import {
  isApexLandingHostname,
  isDevPreviewHostname,
  hostnameHasTenantSubdomain,
} from './src/lib/tenant-host-parser';
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

function unknownTenantHtml(hostname: string): string {
  const safeHost = hostname.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 — Tenant Tidak Ditemukan</title>
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #0A0F1E; color: #e2e8f0; font-family: system-ui, sans-serif; padding: 24px; }
    .card { max-width: 480px; text-align: center; background: #151C30; border: 1px solid #1e293b;
      border-radius: 24px; padding: 40px 32px; }
    h1 { font-size: 4rem; margin: 0 0 8px; color: #f43f5e; }
    h2 { margin: 0 0 12px; font-size: 1.25rem; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; }
    code { color: #fff; background: #0f172a; padding: 2px 8px; border-radius: 6px; }
    a { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #2563eb;
      color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>404</h1>
    <h2>Tenant Tidak Ditemukan</h2>
    <p>Hostname <code>${safeHost}</code> tidak terdaftar di ekosistem Rasyatech atau subdomain belum aktif.</p>
    <p>Periksa URL tenant Anda atau hubungi support jika pendaftaran sudah disetujui.</p>
    <a href="https://rasyatech.com">Kembali ke Beranda</a>
  </div>
</body>
</html>`;
}

function unknownTenantResponse(hostname: string): Response {
  return new Response(unknownTenantHtml(hostname), {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
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

  if (isDevPreviewHostname(hostname)) {
    logMiddlewareDecision(hostname, pathname, '(passthrough — dev preview, tanpa rewrite tenant)');
    return;
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
    if (hostnameHasTenantSubdomain(hostname)) {
      logMiddlewareDecision(hostname, pathname, '(404 — tenant tidak dikenal)');
      return unknownTenantResponse(hostname);
    }
    logMiddlewareDecision(hostname, pathname, '(passthrough — hostname non-tenant)');
    return;
  }

  return middlewareRewrite(
    request,
    resolved.targetPath,
    resolved.cleanTenantSlug,
    resolved.productRoute
  );
}
