<<<<<<< HEAD
import React, { createContext, useContext, useEffect, useState } from 'react';
=======
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

// ─── Legacy context (subdomain string only) ───────────────────────────────────
>>>>>>> origin/main

const SubdomainContext = createContext<string | null>(null);

export const SubdomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
<<<<<<< HEAD
    
    // Main domain identification based on user's rasyatech.rsch.my.id setup
    let isMain = parts[0] === 'rasyatech' || parts[0] === 'www' || parts.length < 3;

    // If we are in the Google Cloud Run preview environment (ends with .run.app) or localhost,
    // we default to main domain behavior (subdomain = null) so the user can preview the main app.
    if (hostname.endsWith('.run.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
      isMain = true;
    }

    if (!isMain) {
      setSubdomain(parts[0]);
    } else {
      setSubdomain(null); // Main domain behavior
    }
  }, []);

  return (
    <SubdomainContext.Provider value={subdomain}>
      {children}
    </SubdomainContext.Provider>
=======

    let isMain =
      parts[0] === 'rasyatech' ||
      parts[0] === 'www' ||
      parts.length < 3;

    if (
      hostname.endsWith('.run.app') ||
      hostname.endsWith('.vercel.app') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    ) {
      isMain = true;
    }

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
>>>>>>> origin/main
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
