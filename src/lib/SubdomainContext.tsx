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
    setSubdomain(getSubdomainFromHostname(window.location.hostname));
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
