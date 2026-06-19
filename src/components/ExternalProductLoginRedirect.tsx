import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  buildExternalProductTenantLoginUrl,
  type ExternalProductKey,
} from '../lib/product-external-urls';

type ExternalProductLoginRedirectProps = {
  product: ExternalProductKey;
  tenantSubdomain: string;
};

/**
 * Arahkan subdomain tenant ke aplikasi produk asli (SIPUT / LMS),
 * bukan login placeholder monolith Rasyatech.
 */
export default function ExternalProductLoginRedirect({
  product,
  tenantSubdomain,
}: ExternalProductLoginRedirectProps) {
  useEffect(() => {
    const target = buildExternalProductTenantLoginUrl(product, tenantSubdomain);
    console.log(`[ExternalProductLoginRedirect][${product}]`, {
      tenantSubdomain,
      target,
    });
    window.location.replace(target);
  }, [product, tenantSubdomain]);

  const label = product === 'siput' ? 'SIPUT' : 'LMS';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-6 text-center">
      <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      <p className="text-slate-700 font-semibold">Mengalihkan ke portal {label}…</p>
      <p className="text-sm text-slate-500 font-mono">{tenantSubdomain}</p>
    </div>
  );
}
