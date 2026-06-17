/**
 * SubdomainContext – backward-compatible shim
 *
 * All new code should import from SubdomainRouter.tsx which provides
 * full product-type resolution.  This file keeps the legacy API intact
 * so existing components (App.tsx, TenantDashboard.tsx, etc.) continue
 * to work without modification.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubdomainRouterProvider } from './SubdomainRouter';
import { getSubdomainFromHostname } from './subdomain-utils';

// ─── Legacy context (subdomain string only) ───────────────────────────────────

const SubdomainContext = createContext<string | null>(null);

export const SubdomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Deteksi main domain
  let isMain = false;
  
  // Case: localhost / vercel preview
  if (
    hostname.endsWith('.run.app') ||
    hostname.endsWith('.vercel.app') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    isMain = true;
  }
  
  // Case: siput.rsch.my.id (3 parts) - main domain, not tenant
  else if (parts.length === 3 && (parts[0] === 'siput' || parts[0] === 'lms' || parts[0] === 'kesetaraan')) {
    isMain = true;
  }
  
  // Case: rsch.my.id (2 parts) - main domain
  else if (parts.length === 2) {
    isMain = true;
  }
  
  // Case: tenant.siput.rsch.my.id (4 parts) - extract tenant
  else if (parts.length >= 4) {
    const tenant = parts[0];
    const product = parts[1];
    
    // Validasi tenant bukan 'www' atau produk yang dikenal
    if (tenant !== 'www' && (product === 'siput' || product === 'lms')) {
      console.log('Tenant detected:', tenant, 'Product:', product);
      setSubdomain(tenant);
      return;
    }
  }

  console.log('Is main domain:', isMain, 'hostname:', hostname);
  setSubdomain(isMain ? null : parts[0]);
}, []);

  return (
    // Wrap with SubdomainRouterProvider so new hooks (useSubdomainRouter,
    // useProductType, ProductRoute) work anywhere inside the tree.
    <SubdomainRouterProvider>
      <SubdomainContext.Provider value={subdomain}>
        {children}
      </SubdomainContext.Provider>
    </SubdomainRouterProvider>
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
