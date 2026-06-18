/**
 * SubdomainContext – backward-compatible shim
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubdomainRouterProvider } from './SubdomainRouter';
import { getSubdomainFromHostname } from './subdomain-utils';

const SubdomainContext = createContext<string | null>(null);

export const SubdomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const tenantSlug = getSubdomainFromHostname(hostname);
    console.log('[SubdomainContext] hostname=', hostname, 'tenantSlug=', tenantSlug);
    setSubdomain(tenantSlug);
  }, []);

  return (
    <SubdomainRouterProvider>
      <SubdomainContext.Provider value={subdomain}>
        {children}
      </SubdomainContext.Provider>
    </SubdomainRouterProvider>
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
